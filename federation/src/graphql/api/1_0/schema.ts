import { NonEmptyArray } from 'type-graphql'
import { AuthenticationResolver } from './resolver/AuthenticationResolver'
import { BlockchainNotificationResolver } from './resolver/BlockchainNotificationResolver'
import { CommandResolver } from './resolver/CommandResolver'
import { DisbursementResolver } from './resolver/DisbursementResolver'
import { PublicCommunityInfoResolver } from './resolver/PublicCommunityInfoResolver'
import { PublicKeyResolver } from './resolver/PublicKeyResolver'
import { SendCoinsResolver } from './resolver/SendCoinsResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [
    AuthenticationResolver,
    BlockchainNotificationResolver,
    CommandResolver,
    DisbursementResolver,
    PublicCommunityInfoResolver,
    PublicKeyResolver,
    SendCoinsResolver,
  ]
}
