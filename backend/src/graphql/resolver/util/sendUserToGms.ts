import { Community as DbCommunity, User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { createGmsUser, updateGmsUser } from '@/apis/gms/GmsClient'
import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.sendUserToGms`)

export async function sendUserToGms(
  user: DbUser,
  homeCom: DbCommunity,
  alwaysCreateUser?: boolean,
): Promise<void> {
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }
  logger.debug('User send to GMS:', user)
  const gmsUser = new GmsUser(user)
  try {
    if (alwaysCreateUser === true || (!user.gmsRegistered && user.gmsRegisteredAt === null)) {
      logger.debug('create user in gms:', gmsUser)

      if (await createGmsUser(homeCom.gmsApiKey, gmsUser)) {
        logger.debug('GMS user published successfully:', gmsUser)
        await updateUserGmsStatus(user)
      }
    } else {
      logger.debug('update user in gms:', gmsUser)

      if (await updateGmsUser(homeCom.gmsApiKey, gmsUser)) {
        logger.debug('GMS user published successfully:', gmsUser)
        await updateUserGmsStatus(user)
      }
    }
  } catch (err) {
    if (CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
      throw new LogError('publishing user fails with ', err)
    } else {
      logger.warn('publishing user fails with ', err)
    }
  }
}

async function updateUserGmsStatus(user: DbUser) {
  logger.debug('updateUserGmsStatus:', user)
  user.gmsRegistered = true
  user.gmsRegisteredAt = new Date()
  await DbUser.save(user)
  logger.debug('mark user as gms published:', user)
}
