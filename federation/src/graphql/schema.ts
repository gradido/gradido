import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

import isAuthorized from './directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'
import Decimal from 'decimal.js-light'
import { getApiResolvers } from './api/schema'

const schema = async (apiVersion: String): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [getApiResolvers(apiVersion)],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
