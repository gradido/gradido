import path from 'path'

import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { Location } from '@model/Location'

import { isAuthorized } from './directive/isAuthorized'
import { DecimalScalar } from './scalar/Decimal'
import { LocationScalar } from './scalar/Location'
import { AiChatResolver } from './resolver/AiChatResolver'
import { BalanceResolver } from './resolver/BalanceResolver'
import { ContributionLinkResolver } from './resolver/ContributionLinkResolver'
import { CommunityResolver } from './resolver/CommunityResolver'
import { ContributionMessageResolver } from './resolver/ContributionMessageResolver'
import { GdtResolver } from './resolver/GdtResolver'
import { KlicktippResolver } from './resolver/KlicktippResolver'
import { ProjectBrandingResolver } from './resolver/ProjectBrandingResolver'
import { StatisticsResolver } from './resolver/StatisticsResolver'
import { TransactionLinkResolver } from './resolver/TransactionLinkResolver'
import { TransactionResolver } from './resolver/TransactionResolver'
import { UserResolver } from './resolver/UserResolver'
import { ContributionResolver } from './resolver/ContributionResolver'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    // resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
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
