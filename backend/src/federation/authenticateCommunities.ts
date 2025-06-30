import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'
import { validate as validateUUID, version as versionUUID } from 'uuid'

import { CONFIG } from '@/config'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { encryptAndSign } from '@/auth/jwt/JWT'
import { OpenConnectionJwtPayloadType } from '@/auth/jwt/payloadtypes/OpenConnectionJwtPayloadType'
import { getLogger } from 'log4js'
import { OpenConnectionArgs } from './client/1_0/model/OpenConnectionArgs'
import { AuthenticationClientFactory } from './client/AuthenticationClientFactory'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.authenticateCommunities`)

export async function startCommunityAuthentication(
  foreignFedCom: DbFederatedCommunity,
): Promise<void> {
  const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
  const homeFedCom = await DbFederatedCommunity.findOneByOrFail({
    foreign: false,
    apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
  })
  const foreignCom = await DbCommunity.findOneByOrFail({ publicKey: foreignFedCom.publicKey })
  logger.debug(
    'Authentication: started with foreignFedCom:',
    foreignFedCom.endPoint,
    foreignFedCom.publicKey.toString('hex'),
    foreignCom.publicJwtKey,
  )
  // check if communityUuid is a valid v4Uuid and not still a temporary onetimecode
  if (
    foreignCom &&
    ((foreignCom.communityUuid === null && foreignCom.authenticatedAt === null) ||
      (foreignCom.communityUuid !== null &&
        !validateUUID(foreignCom.communityUuid) &&
        versionUUID(foreignCom.communityUuid) !== 4))
  ) {
    try {
      const client = AuthenticationClientFactory.getInstance(foreignFedCom)

      if (client instanceof V1_0_AuthenticationClient) {
        if (!foreignCom.publicJwtKey) {
          throw new Error('Public JWT key still not exist for foreign community')
        }
        //create JWT with url in payload encrypted by foreignCom.publicJwtKey and signed with homeCom.privateJwtKey
        const payload = new OpenConnectionJwtPayloadType(
          ensureUrlEndsWithSlash(homeFedCom.endPoint).concat(homeFedCom.apiVersion),
        )
        const jws = await encryptAndSign(payload, homeCom.privateJwtKey!, foreignCom.publicJwtKey)
        // prepare the args for the client invocation
        const args = new OpenConnectionArgs()
        args.publicKey = homeCom.publicKey.toString('hex')
        args.jwt = jws
        logger.debug(
          'Authentication: before client.openConnection() args:',
          homeCom.publicKey.toString('hex'),
          args.jwt,
        )
        if (await client.openConnection(args)) {
          logger.debug(`Authentication: successful initiated at community:`, foreignFedCom.endPoint)
        } else {
          logger.error(`Authentication: can't initiate at community:`, foreignFedCom.endPoint)
        }
      }
    } catch (err) {
      logger.error(`Error:`, err)
    }
  }
}
