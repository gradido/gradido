/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'

import { decode, encode } from '../../auth/JWT'
import { ROLES } from '../../auth/ROLES'
import { hasRight } from '../../auth/hasRight'
import { RIGHTS } from '../../auth/RIGHTS'

const isAuthorized: AuthChecker<any> = async ({ context }, rights) => {
  context.role = ROLES[0] // unauthorized user

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
    context.role = ROLES[1] // logged in user
  }

  // check for correct rights
  const missingRights = (<RIGHTS[]>rights).filter((right) => !hasRight(right, context.role))
  if (missingRights.length !== 0) {
    throw new Error('401 Unauthorized')
  }

  return true
}

export default isAuthorized
