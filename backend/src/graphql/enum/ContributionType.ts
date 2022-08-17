import { registerEnumType } from 'type-graphql'

export enum ContributionType {
  ADMIN = 'ADMIN',
  USER = 'USER',
  LINK = 'LINK',
}

registerEnumType(ContributionType, {
  name: 'ContributionType',
  description: 'Name of the Type of the Contribution',
})
