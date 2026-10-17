import { NonEmptyArray } from 'type-graphql'
import { BlockchainNotificationResolver } from './resolver/BlockchainNotificationResolver'
import { CommandResolver } from './resolver/CommandResolver'
import { DisbursementResolver } from './resolver/DisbursementResolver'
import { MemberAvatarsResolver } from './resolver/MemberAvatarsResolver'
import { SendCoinsResolver } from './resolver/SendCoinsResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [
    BlockchainNotificationResolver,
    CommandResolver,
    DisbursementResolver,
    MemberAvatarsResolver,
    SendCoinsResolver,
  ]
}
