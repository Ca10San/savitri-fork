import * as R from 'ramda'
import type { Request, ResponseToolkit } from '@hapi/hapi'
import type { HandlerRequest, DecodedToken } from '../types'

import { getController } from '../core/controller'
import { TokenService } from '../core/services/token'
import { FileController } from '../../collections/file/file.controller'

import { appendPagination } from './hooks/post'
import { prependPagination } from './hooks/pre'

export type RegularVerb =
  'get'
  | 'getAll'
  | 'insert'
  | 'modify'
  | 'delete'
  | 'deleteAll'

const prePipe = R.pipe(
  prependPagination
)

const postPipe = R.pipe(
  appendPagination
)

export const getToken = async (request: Request) => request.headers.authorization
  ? TokenService.decode(request.headers.authorization.split('Bearer ').pop() || '')
  : {} as object

export const safeHandle = (
  fn: (request: HandlerRequest, h: ResponseToolkit) => object
) => async (request: HandlerRequest, h: ResponseToolkit) => {
  try {
    const response = await fn(request, h)
    if( !response ) {
      throw new Error('empty response')
    }

    return response

  } catch(error: any) {
    if( process.env.NODE_ENV !== 'production' ) {
      console.trace(error)
    }

    return {
      error: {
        name: error.name,
        code: error.code,
        message: error.message
      }
    }
  }
}

export const safeHandleProvide = (
  fn: (request: HandlerRequest, h: ResponseToolkit, provide: Record<string, any>) => object,
  provide: Record<string, any>
) => {
  const fn2 = (r: HandlerRequest, h: ResponseToolkit) => fn(r, h, provide)
  return safeHandle(fn2)
}

export const customVerbs = (type: 'collections'|'controllables') =>
  async (
  request: HandlerRequest,
  h: ResponseToolkit,
  provide?: Record<string, any>
) => {
    const {
      params: {
        controller,
        verb
      }
    } = request

    const Controller = getController(controller, type)
    const instance = new Controller
    instance.injected = provide

    const token = await getToken(request) as DecodedToken
    const method = (instance.webInterface||instance)[verb]

    prePipe(request, h, token)
    const result = await method(request, h, token)

    const mime = instance.rawType(verb)
    if( mime ) {
      return h.response(result)
        .header('Content-Type', mime)
    }

    return postPipe(result, instance, request)
}

export const regularVerb = (verb: RegularVerb) =>
  async (request: HandlerRequest, h: ResponseToolkit, provide?: Record<string, any>) => {
  const {
    controller,
    id
  } = request.params||{}

  const Controller = getController(controller)
  const _instance = new Controller
  const instance = _instance.webInterface
  instance.injected = provide

  const token = await getToken(request) as DecodedToken

  prePipe(request, h, token)
  const requestCopy = Object.assign(request, { payload: {} })

  if( id ) {
    requestCopy.payload.filters = {
      ...requestCopy.payload.filters||{},
      _id: id
    }

    if( 'what' in requestCopy.payload ) {
      requestCopy.payload.what._id = id
    }
  }

  const result = await instance[verb](requestCopy, h, token)
  return postPipe(result, _instance, request)
}

export const fileDownload = async (request: HandlerRequest, h: ResponseToolkit) => {
  const instance = new FileController

  const { hash, options } = request.params
  const { filename, content, mime } = await instance.download(hash)

  const parsedOptions = (options||'').split(',')
  const has = (opt: string) => parsedOptions.includes(opt)

  return h.response(content)
    .header('Content-Type', mime)
    .header('Content-Disposition', `${has('download') ? 'attachment; ' : ''}filename=${filename}`)
}
