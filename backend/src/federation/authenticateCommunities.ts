import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity, getHomeCommunity } from 'database'
import { validate as validateUUID, version as versionUUID } from 'uuid'

import { CONFIG } from '@/config'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { encryptAndSign, EncryptedTransferArgs, OpenConnectionJwtPayloadType } from 'core'
import { getLogger } from 'log4js'
import { AuthenticationClientFactory } from './client/AuthenticationClientFactory'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.authenticateCommunities`)

export async function startCommunityAuthentication(
  foreignFedCom: DbFederatedCommunity,
): Promise<void> {
  const homeComA = await getHomeCommunity()
  const homeFedComA = await DbFederatedCommunity.findOneByOrFail({
    foreign: false,
    apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
  })
  const foreignComB = await DbCommunity.findOneByOrFail({ publicKey: foreignFedCom.publicKey })
  logger.debug(
    'started with foreignFedCom:',
    foreignFedCom.endPoint,
    foreignFedCom.publicKey.toString('hex'),
    foreignComB.publicJwtKey,
  )
  // check if communityUuid is a valid v4Uuid and not still a temporary onetimecode
  if (
    foreignComB &&
    ((foreignComB.communityUuid === null && foreignComB.authenticatedAt === null) ||
      (foreignComB.communityUuid !== null &&
        !validateUUID(foreignComB.communityUuid) &&
        versionUUID(foreignComB.communityUuid) !== 4))
  ) {
    try {
      const client = AuthenticationClientFactory.getInstance(foreignFedCom)

      if (client instanceof V1_0_AuthenticationClient) {
        if (!foreignComB.publicJwtKey) {
          throw new Error('Public JWT key still not exist for foreign community')
        }
        //create JWT with url in payload encrypted by foreignCom.publicJwtKey and signed with homeCom.privateJwtKey
        const payload = new OpenConnectionJwtPayloadType(
          ensureUrlEndsWithSlash(homeFedComA.endPoint).concat(homeFedComA.apiVersion),
        )
        const jws = await encryptAndSign(payload, homeComA!.privateJwtKey!, foreignComB.publicJwtKey)
        // prepare the args for the client invocation
        const args = new EncryptedTransferArgs()
        args.publicKey = homeComA!.publicKey.toString('hex')
        args.jwt = jws
        logger.debug(
          'before client.openConnection() args:',
          homeComA!.publicKey.toString('hex'),
          args.jwt,
        )
        if (await client.openConnection(args)) {
          logger.debug(`successful initiated at community:`, foreignFedCom.endPoint)
        } else {
          logger.error(`can't initiate at community:`, foreignFedCom.endPoint)
        }
      }
    } catch (err) {
      logger.error(`Error:`, err)
    }
  } else {
    logger.debug(`foreignComB.communityUuid is not a valid v4Uuid or still a temporary onetimecode`)
  }
}
