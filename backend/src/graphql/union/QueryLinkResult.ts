import { createUnionType } from 'type-graphql'

import { ContributionLink } from '@model/ContributionLink'
import { TransactionLink } from '@model/TransactionLink'

export const QueryLinkResult = createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, ContributionLink] as const, // function that returns tuple of object types classes
})
