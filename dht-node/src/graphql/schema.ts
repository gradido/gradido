import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import isAuthorized from './directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'
import Decimal from 'decimal.js-light'
import { getApiResolvers } from './api/schema'

const schema = async (): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: [getApiResolvers()],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
