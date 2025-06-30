import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { AccountResolver } from './resolver/AccountsResolver'
import { TransactionResolver } from './resolver/TransactionsResolver'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [TransactionResolver, AccountResolver],
    validate: {
      validationError: { target: false },
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: false,
      forbidUnknownValues: true,
      stopAtFirstError: true,
    },
  })
}
