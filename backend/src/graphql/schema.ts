import { Location } from '@model/Location'
import { GradidoUnitScalar } from 'core'
import { GraphQLSchema } from 'graphql'
import { Duration, GradidoUnit } from 'shared'
import { buildSchema } from 'type-graphql'
import { isAuthorized } from './directive/isAuthorized'
import { AssistedRegistrationResolver } from './resolver/AssistedRegistrationResolver'
import { BalanceResolver } from './resolver/BalanceResolver'
import { CommunityResolver } from './resolver/CommunityResolver'
import { ContactResolver } from './resolver/ContactResolver'
import { ContributionLinkResolver } from './resolver/ContributionLinkResolver'
import { ContributionMessageResolver } from './resolver/ContributionMessageResolver'
import { ContributionResolver } from './resolver/ContributionResolver'
import { CreaChatResolver } from './resolver/CreaChatResolver'
import { CreaResolver } from './resolver/CreaResolver'
import { CreationGroupResolver } from './resolver/CreationGroupResolver'
import { EmailChangeResolver } from './resolver/EmailChangeResolver'
import { FirstCreationResolver } from './resolver/FirstCreationResolver'
import { GdtResolver } from './resolver/GdtResolver'
import { KlicktippResolver } from './resolver/KlicktippResolver'
import { MatchingEntryResolver } from './resolver/MatchingEntryResolver'
import { ProjectBrandingResolver } from './resolver/ProjectBrandingResolver'
import { StatisticsResolver } from './resolver/StatisticsResolver'
import { ThankYouCardPaymentResolver } from './resolver/ThankYouCardPaymentResolver'
import { ThankYouCardResolver } from './resolver/ThankYouCardResolver'
import { TransactionLinkResolver } from './resolver/TransactionLinkResolver'
import { TransactionResolver } from './resolver/TransactionResolver'
import { UserCreationGroupResolver } from './resolver/UserCreationGroupResolver'
import { UserResolver } from './resolver/UserResolver'
import { DurationScalar } from './scalar/Duration'
import { LocationScalar } from './scalar/Location'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [
      AssistedRegistrationResolver,
      BalanceResolver,
      CommunityResolver,
      ContactResolver,
      ContributionLinkResolver,
      ContributionMessageResolver,
      ContributionResolver,
      CreaChatResolver,
      CreaResolver,
      EmailChangeResolver,
      FirstCreationResolver,
      GdtResolver,
      CreationGroupResolver,
      MatchingEntryResolver,
      KlicktippResolver,
      ProjectBrandingResolver,
      StatisticsResolver,
      ThankYouCardPaymentResolver,
      ThankYouCardResolver,
      TransactionLinkResolver,
      TransactionResolver,
      UserCreationGroupResolver,
      UserResolver,
    ],
    authChecker: isAuthorized,
    scalarsMap: [
      { type: Duration, scalar: DurationScalar },
      { type: Location, scalar: LocationScalar },
      { type: GradidoUnit, scalar: GradidoUnitScalar },
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
