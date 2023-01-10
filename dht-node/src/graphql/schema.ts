import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

import DecimalScalar from './scalar/Decimal'
import Decimal from 'decimal.js-light'

const schema = async (): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: [path.join(__dirname, `./resolver/*Resolver.{ts,js}`)],
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
