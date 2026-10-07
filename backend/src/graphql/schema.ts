import { Location } from '@model/Location'
import { DateTimeScalar, GradidoUnitScalar } from 'core'
import { GraphQLSchema } from 'graphql'
import { Duration, GradidoUnit } from 'shared'
import { buildSchema } from 'type-graphql'
import { isAuthorized } from './directive/isAuthorized'
import { AssistedRegistrationResolver } from './resolver/AssistedRegistrationResolver'
import { BalanceResolver } from './resolver/BalanceResolver'
import { ChatEditResolver } from './resolver/ChatEditResolver'
import { ChatForwardResolver } from './resolver/ChatForwardResolver'
import { ChatGroupResolver } from './resolver/ChatGroupResolver'
import { ChatResolver } from './resolver/ChatResolver'
import { ChatVideoServerResolver } from './resolver/ChatVideoServerResolver'
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
import { GuarantorCodeResolver } from './resolver/GuarantorCodeResolver'
import { KlicktippResolver } from './resolver/KlicktippResolver'
import { MatchingEntryResolver } from './resolver/MatchingEntryResolver'
import { ProjectAccountResolver } from './resolver/ProjectAccountResolver'
import { ProjectBrandingResolver } from './resolver/ProjectBrandingResolver'
import { ShowFriendsResolver } from './resolver/ShowFriendsResolver'
import { StatisticsResolver } from './resolver/StatisticsResolver'
import { ThankYouCardPaymentResolver } from './resolver/ThankYouCardPaymentResolver'
import { ThankYouCardResolver } from './resolver/ThankYouCardResolver'
import { TransactionLinkResolver } from './resolver/TransactionLinkResolver'
import { TransactionResolver } from './resolver/TransactionResolver'
import { UserCreationGroupResolver } from './resolver/UserCreationGroupResolver'
import { UserResolver } from './resolver/UserResolver'
import { DurationScalar } from './scalar/Duration'
import { LocationScalar } from './scalar/Location'

// ⛔ Built once per process, and handed out again after that. type-graphql 2 (2.0.0-rc.3) adds
// the parameters of every resolver to its metadata again with each build: after a second
// buildSchema a method is called with its arguments doubled -- (ref, context) becomes
// (ref, ref, context, context) -- so the parameter that should be the context is the first
// argument instead. Nothing fails at build time; the resolvers just read the wrong objects.
let built: Promise<GraphQLSchema> | undefined

export const schema = (): Promise<GraphQLSchema> => {
  built ??= buildSchema({
    resolvers: [
      AssistedRegistrationResolver,
      BalanceResolver,
      ChatEditResolver,
      ChatForwardResolver,
      ChatGroupResolver,
      ChatResolver,
      ChatVideoServerResolver,
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
      GuarantorCodeResolver,
      ProjectAccountResolver,
      ProjectBrandingResolver,
      ShowFriendsResolver,
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
      { type: Date, scalar: DateTimeScalar },
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
  return built
}
