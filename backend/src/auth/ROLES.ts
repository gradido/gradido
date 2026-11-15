import { RoleNames } from '@/graphql/enum/RoleNames'

import { ADMIN_RIGHTS } from './ADMIN_RIGHTS'
import { DLT_CONNECTOR_RIGHTS } from './DLT_CONNECTOR_RIGHTS'
import { INALIENABLE_RIGHTS } from './INALIENABLE_RIGHTS'
import { MODERATOR_AI_RIGHTS } from './MODERATOR_AI_RIGHTS'
import { MODERATOR_RIGHTS } from './MODERATOR_RIGHTS'
import { RIGHTS } from './RIGHTS'
import { Role } from './Role'
import { USER_RIGHTS } from './USER_RIGHTS'

export const ROLE_UNAUTHORIZED = new Role(RoleNames.UNAUTHORIZED, INALIENABLE_RIGHTS)
export const ROLE_USER = new Role(RoleNames.USER, [...INALIENABLE_RIGHTS, ...USER_RIGHTS])
export const ROLE_MODERATOR = new Role(RoleNames.MODERATOR, [
  ...INALIENABLE_RIGHTS,
  ...USER_RIGHTS,
  ...MODERATOR_RIGHTS,
])
export const ROLE_MODERATOR_AI = new Role(RoleNames.MODERATOR_AI, [
  ...INALIENABLE_RIGHTS,
  ...USER_RIGHTS,
  ...MODERATOR_RIGHTS,
  ...MODERATOR_AI_RIGHTS,
])

export const ROLE_ADMIN = new Role(RoleNames.ADMIN, [
  ...INALIENABLE_RIGHTS,
  ...USER_RIGHTS,
  ...MODERATOR_RIGHTS,
  ...MODERATOR_AI_RIGHTS,
  ...ADMIN_RIGHTS,
])

export const ROLE_DLT_CONNECTOR = new Role(RoleNames.DLT_CONNECTOR, DLT_CONNECTOR_RIGHTS)

// The two moderator kinds with the tick "may handle support requests" (Support-Anfragen K6,
// SUA-025): the support's right on top of what they hold anyway. Only roleOfHolder hands them out.
const ROLE_MODERATOR_SUPPORT = new Role(RoleNames.MODERATOR, [
  ...ROLE_MODERATOR.rights,
  RIGHTS.MANAGE_SUPPORT_TICKETS,
])
const ROLE_MODERATOR_AI_SUPPORT = new Role(RoleNames.MODERATOR_AI, [
  ...ROLE_MODERATOR_AI.rights,
  RIGHTS.MANAGE_SUPPORT_TICKETS,
])

// TODO from database
export const ROLES = [ROLE_UNAUTHORIZED, ROLE_USER, ROLE_MODERATOR, ROLE_ADMIN]

/**
 * The rights bundle of a role row, the one mapping isAuthorized applies to the signed-in member:
 * by the name of the role, and for the two moderator kinds by the tick on the row as well, which
 * adds the support's right (K6). An administrator holds that right without the tick, and any other
 * role never, whatever the column says (rows with USER existed). No row is a usual member.
 */
export const roleOfHolder = (
  holder: { role: string | null; supportDuty: boolean } | null | undefined,
): Role => {
  switch (holder?.role) {
    case RoleNames.ADMIN:
      return ROLE_ADMIN
    case RoleNames.MODERATOR:
      return holder.supportDuty ? ROLE_MODERATOR_SUPPORT : ROLE_MODERATOR
    case RoleNames.MODERATOR_AI:
      return holder.supportDuty ? ROLE_MODERATOR_AI_SUPPORT : ROLE_MODERATOR_AI
    default:
      return ROLE_USER
  }
}

/**
 * The rights behind a stored role name alone, without a tick (roleOfHolder). For acting in
 * somebody ELSE's name (the first-creation signer), where there is no request context to read the
 * role from.
 */
export const roleByName = (roleName: string | null | undefined): Role =>
  roleOfHolder({ role: roleName ?? null, supportDuty: false })
