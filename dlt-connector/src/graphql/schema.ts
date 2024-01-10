import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { AccountResolver } from './resolver/AccountsResolver'
import { CommunityResolver } from './resolver/CommunityResolver'
import { TransactionResolver } from './resolver/TransactionsResolver'
import { DecimalScalar } from './scalar/Decimal'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [TransactionResolver, CommunityResolver, AccountResolver],
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
    emitSchemaFile: true,
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
