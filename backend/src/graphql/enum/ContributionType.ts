import { registerEnumType } from 'type-graphql'
import { ContributionType } from 'database'

export { ContributionType }

registerEnumType(ContributionType, {
  name: 'ContributionType',
  description: 'Name of the Type of the Contribution',
})
