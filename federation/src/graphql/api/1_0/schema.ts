import { NonEmptyArray } from 'type-graphql'
import { AliveResolver } from './resolver/AliveResolver'
import { BlockchainNotificationResolver } from './resolver/BlockchainNotificationResolver'
import { CommandResolver } from './resolver/CommandResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [AliveResolver, BlockchainNotificationResolver, CommandResolver]
}
