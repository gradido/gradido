import { registerEnumType } from 'type-graphql'
import { ContributionType } from 'database'

registerEnumType(ContributionType, {
  name: 'ContributionType',
  description: 'Name of the Type of the Contribution',
})
