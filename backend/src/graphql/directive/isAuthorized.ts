/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'

import { decode, encode } from '../../auth/JWT'
import { ROLE_UNAUTHORIZED, ROLE_USER, ROLE_ADMIN } from '../../auth/ROLES'
import { RIGHTS } from '../../auth/RIGHTS'
import { ServerUserRepository } from '../../typeorm/repository/ServerUser'
import { getCustomRepository } from 'typeorm'
import { UserRepository } from '../../typeorm/repository/User'

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
    // TODO - load from database dynamically & admin - maybe encode this in the token to prevent many database requests
    // TODO this implementation is bullshit - two database queries cause our user identifiers are not aligned and vary between email, id and pubKey
    const userRepository = await getCustomRepository(UserRepository)
    const user = await userRepository.findByPubkeyHex(context.pubKey)
    const serverUserRepository = await getCustomRepository(ServerUserRepository)
    const countServerUsers = await serverUserRepository.count({ email: user.email })
    context.role = countServerUsers > 0 ? ROLE_ADMIN : ROLE_USER

    context.setHeaders.push({ key: 'token', value: encode(decoded.pubKey) })
  }

  // check for correct rights
  const missingRights = (<RIGHTS[]>rights).filter((right) => !context.role.hasRight(right))
  if (missingRights.length !== 0) {
    throw new Error('401 Unauthorized')
  }

  return true
}

export default isAuthorized
