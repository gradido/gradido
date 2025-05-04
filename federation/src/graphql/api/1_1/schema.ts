import { NonEmptyArray } from 'type-graphql'
import { AuthenticationResolver } from '../1_0/resolver/AuthenticationResolver'
import { PublicCommunityInfoResolver } from '../1_0/resolver/PublicCommunityInfoResolver'
import { SendCoinsResolver } from '../1_0/resolver/SendCoinsResolver'
import { PublicKeyResolver } from './resolver/PublicKeyResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [AuthenticationResolver, PublicCommunityInfoResolver, PublicKeyResolver, SendCoinsResolver]
}
