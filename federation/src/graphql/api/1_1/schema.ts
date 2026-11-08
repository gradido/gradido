import { NonEmptyArray } from 'type-graphql'
import { CommandResolver } from '../1_0/resolver/CommandResolver'
import { MemberAvatarsResolver } from '../1_0/resolver/MemberAvatarsResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [CommandResolver, MemberAvatarsResolver]
}
