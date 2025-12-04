import { ContributionCycleType } from 'database'
import { registerEnumType } from 'type-graphql'

export { ContributionCycleType }

registerEnumType(ContributionCycleType, {
  name: 'ContributionCycleType', // this one is mandatory
  description: 'Name of the Type of the ContributionCycle', // this one is optional
})
