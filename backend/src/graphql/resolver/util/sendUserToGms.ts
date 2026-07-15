import { AppDatabase, Community as DbCommunity, User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { upsertGmsUsers } from '@/apis/gms/GmsClient'
import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.sendUserToGms`)

export async function sendUsersToGms(users: DbUser[], homeCom: DbCommunity): Promise<boolean> {
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }

  try {
    const userIds = users.map((user) => user.id)
    logger.debug(`Users will be send to GMS ${userIds}`)
    const result = await upsertGmsUsers(
      homeCom.gmsApiKey,
      users.map((user) => new GmsUser(user)),
    )
    if (result) {
      await batchUpdateGmsStatus(userIds)
    }
  } catch (err) {
    if (!CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
      logger.warn('publishing user fails with ', err)
      return false
    }
  }
  return true
}

async function batchUpdateGmsStatus(userIds: number[]) {
  await AppDatabase.getInstance()
    .getDataSource()
    .createQueryBuilder()
    .update(DbUser)
    .set({
      gmsRegistered: true,
      gmsRegisteredAt: new Date(),
    })
    .where('id IN (:...ids)', { ids: userIds })
    .execute()
  logger.debug(`${userIds} User marked as gms published.`)
}
