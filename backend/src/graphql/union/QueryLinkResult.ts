import { createUnionType } from 'type-graphql'
import { TransactionLink } from '@model/TransactionLink'
import { ContributionLink } from '@model/ContributionLink'
export default createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, ContributionLink] as const, // function that returns tuple of object types classes
})
