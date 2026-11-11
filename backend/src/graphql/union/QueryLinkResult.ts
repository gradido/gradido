import { ContributionLink } from '@model/ContributionLink'
import { ForeignTransactionLink } from '@model/ForeignTransactionLink'
import { TransactionLink } from '@model/TransactionLink'
import { createUnionType } from 'type-graphql'

export const QueryLinkResult = createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, ForeignTransactionLink, ContributionLink] as const, // function that returns tuple of object types classes
  resolveType: (value: TransactionLink | ForeignTransactionLink | ContributionLink) => {
    if (value instanceof TransactionLink) {
      return TransactionLink
    }
    if (value instanceof ForeignTransactionLink) {
      return ForeignTransactionLink
    }
    if (value instanceof ContributionLink) {
      return ContributionLink
    }
    return null
  },
})
