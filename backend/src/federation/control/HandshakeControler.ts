import { readFederationCommunity } from '@/dao/CommunityDAO'
import { requestGetPublicKey } from '../client/FederationClient'
import { backendLogger as logger } from '@/server/logger'

export async function startFederationHandshake(remotePublicKey: Buffer): Promise<void> {
  logger.info(`startFederationHandshake...`)
  const fdCom = await readFederationCommunity(remotePublicKey.toString('hex'))
  requestGetPublicKey(fdCom)
  logger.info(`startFederationHandshake... finished successfully`)
}
