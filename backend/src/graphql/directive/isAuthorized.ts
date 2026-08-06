import { RoleNames } from '@enum/RoleNames'
import { User } from 'database'
import { AuthChecker } from 'type-graphql'

import { INALIENABLE_RIGHTS } from '@/auth/INALIENABLE_RIGHTS'
import { decode, encode } from '@/auth/JWT'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  ROLE_ADMIN,
  ROLE_DLT_CONNECTOR,
  ROLE_MODERATOR,
  ROLE_MODERATOR_AI,
  ROLE_UNAUTHORIZED,
  ROLE_USER,
} from '@/auth/ROLES'
import { gatingModulesFor } from '@/module/gate'
import { readModuleSettings } from '@/module/settings'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

export const isAuthorized: AuthChecker<Context> = async ({ context }, rights) => {
  context.role = ROLE_UNAUTHORIZED // unauthorized user

  // is rights an inalienable right?
  if (
    (rights as RIGHTS[]).reduce((acc, right) => acc && INALIENABLE_RIGHTS.includes(right), true)
  ) {
    return true
  }

  // A module switched off in the admin UI denies its rights to everyone, administrators
  // included: ROLE_ADMIN inherits USER_RIGHTS, and the check never consults context.role,
  // so off means off rather than off-for-most.
  //
  // Read fresh, deliberately not cached, so flipping the switch takes effect at once -
  // that is the point of keeping it in the database instead of the server config. It is
  // not a cost per request either: a request that asks for no gated right never gets
  // past gatingModulesFor, and that is every request but the module's own.
  const gatingModules = gatingModulesFor(rights as RIGHTS[])
  if (gatingModules.length > 0) {
    const moduleSettings = await readModuleSettings()
    if (gatingModules.some((module) => !module.isActive(moduleSettings))) {
      throw new LogError('401 Unauthorized')
    }
  }

  // Do we have a token?
  if (!context.token) {
    throw new LogError('401 Unauthorized')
  }

  // Decode the token
  const decoded = await decode(context.token)
  if (!decoded) {
    throw new LogError('403.13 - Client certificate revoked')
  }
  // Set context gradidoID
  context.gradidoID = decoded.gradidoID

  if (context.gradidoID === 'dlt-connector') {
    context.role = ROLE_DLT_CONNECTOR
  } else {
    // TODO - load from database dynamically & admin - maybe encode this in the token to prevent many database requests
    // TODO this implementation is bullshit - two database queries cause our user identifiers are not aligned and vary between email, id and pubKey
    try {
      const user = await User.findOneOrFail({
        where: { gradidoID: decoded.gradidoID },
        withDeleted: true,
        relations: ['emailContact', 'userRoles'],
      })
      context.user = user
      context.role = ROLE_USER
      if (user.userRoles?.length > 0) {
        switch (user.userRoles[0].role) {
          case RoleNames.ADMIN:
            context.role = ROLE_ADMIN
            break
          case RoleNames.MODERATOR:
            context.role = ROLE_MODERATOR
            break
          case RoleNames.MODERATOR_AI:
            context.role = ROLE_MODERATOR_AI
            break
          default:
            context.role = ROLE_USER
        }
      }
    } catch {
      // in case the database query fails (user deleted)
      throw new LogError('401 Unauthorized')
    }
  }

  // check for correct rights
  const missingRights = (rights as RIGHTS[]).filter((right) => !context.role?.hasRight(right))
  if (missingRights.length !== 0) {
    throw new LogError('401 Unauthorized')
  }

  // set new header token
  context.setHeaders.push({ key: 'token', value: await encode(decoded.gradidoID) })
  return true
}
