import { registerEnumType } from 'type-graphql'

export enum RoleNames {
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

registerEnumType(RoleNames, {
  name: 'RoleNames', // this one is mandatory
  description: 'Possible role names', // this one is optional
})
