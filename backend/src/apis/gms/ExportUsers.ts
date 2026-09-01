import { CONFIG as CORE_CONFIG, delay } from 'core'
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
// Members read from the database per round. It no longer has to fit the GMS's limits
// on its own: `sendUsersToGms` splits the snapshots by entry count before sending, so
// a batch of members holding more entries than one call may carry becomes several
// calls rather than a refusal.
//
// That split is what this number used to have to guess at, and guessing was fragile:
// the GMS's entry budget moved from 5000 to 3000 when the keyed columns widened an
// entry row, which would have dropped the safe average here from 25 entries per
// member to 15 without a line of this file changing.
const BATCH_SIZE = 200
const REQUEST_PER_SECOND = 10
const ONE_SECOND_IN_MILLISECONDS = 1000

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
  let timoutRequestCheck = new Date()
  let requestCountSinceLastCheck = 0
  do {
    const now = new Date()
    if (now.getTime() - timoutRequestCheck.getTime() > ONE_SECOND_IN_MILLISECONDS) {
      timoutRequestCheck = now
      requestCountSinceLastCheck = 0
    }
    if (requestCountSinceLastCheck >= REQUEST_PER_SECOND) {
      // wait to don't trigger request timeout of nginx of gms server
      await delay(
        Math.abs(ONE_SECOND_IN_MILLISECONDS - (now.getTime() - timoutRequestCheck.getTime())),
      )
    }
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
      requestCountSinceLastCheck++
    }
    alreadyUpdatedUserCount += lastIndex - current
    current += BATCH_SIZE
    process.stdout.write(`updated user: ${alreadyUpdatedUserCount}/${userIds.length}\r`)
  } while (current < userIds.length)

  logger.info(`##gms## publishing all local users in ${timeUsed} successful...`)
  await con.destroy()
}

main().catch((e) => {
  logger.error(e)
  process.exit(1)
})
