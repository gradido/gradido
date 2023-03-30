import path from 'path'

import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import { Decimal } from 'decimal.js-light'

import isAuthorized from './directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
