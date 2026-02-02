import { NonEmptyArray } from 'type-graphql'
import { AuthenticationResolver } from '../1_0/resolver/AuthenticationResolver'
import { PublicCommunityInfoResolver } from '../1_0/resolver/PublicCommunityInfoResolver'
import { SendCoinsResolver } from '../1_0/resolver/SendCoinsResolver'
import { PublicKeyResolver } from './resolver/PublicKeyResolver'
import { CommandResolver } from '../1_0/resolver/CommandResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [AuthenticationResolver, CommandResolver, PublicCommunityInfoResolver, PublicKeyResolver, SendCoinsResolver]
}
