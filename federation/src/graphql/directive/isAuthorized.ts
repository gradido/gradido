import { Community as dbCommunity } from '@entity/Community'
import { AuthChecker } from 'type-graphql'

import { verifyToken, generateToken } from '@/auth/JWE'
import { RIGHTS } from '@/auth/RIGHTS'
import { ROLE_UNAUTHORIZED, ROLE_AUTHORIZED } from '@/auth/ROLES'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

export const isAuthorized: AuthChecker<Context> = async ({ context }, rights) => {
  // Do we have a token?
  if (!context.token) {
    throw new LogError('401 Unauthorized')
  }

  try {
    const ownCommunity = await dbCommunity.findOneOrFail({ foreign: false })
    if (!ownCommunity.privateKey) {
      throw new LogError('Internal Server Error', 'Own private key not in database')
    }
    // Decode the token
    const decoded = await verifyToken(context.token, {
      publicKey: ownCommunity.publicKey,
      privateKey: ownCommunity.privateKey,
    })
    if (!decoded) {
      throw new LogError('403.13 - Client certificate revoked')
    }

    context.role = ROLE_UNAUTHORIZED // unauthorized caller

    const debugComKey = Buffer.alloc(64, 0)
    decoded.publicKey.copy(debugComKey)
    const community = await dbCommunity.findOne({
      where: { publicKey: debugComKey },
    })
    // todo do not respond with token below?
    if (community) {
      context.community = community
      context.role = ROLE_AUTHORIZED // TODO here authorization has to be checked
    }

    // check for correct rights
    const missingRights = (rights as RIGHTS[]).filter((right) => !context.role?.hasRight(right))
    if (missingRights.length !== 0) {
      throw new LogError('401 Unauthorized')
    }

    // set new header token
    context.setHeaders.push({
      key: 'token',
      value: await generateToken(
        decoded.nonce,
        {
          publicKey: ownCommunity.publicKey,
          privateKey: ownCommunity.privateKey,
        },
        decoded.publicKey,
      ),
    })
    return true
  } catch {
    // in case the database query fails (user deleted)
    throw new LogError('401 Unauthorized')
  }
}
