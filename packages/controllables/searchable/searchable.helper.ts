import type { CollectionDescription } from '../../common/types'
import { getController } from '../../api/core/controller'
import { MetaController } from '../meta/meta.controller'

const __searchable: Record<string, CollectionDescription> = {}

export const getSearchables = () => {
  if( Object.keys(__searchable).length > 0 ) {
    return __searchable
  }

  const descriptions = new MetaController().describeAll()

  const searchable = Object.entries(descriptions)
    .reduce((a: any, [key, description]: [string, any]) => {
      if( !description.searchable?.indexes || description.alias ) {
        return a
      }

      const indexes = description.searchable.indexes.reduce((a: any, index: string) => {
        const field = description.fields[index]
        if( !field ) {
          return a
        }

        if( field.collection || field.values?.[0]?.__query ) {
          throw new Error('searchable index cannot be a reference')
        }

        const { label, type } = field

        return {
          ...a,
          [index]: {
            label,
            type
          }
        }
      }, {})

      // force model registration
      getController(key)

      return {
        ...a,
        [key]: {
          ...description.searchable,
          indexes
        }
      }
  }, {})

  Object.assign(__searchable, searchable)
  return searchable
}

export const buildAggregations = (
  searchables: any,
  query: Array<string>,
  queryFilters: any
) => {
  const aggregations: Record<string, any> = {}

  Object.entries(searchables).forEach(([collectionName, config]: [string, any]) => {
    const matches = Object.entries(config.indexes).reduce((a: any, [indexName, index]: [string, any]) => {
      const getType: any = (q: any) => {
        switch(index.type) {
          case 'number':
          case 'integer':
          case 'float':
            return Number(q)
          case 'text':
          default:
            return {
              $regex: q,
              $options: 'i'
          }
        }
      }

      return {
        $or: [
          ...a.$or,
          ...query.map((q: string) => ({ [indexName]: getType(q) }))
        ]
      }

    }, { $or: [] })

    const project = Object.keys(config.indexes)
      .reduce((a: any, index: string) => ({ ...a, [index]: 1 }), {})

    if( config.picture ) {
      project._picture = `$${config.picture}`
    }

    if( queryFilters ) {
      Object.assign(matches, queryFilters(collectionName))
    }

    aggregations[collectionName] = [
      { $match: matches },
      { $limit: 5 },
      { $project: project }
    ]
  })

  return aggregations
}

