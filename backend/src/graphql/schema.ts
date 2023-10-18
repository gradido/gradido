import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { isAuthorized } from './directive/isAuthorized'
import { BalanceResolver } from './resolver/BalanceResolver'
import { CommunityResolver } from './resolver/CommunityResolver'
import { ContributionLinkResolver } from './resolver/ContributionLinkResolver'
import { ContributionMessageResolver } from './resolver/ContributionMessageResolver'
import { ContributionResolver } from './resolver/ContributionResolver'
import { GdtResolver } from './resolver/GdtResolver'
import { KlicktippResolver } from './resolver/KlicktippResolver'
import { StatisticsResolver } from './resolver/StatisticsResolver'
import { TransactionLinkResolver } from './resolver/TransactionLinkResolver'
import { TransactionResolver } from './resolver/TransactionResolver'
import { UserResolver } from './resolver/UserResolver'
import { DecimalScalar } from './scalar/Decimal'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [
      BalanceResolver,
      CommunityResolver,
      ContributionLinkResolver,
      ContributionMessageResolver,
      ContributionResolver,
      GdtResolver,
      KlicktippResolver,
      StatisticsResolver,
      TransactionLinkResolver,
      TransactionResolver,
      UserResolver,
    ],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
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
