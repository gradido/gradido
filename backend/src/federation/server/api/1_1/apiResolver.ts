import { NonEmptyArray } from 'type-graphql'

import { PublicKeyResolver } from './resolver/PublicKeyResolver'

// eslint-disable-next-line @typescript-eslint/ban-types
export const getApiResolver = (): NonEmptyArray<Function> => {
  return [PublicKeyResolver]
}
