import { NonEmptyArray } from 'type-graphql'

import { PublicCommunityInfoResolver } from './resolver/PublicCommunityInfoResolver'
import { PublicKeyResolver } from './resolver/PublicKeyResolver'
import { SendCoinsResolver } from './resolver/SendCoinsResolver'

// eslint-disable-next-line @typescript-eslint/ban-types
export const getApiResolver = (): NonEmptyArray<Function> => {
  return [PublicCommunityInfoResolver, PublicKeyResolver, SendCoinsResolver]
}
