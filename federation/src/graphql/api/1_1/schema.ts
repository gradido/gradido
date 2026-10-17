import { NonEmptyArray } from 'type-graphql'
import { CommandResolver } from '../1_0/resolver/CommandResolver'
import { MemberAvatarsResolver } from '../1_0/resolver/MemberAvatarsResolver'
import { SendCoinsResolver } from '../1_0/resolver/SendCoinsResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [CommandResolver, MemberAvatarsResolver, SendCoinsResolver]
}
