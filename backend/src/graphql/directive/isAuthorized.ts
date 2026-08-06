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
import { Role } from '@/auth/Role'
import { withdrawnRights } from '@/data/Module.logic'
import { Context, getModuleActivation } from '@/server/context'
import { LogError } from '@/server/LogError'

export const isAuthorized: AuthChecker<Context> = async ({ context }, rights) => {
  context.role = ROLE_UNAUTHORIZED // unauthorized user

  // is rights an inalienable right?
  if (
    (rights as RIGHTS[]).reduce((acc, right) => acc && INALIENABLE_RIGHTS.includes(right), true)
  ) {
    return true
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

  // A module switched off in the admin UI takes its rights away from the role itself,
  // rather than being checked separately here. That matters because @Authorized is not
  // the only path that asks: field resolvers call context.role.hasRight() directly, and
  // a separate check in this function would leave every one of them answering yes with
  // the module off. Withdrawing the rights covers both, and any later caller too.
  //
  // It applies to administrators as well - ROLE_ADMIN inherits USER_RIGHTS, so off means
  // off rather than off-for-most.
  //
  // Read here, BEFORE any role is put on the context, and not next to the withdrawal
  // below. One context object serves every field of an operation, so an await between
  // publishing a role and narrowing it would leave the un-narrowed role - matching rights
  // included - readable by whatever else is resolving meanwhile. Reading first keeps the
  // whole path from the role assignment to the rights check free of awaits.
  let withdrawn: Set<RIGHTS>
  try {
    withdrawn = withdrawnRights(await getModuleActivation(context))
  } catch (error) {
    // The switches are unreadable, so what a role may do is unknown: refuse. Wrapped
    // because the driver's own message would otherwise reach the client unmasked - no
    // formatError is configured, and a mysql2 error carries the failing statement with
    // it. The cause goes to the log, the caller gets our own message.
    throw new LogError('401 Unauthorized', error)
  }

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

  // Narrow the role that was just assigned. Synchronous, deliberately: see the read above.
  if (withdrawn.size > 0 && context.role) {
    context.role = new Role(
      context.role.id,
      context.role.rights.filter((right) => !withdrawn.has(right)),
    )
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
