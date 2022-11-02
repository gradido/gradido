import { registerEnumType } from 'type-graphql'

export enum ContributionStatus {
  PENDING = 'PENDING',
  DELETED = 'DELETED',
  IN_PROGRESS = 'IN_PROGRESS',
  DENIED = 'DENIED',
  CONFIRMED = 'CONFIRMED',
}

registerEnumType(ContributionStatus, {
  name: 'ContributionStatus',
  description: 'Name of the Type of the Contribution Status',
})
