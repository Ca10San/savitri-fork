import { createHash } from 'crypto'
const { writeFile, readFile, unlink } = require('fs').promises

import { FileDocument, File } from './file.model'
import { Mutable, SingleQuery } from '../../api/core/controller'
import { default as Description } from './index.json'

const { STORAGE_PATH } = process.env

export class FileController extends Mutable<FileDocument> {
  constructor() {
    super(File, Description)
  }

  public override async insert(
    props: { what: Pick<FileDocument,
      'filename'
      | 'owner'
      | 'context'
      | 'content'
      | 'absolute_path'
      > },
    decodedToken: any
  ) {
    if( !STORAGE_PATH ) {
      throw new Error('STORAGE_PATH is not set in the environment')
    }

    if( !props.what.context ) {
      throw new Error('context is not set')
    }

    const what = Object.assign({}, props.what)
    what.owner = decodedToken.access._id

    const extension = what.filename?.split('.').pop()
    if( !extension ) {
      throw new Error('filename lacks extension')
    }

    const oldFile = await File.findOne({
      $and: [
        { owner: what.owner },
        { context: what.context }
      ]
    }).sort({ created_at: -1 })

    if( oldFile ) {
      if( oldFile.immutable === true ) {
        throw new Error('você não pode mais editar esse arquivo')
      }

      try {
        await unlink(oldFile.absolute_path)
        await File.deleteOne({ _id: oldFile._id })

      } catch( error ) {
        console.trace(error)
      }
    }

    const filenameHash = createHash('sha1')
      .update(what.filename + Date.now())
      .digest('hex')

    what.absolute_path = `${STORAGE_PATH}/${filenameHash}.${extension}`
    await writeFile(what.absolute_path, Buffer.from(what.content.split(',').pop()!, 'base64'))

    return super.insert.call(this, { what }, decodedToken)
  }

  public override async delete(props: { filters: any }): Promise<SingleQuery<FileDocument>|void> {
    const file = await File.findOne(props.filters)
    if( file ) {
      await unlink(file.absolute_path)
      return await super.delete.call(this, props)
    }

    return Promise.resolve()
  }

  public async download(_id: string): Promise<Omit<FileDocument, 'content'> & { content: Buffer }> {
    const file = await File.findOne({ _id }).lean()
    if( !file ) {
      throw new Error('file not found')
    }

    const content = await readFile(file.absolute_path)
    return {
      ...file,
      content: Buffer.from(content, 'base64')
    }
  }
}
