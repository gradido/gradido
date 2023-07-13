import { registerEnumType } from 'type-graphql'

export enum RoleNames {
  ROLE_NAME_ADMIN = 'admin',
  ROLE_NAME_UNAUTHORIZED = 'unauthorized',
  ROLE_NAME_USER = 'user',
  ROLE_NAME_MODERATOR = 'moderator',
}

registerEnumType(RoleNames, {
  name: 'RoleNames', // this one is mandatory
  description: 'Possible role names', // this one is optional
})
