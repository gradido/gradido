import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

import isAuthorized from './directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'
import Decimal from 'decimal.js-light'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
