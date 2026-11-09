import { NonEmptyArray } from 'type-graphql'
import { BlockchainNotificationResolver } from './resolver/BlockchainNotificationResolver'
import { CommandResolver } from './resolver/CommandResolver'
import { MemberAvatarsResolver } from './resolver/MemberAvatarsResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [BlockchainNotificationResolver, CommandResolver, MemberAvatarsResolver]
}
