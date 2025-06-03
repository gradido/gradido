import { NonEmptyArray } from 'type-graphql'
import { AuthenticationResolver } from './resolver/AuthenticationResolver'
import { DisbursementJwtResolver } from './resolver/DisbursementJwtResolver'
import { PublicCommunityInfoResolver } from './resolver/PublicCommunityInfoResolver'
import { PublicKeyResolver } from './resolver/PublicKeyResolver'
import { SendCoinsResolver } from './resolver/SendCoinsResolver'

export const getApiResolvers = (): NonEmptyArray<Function> => {
  return [
    AuthenticationResolver,
    DisbursementJwtResolver,
    PublicCommunityInfoResolver,
    PublicKeyResolver,
    SendCoinsResolver,
  ]
}
