import { ContributionType } from 'database'
import { registerEnumType } from 'type-graphql'

export { ContributionType }

registerEnumType(ContributionType, {
  name: 'ContributionType',
  description: 'Name of the Type of the Contribution',
})
