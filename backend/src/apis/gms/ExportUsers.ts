import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase, User as DbUser, getHomeCommunity } from 'database'
import { getLogger } from 'log4js'
import { MonotonicTimer } from 'shared-native'
import { In } from 'typeorm'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { sendUsersToGms } from '@/graphql/resolver/util/sendUserToGms'
import { LogError } from '@/server/LogError'
import { initLogging } from '@/server/logger'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.ExportUsers`)

CORE_CONFIG.EMAIL = false
// Members per call. 100 always fits both GMS limits - 500 snapshots and 5000 entries
// across the batch - no matter how many entries a member has.
//
// Raising this changes what binds: the two limits meet at ten entries per member, and
// above that average the entry budget runs out first - 500 members averaging twelve
// entries are 6000 entries and refused. Whoever goes higher has to cut the snapshots by
// entry count rather than by member count; there is a worked pattern for it in the GMS
// repo, `snapshotChunks()` in backend/src/logic/communitySync.bench.test.ts.
const BATCH_SIZE = 100

async function main() {
  const timeUsed = new MonotonicTimer()

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
    .where({ foreign: false, gmsAllowed: true })
    .andWhere('deleted_at is null')
    .getRawMany()

  let alreadyUpdatedUserCount = 0
  let current = 0
  do {
    const lastIndex = Math.min(current + BATCH_SIZE, userIds.length)
    const ids = userIds.slice(current, lastIndex).map((idStr) => idStr.id)
    logger.debug(`ids: ${JSON.stringify(ids)}`)
    const users = await DbUser.find({
      where: { id: In(ids) },
      relations: ['emailContact'],
    })
    if (users) {
      // The repair run sends the entries along, so the GMS also drops copies of
      // entries that were paused or deleted while it could not be reached.
      if (!(await sendUsersToGms(users, homeCom, true))) {
        // early exit on failure
        logger.warn(`##gms## publishing local users failed after ${timeUsed}...`)
        await con.destroy()
        return
      }
    }
    current += BATCH_SIZE
    alreadyUpdatedUserCount += BATCH_SIZE
    process.stdout.write(`updated user: ${alreadyUpdatedUserCount}/${userIds.length}\r`)
  } while (current < userIds.length)

  logger.info(`##gms## publishing all local users in ${timeUsed} successful...`)
  await con.destroy()
}

main().catch((e) => {
  logger.error(e)
  process.exit(1)
})
