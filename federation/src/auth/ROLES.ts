import { INALIENABLE_RIGHTS } from './INALIENABLE_RIGHTS'
import { Role } from './Role'

export const ROLE_UNAUTHORIZED = new Role('unauthorized', INALIENABLE_RIGHTS)
export const ROLE_AUTHORIZED = new Role('authorized', INALIENABLE_RIGHTS)

// TODO from database
export const ROLES = [ROLE_UNAUTHORIZED, ROLE_AUTHORIZED]
