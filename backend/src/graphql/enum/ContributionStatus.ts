import { registerEnumType } from 'type-graphql'
import { ContributionStatus } from 'database'

export { ContributionStatus }

registerEnumType(ContributionStatus, {
  name: 'ContributionStatus',
  description: 'Name of the Type of the Contribution Status',
})
