import { registerEnumType } from 'type-graphql'

export enum RoleNames {
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  MODERATOR_AI = 'MODERATOR_AI',
  ADMIN = 'ADMIN',
  DLT_CONNECTOR = 'DLT_CONNECTOR_ROLE',
}

registerEnumType(RoleNames, {
  name: 'RoleNames', // this one is mandatory
  description: 'Possible role names', // this one is optional
})
