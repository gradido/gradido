import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

// import isAuthorized from './directive/isAuthorized'
import { DecimalScalar } from '@/graphql/scalar/Decimal'

import { getApiResolvers } from './api/schema'

export const schema = async (apiVersion: string): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: getApiResolvers(apiVersion),
    authChecker: () => true,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}
