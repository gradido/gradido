import { User as DbUser } from 'database'
// import { createTestClient } from 'apollo-server-testing'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
// import { createGmsUser } from '@/apis/gms/GmsClient'
// import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG as CORE_CONFIG } from 'core'
import { sendUserToGms } from '@/graphql/resolver/util/sendUserToGms'
import { LogError } from '@/server/LogError'
import { initLogging } from '@/server/logger'
import { AppDatabase, getHomeCommunity } from 'database'
import { getLogger } from 'log4js'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.ExportUsers`)

CORE_CONFIG.EMAIL = false
// use force to copy over all user even if gmsRegistered is set to true
const forceMode = process.argv.includes('--force')

async function main() {
  initLogging()
  // open mysql connection
  const con = AppDatabase.getInstance()
  await con.init()

  const homeCom = await getHomeCommunity()
  if (!homeCom) {
    throw new LogError('HomeCommunity not found')
  }
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }
  // read the ids of all local users, which are still not gms registered
  const userIds = await DbUser.createQueryBuilder()
    .select('id')
    .where({ foreign: false })
    .andWhere('deleted_at is null')
    .getRawMany()
  logger.debug('userIds:', userIds)

  let alreadyUpdatedUserCount = 0
  for (const idStr of userIds) {
    logger.debug('Id:', idStr.id)
    const user = await DbUser.findOne({
      where: { id: idStr.id },
      relations: ['emailContact'],
    })
    if (user) {
      logger.debug('found local User:', user)
      if (user.gmsAllowed) {
        await sendUserToGms(user, homeCom, forceMode)
        /*
        const gmsUser = new GmsUser(user)
        try {

          if (await createGmsUser(homeCom.gmsApiKey, gmsUser)) {
            logger.debug('GMS user published successfully:', gmsUser)
            user.gmsRegistered = true
            user.gmsRegisteredAt = new Date()
            await DbUser.save(user)
            logger.debug('mark user as gms published:', user)
          }
        } catch (err) {
          logger.warn('publishing user fails with ', err)
        }
        */
      } else {
        logger.debug('GMS-Publishing not allowed by user settings:', user)
      }
    }
    alreadyUpdatedUserCount++
    process.stdout.write(`updated user: ${alreadyUpdatedUserCount}/${userIds.length}\r`)
  }
  logger.info('##gms## publishing all local users successful...')

  await con.destroy()
}

main().catch((e) => {
  logger.error(e)
  process.exit(1)
})
