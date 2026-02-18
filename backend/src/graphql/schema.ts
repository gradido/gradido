import { Location } from '@model/Location'
import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { isAuthorized } from './directive/isAuthorized'
import { AiChatResolver } from './resolver/AiChatResolver'
import { BalanceResolver } from './resolver/BalanceResolver'
import { CommunityResolver } from './resolver/CommunityResolver'
import { ContributionLinkResolver } from './resolver/ContributionLinkResolver'
import { ContributionMessageResolver } from './resolver/ContributionMessageResolver'
import { ContributionResolver } from './resolver/ContributionResolver'
import { GdtResolver } from './resolver/GdtResolver'
import { KlicktippResolver } from './resolver/KlicktippResolver'
import { ProjectBrandingResolver } from './resolver/ProjectBrandingResolver'
import { StatisticsResolver } from './resolver/StatisticsResolver'
import { TransactionLinkResolver } from './resolver/TransactionLinkResolver'
import { TransactionResolver } from './resolver/TransactionResolver'
import { UserResolver } from './resolver/UserResolver'
import { DecimalScalar } from './scalar/Decimal'
import { LocationScalar } from './scalar/Location'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [
      AiChatResolver,
      BalanceResolver,
      CommunityResolver,
      ContributionLinkResolver,
      ContributionMessageResolver,
      ContributionResolver,
      GdtResolver,
      KlicktippResolver,
      ProjectBrandingResolver,
      StatisticsResolver,
      TransactionLinkResolver,
      TransactionResolver,
      UserResolver,
    ],
    authChecker: isAuthorized,
    scalarsMap: [
      { type: Decimal, scalar: DecimalScalar },
      { type: Location, scalar: LocationScalar },
    ],
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
