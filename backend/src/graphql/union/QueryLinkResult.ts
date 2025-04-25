import { createUnionType } from 'type-graphql'

import { ContributionLink } from '@model/ContributionLink'
import { RedeemJwtLink } from '@/graphql/model/RedeemJwtLink'
import { TransactionLink } from '@model/TransactionLink'

export const QueryLinkResult = createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, RedeemJwtLink, ContributionLink] as const, // function that returns tuple of object types classes
  resolveType: (value: TransactionLink | RedeemJwtLink | ContributionLink) => {
    if (value instanceof TransactionLink) return TransactionLink
    if (value instanceof RedeemJwtLink) return RedeemJwtLink
    if (value instanceof ContributionLink) return ContributionLink
    return null
  },
})
