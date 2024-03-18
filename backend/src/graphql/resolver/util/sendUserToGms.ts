import { Community as DbCommunity } from '@entity/Community'
import { User as DbUser } from '@entity/User'

import { createGmsUser } from '@/apis/gms/GmsClient'
import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

export async function sendUserToGms(user: DbUser, homeCom: DbCommunity): Promise<void> {
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }
  logger.debug('User send to GMS:', user)
  const gmsUser = new GmsUser(user)
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (await createGmsUser(homeCom.gmsApiKey, gmsUser)) {
      logger.debug('GMS user published successfully:', gmsUser)
      user.gmsRegistered = true
      user.gmsRegisteredAt = new Date()
      await DbUser.save(user)
      logger.debug('mark user as gms published:', user)
    }
  } catch (err) {
    if (CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
      throw new LogError('publishing user fails with ', err)
    } else {
      logger.warn('publishing user fails with ', err)
    }
  }
}
