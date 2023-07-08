import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { DecimalScalar } from './scalar/Decimal'
import { TransactionResolver } from './resolver/TransactionsResolver'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [TransactionResolver],
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}
