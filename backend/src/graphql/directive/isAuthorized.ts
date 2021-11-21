/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'

import { decode, encode } from '../../auth/JWT'
import { ROLE_USER, ROLE_UNAUTHORIZED } from '../../auth/ROLES'
import { RIGHTS } from '../../auth/RIGHTS'

const isAuthorized: AuthChecker<any> = async ({ context }, rights) => {
  context.role = ROLE_UNAUTHORIZED // unauthorized user

  // Do we have a token?
  if (context.token) {
    const decoded = decode(context.token)
    if (!decoded) {
      // we always throw on an invalid token
      throw new Error('403.13 - Client certificate revoked')
    }
    // Set context pubKey
    context.pubKey = Buffer.from(decoded.pubKey).toString('hex')
    // set new header token
    context.setHeaders.push({ key: 'token', value: encode(decoded.pubKey) })
    // TODO - load from database dynamically & admin - maybe encode this in the token to prevent many database requests
    context.role = ROLE_USER // logged in user
  }

  // check for correct rights
  const missingRights = (<RIGHTS[]>rights).filter((right) => !context.role.hasRight(right))
  if (missingRights.length !== 0) {
    throw new Error('401 Unauthorized')
  }

  return true
}

export default isAuthorized
