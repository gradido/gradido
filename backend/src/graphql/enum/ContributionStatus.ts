import { ContributionStatus } from 'database'
import { registerEnumType } from 'type-graphql'

export { ContributionStatus }

registerEnumType(ContributionStatus, {
  name: 'ContributionStatus',
  description: 'Name of the Type of the Contribution Status',
})
