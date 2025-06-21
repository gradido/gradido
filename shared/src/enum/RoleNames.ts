// not compatible with typescript 4
// import { enum as zEnum } from 'zod/v4-mini'

export enum RoleNames {
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  MODERATOR_AI = 'MODERATOR_AI',
  ADMIN = 'ADMIN',
  DLT_CONNECTOR = 'DLT_CONNECTOR_ROLE',
}

// export const RoleNamesSchema = zEnum(RoleNames)
