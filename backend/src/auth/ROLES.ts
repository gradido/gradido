import { ADMIN_RIGHTS } from './ADMIN_RIGHTS'
import { INALIENABLE_RIGHTS } from './INALIENABLE_RIGHTS'
import { MODERATOR_RIGHTS } from './MODERATOR_RIGHTS'
import { Role } from './Role'
import { USER_RIGHTS } from './USER_RIGHTS'

export const ROLE_UNAUTHORIZED = new Role('unauthorized', INALIENABLE_RIGHTS)
export const ROLE_USER = new Role('user', [...INALIENABLE_RIGHTS, ...USER_RIGHTS])
export const ROLE_MODERATOR = new Role('moderator', [
  ...INALIENABLE_RIGHTS,
  ...USER_RIGHTS,
  ...MODERATOR_RIGHTS,
])
export const ROLE_ADMIN = new Role('admin', [
  ...INALIENABLE_RIGHTS,
  ...USER_RIGHTS,
  ...MODERATOR_RIGHTS,
  ...ADMIN_RIGHTS,
])

// TODO from database
export const ROLES = [ROLE_UNAUTHORIZED, ROLE_USER, ROLE_MODERATOR, ROLE_ADMIN]
