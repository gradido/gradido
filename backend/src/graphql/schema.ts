import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

import isAuthorized from './directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'
import Decimal from 'decimal.js-light'
import { federationResolvers } from '@/federation/graphql/schema'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`), federationResolvers],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
