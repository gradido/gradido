import * as v from 'valibot'

export enum RoleNames {
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  MODERATOR_AI = 'MODERATOR_AI',
  ADMIN = 'ADMIN',
  DLT_CONNECTOR = 'DLT_CONNECTOR_ROLE',
}

export const RoleNamesSchema = v.enum(RoleNames)
