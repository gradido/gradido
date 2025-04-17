import { createUnionType } from 'type-graphql'

import { ContributionLink } from '@model/ContributionLink'
import { DisbursementLink } from '@model/DisbursementLink'
import { TransactionLink } from '@model/TransactionLink'

export const QueryLinkResult = createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, DisbursementLink, ContributionLink] as const, // function that returns tuple of object types classes
  resolveType: (value: TransactionLink | DisbursementLink | ContributionLink) => {
    if (value instanceof TransactionLink) return TransactionLink
    if (value instanceof DisbursementLink) return DisbursementLink
    if (value instanceof ContributionLink) return ContributionLink
    return null
  },
})
