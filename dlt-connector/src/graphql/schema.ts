import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { DecimalScalar } from './scalar/Decimal'
import { TransactionResolver } from './resolver/TransactionResolver'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [TransactionResolver],
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
    validate: true, // enable `class-validator` integration
  })
}
