/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { User } from '@entity/User'
import { AuthChecker } from 'type-graphql'

import { INALIENABLE_RIGHTS } from '@/auth/INALIENABLE_RIGHTS'
import { decode, encode } from '@/auth/JWT'
import { RIGHTS } from '@/auth/RIGHTS'
import { ROLE_UNAUTHORIZED, ROLE_USER, ROLE_ADMIN } from '@/auth/ROLES'
import { LogError } from '@/server/LogError'

export const isAuthorized: AuthChecker<any> = async ({ context }, rights) => {
  context.role = ROLE_UNAUTHORIZED // unauthorized user

  // is rights an inalienable right?
  if ((<RIGHTS[]>rights).reduce((acc, right) => acc && INALIENABLE_RIGHTS.includes(right), true))
    return true

  // Do we have a token?
  if (!context.token) {
    throw new LogError('401 Unauthorized')
  }

  // Decode the token
  const decoded = decode(context.token)
  if (!decoded) {
    throw new LogError('403.13 - Client certificate revoked')
  }
  // Set context gradidoID
  context.gradidoID = decoded.gradidoID

  // TODO - load from database dynamically & admin - maybe encode this in the token to prevent many database requests
  // TODO this implementation is bullshit - two database queries cause our user identifiers are not aligned and vary between email, id and pubKey
  try {
    const user = await User.findOneOrFail({
      where: { gradidoID: decoded.gradidoID },
      relations: ['emailContact'],
    })
    context.user = user
    context.role = user.isAdmin ? ROLE_ADMIN : ROLE_USER
  } catch {
    // in case the database query fails (user deleted)
    throw new LogError('401 Unauthorized')
  }

  // check for correct rights
  const missingRights = (<RIGHTS[]>rights).filter((right) => !context.role.hasRight(right))
  if (missingRights.length !== 0) {
    throw new LogError('401 Unauthorized')
  }

  // set new header token
  context.setHeaders.push({ key: 'token', value: encode(decoded.gradidoID) })
  return true
}
