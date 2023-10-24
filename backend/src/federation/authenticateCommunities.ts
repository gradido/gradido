import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { CONFIG } from '@/config'
// eslint-disable-next-line camelcase
import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
import { backendLogger as logger } from '@/server/logger'

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
  if (foreignCom && foreignCom.communityUuid === null && foreignCom.authenticatedAt === null) {
    try {
      const client = AuthenticationClientFactory.getInstance(foreignFedCom)
      // eslint-disable-next-line camelcase
      if (client instanceof V1_0_AuthenticationClient) {
        const args = new OpenConnectionArgs()
        args.publicKey = homeCom.publicKey.toString()
        // TODO encrypt url with foreignCom.publicKey and sign it with homeCom.privateKey
        args.url = homeFedCom.endPoint.endsWith('/')
          ? homeFedCom.endPoint
          : homeFedCom.endPoint + '/' + homeFedCom.apiVersion
        if (await client.openConnection(args)) {
          logger.info(`Authentication: successful initiated at community:`, foreignFedCom.endPoint)
        } else {
          logger.error(`Authentication: can't initiate at community:`, foreignFedCom.endPoint)
        }
      }
    } catch (err) {
      logger.error(`Error:`, err)
    }
  }
}
