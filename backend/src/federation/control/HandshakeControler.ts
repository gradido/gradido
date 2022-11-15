import { readFederationCommunity } from '@/dao/CommunityDAO'
import { requestGetPublicKey } from '../client/FederationClient'
import { backendLogger as logger } from '@/server/logger'

export async function startFederationHandshake(remotePublicKey: Buffer): Promise<void> {
  logger.info(`startFederationHandshake...`)
  try {
    const fdCom = await readFederationCommunity(remotePublicKey.toString('hex'))
    logger.info(`Federation with fedCom=${JSON.stringify(fdCom)}...`)
    await requestGetPublicKey(fdCom)
  } catch (err) {
    logger.error(`error during federationHandshake: err=${JSON.stringify(err)}`)
  }
  logger.info(`startFederationHandshake... finished successfully`)
}
