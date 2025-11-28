import { registerEnumType } from 'type-graphql'
import { ContributionCycleType } from 'database'

registerEnumType(ContributionCycleType, {
  name: 'ContributionCycleType', // this one is mandatory
  description: 'Name of the Type of the ContributionCycle', // this one is optional
})
