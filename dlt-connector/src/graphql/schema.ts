import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { DecimalScalar } from './scalar/Decimal'
import { TransactionResolver } from './resolver/TransactionsResolver'
import { CommunityResolver } from './resolver/CommunityResolver'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [TransactionResolver, CommunityResolver],
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
