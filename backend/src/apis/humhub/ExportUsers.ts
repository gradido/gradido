import { AppDatabase, User } from 'database'
import { getLogger } from 'log4js'
import { IsNull, Not } from 'typeorm'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { initLogging } from '@/server/logger'
import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { UsersResponse } from './model/UsersResponse'
import { ExecutedHumhubAction, syncUser } from './syncUser'

const USER_BULK_SIZE = 20
const HUMHUB_BULK_SIZE = 50
const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.humhub.ExportUsers`)

function getUsersPage(page: number, limit: number): Promise<[User[], number]> {
  return User.findAndCount({
    relations: { emailContact: true },
    skip: page * limit,
    take: limit,
    where: { emailContact: { email: Not(IsNull()) } },
  })
}

/**
 * @param client
 * @returns user map indices with username
 */
async function loadUsersFromHumHub(client: HumHubClient): Promise<Map<string, GetUser>> {
  const start = new Date().getTime()
  const humhubUsers = new Map<string, GetUser>()
  let page = 0
  let skippedUsersCount = 0
  let usersPage: UsersResponse | null = null
  do {
    usersPage = await client.users(page, HUMHUB_BULK_SIZE)
    if (!usersPage) {
      throw new Error('error requesting next users page from humhub')
    }
    for (const user of usersPage.results) {
      // deleted users have empty emails
      if (user.account.email) {
        humhubUsers.set(user.account.username, user)
      } else {
        skippedUsersCount++
      }
    }
    page++
    process.stdout.write(
      `load users from humhub: ${humhubUsers.size}/${usersPage.total}, skipped: ${skippedUsersCount}\r`,
    )
  } while (usersPage && usersPage.results.length === HUMHUB_BULK_SIZE)
  process.stdout.write('\n')

  const elapsed = new Date().getTime() - start
  logger.info('load users from humhub', {
    total: humhubUsers.size,
    timeSeconds: elapsed / 1000.0,
  })
  return humhubUsers
}

async function main() {
  const start = new Date().getTime()
  initLogging()
  // open mysql connection
  const con = AppDatabase.getInstance()
  await con.init()

  let userCount = 0
  let page = 0
  const humHubClient = HumHubClient.getInstance()
  if (!humHubClient) {
    throw new Error('error creating humhub client')
  }
  const humhubUsers = await loadUsersFromHumHub(humHubClient)

  let dbUserCount = 0
  const executedHumhubActionsCount = [0, 0, 0, 0, 0]

  do {
    try {
      const [users, totalUsers] = await getUsersPage(page, USER_BULK_SIZE)
      dbUserCount += users.length
      userCount = users.length
      page++
      const promises: Promise<ExecutedHumhubAction>[] = []
      for (const user of users) {
        promises.push(syncUser(user, humhubUsers))
      }
      const executedActions = await Promise.all(promises)
      for (const executedAction of executedActions) {
        executedHumhubActionsCount[executedAction as number]++
      }
      // using process.stdout.write here so that carriage-return is working analog to c
      // printf("\rchecked user: %d/%d", dbUserCount, totalUsers);
      process.stdout.write(`checked user: ${dbUserCount}/${totalUsers}\r`)
    } catch (e) {
      process.stdout.write('\n')
      throw e
    }
  } while (userCount === USER_BULK_SIZE)
  process.stdout.write('\n')

  await con.destroy()
  const elapsed = new Date().getTime() - start
  logger.info('export user to humhub, statistics:', {
    timeSeconds: elapsed / 1000.0,
    gradidoUserCount: dbUserCount,
    createdCount: executedHumhubActionsCount[ExecutedHumhubAction.CREATE],
    updatedCount: executedHumhubActionsCount[ExecutedHumhubAction.UPDATE],
    skippedCount: executedHumhubActionsCount[ExecutedHumhubAction.SKIP],
    deletedCount: executedHumhubActionsCount[ExecutedHumhubAction.DELETE],
    validationErrorCount: executedHumhubActionsCount[ExecutedHumhubAction.VALIDATION_ERROR],
  })
}

main().catch((e) => {
  logger.error(e)
  process.exit(1)
})
