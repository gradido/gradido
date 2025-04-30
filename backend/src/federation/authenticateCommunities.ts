import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity } from 'database'
import { validate as validateUUID, version as versionUUID } from 'uuid'

import { CONFIG } from '@/config'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
import { backendLogger as logger } from '@/server/logger'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { OpenConnectionArgs } from './client/1_0/model/OpenConnectionArgs'
import { AuthenticationClientFactory } from './client/AuthenticationClientFactory'

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
        const args = new OpenConnectionArgs()
        args.publicKey = homeCom.publicKey.toString('hex')
        // TODO encrypt url with foreignCom.publicKey and sign it with homeCom.privateKey
        args.url = ensureUrlEndsWithSlash(homeFedCom.endPoint).concat(homeFedCom.apiVersion)
        logger.debug(
          'Authentication: before client.openConnection() args:',
          homeCom.publicKey.toString('hex'),
          args.url,
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
