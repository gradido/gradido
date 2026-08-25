import { RoleNames } from '@enum/RoleNames'
import { User } from 'database'
import { AuthChecker } from 'type-graphql'

import { INALIENABLE_RIGHTS } from '@/auth/INALIENABLE_RIGHTS'
import { decode, encode } from '@/auth/JWT'
import { RESTRICTED_WHILE_UNCONFIRMED } from '@/auth/RESTRICTED_WHILE_UNCONFIRMED'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  ROLE_ADMIN,
  ROLE_DLT_CONNECTOR,
  ROLE_MODERATOR,
  ROLE_MODERATOR_AI,
  ROLE_UNAUTHORIZED,
  ROLE_USER,
} from '@/auth/ROLES'
import { isConfirmationOverdue } from '@/data/EmailConfirmation.logic'
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

  // EM-013: an account whose address was never confirmed keeps full access for the
  // grace period and is then narrowed down — everything that creates value or acts
  // outward is refused until the address is confirmed; viewing and self-management
  // (including the two ways out: resend and address correction) stay. The reminder
  // modal in the wallet is the visible half; this here is what makes the blockade
  // hold against a bare API call. Pure in-memory check: the user row above already
  // carries the emailContact relation, so no request gains an extra query.
  if (
    context.user?.emailContact &&
    !context.user.emailContact.emailChecked &&
    isConfirmationOverdue(context.user.createdAt)
  ) {
    const refused = (rights as RIGHTS[]).filter((right) =>
      RESTRICTED_WHILE_UNCONFIRMED.includes(right),
    )
    if (refused.length !== 0) {
      throw new LogError('401 Unauthorized')
    }
  }

  // set new header token
  context.setHeaders.push({ key: 'token', value: await encode(decoded.gradidoID) })
  return true
}
