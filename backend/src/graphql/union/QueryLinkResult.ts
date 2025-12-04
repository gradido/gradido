import { ContributionLink } from '@model/ContributionLink'
import { RedeemJwtLink } from '@model/RedeemJwtLink'
import { TransactionLink } from '@model/TransactionLink'
import { createUnionType } from 'type-graphql'

export const QueryLinkResult = createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, RedeemJwtLink, ContributionLink] as const, // function that returns tuple of object types classes
  resolveType: (value: TransactionLink | RedeemJwtLink | ContributionLink) => {
    if (value instanceof TransactionLink) {
      return TransactionLink
    }
    if (value instanceof RedeemJwtLink) {
      return RedeemJwtLink
    }
    if (value instanceof ContributionLink) {
      return ContributionLink
    }
    return null
  },
})
