import { IsNull, Not } from 'typeorm'
import { User } from 'database'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { Connection } from '@/typeorm/connection'
import { checkDBVersion } from '@/typeorm/DBVersion'

import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { UsersResponse } from './model/UsersResponse'
import { ExecutedHumhubAction, syncUser } from './syncUser'

const USER_BULK_SIZE = 20
const HUMHUB_BULK_SIZE = 50

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
 * @returns user map indices with email
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
      throw new LogError('error requesting next users page from humhub')
    }
    usersPage.results.forEach((user) => {
      // deleted users have empty emails
      if (user.account.email) {
        humhubUsers.set(user.account.email.trim(), user)
      } else {
        skippedUsersCount++
      }
    })
    page++
    process.stdout.write(
      `load users from humhub: ${humhubUsers.size}/${usersPage.total}, skipped: ${skippedUsersCount}\r`,
    )
  } while (usersPage && usersPage.results.length === HUMHUB_BULK_SIZE)

  const elapsed = new Date().getTime() - start
  logger.info('load users from humhub', {
    total: humhubUsers.size,
    timeSeconds: elapsed / 1000.0,
  })
  return humhubUsers
}

async function main() {
  const start = new Date().getTime()

  // open mysql connection
  const con = await Connection.getInstance()
  if (!con?.isConnected) {
    logger.fatal(`Couldn't open connection to database!`)
    throw new Error(`Fatal: Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    logger.fatal('Fatal: Database Version incorrect')
    throw new Error('Fatal: Database Version incorrect')
  }

  let userCount = 0
  let page = 0
  const humHubClient = HumHubClient.getInstance()
  if (!humHubClient) {
    throw new LogError('error creating humhub client')
  }
  const humhubUsers = await loadUsersFromHumHub(humHubClient)

  let dbUserCount = 0
  const executedHumhubActionsCount = [0, 0, 0, 0]

  do {
    const [users, totalUsers] = await getUsersPage(page, USER_BULK_SIZE)
    dbUserCount += users.length
    userCount = users.length
    page++
    const promises: Promise<ExecutedHumhubAction>[] = []
    users.forEach((user: User) => promises.push(syncUser(user, humhubUsers)))
    const executedActions = await Promise.all(promises)
    executedActions.forEach((executedAction: ExecutedHumhubAction) => {
      executedHumhubActionsCount[executedAction as number]++
    })
    // using process.stdout.write here so that carriage-return is working analog to c
    // printf("\rchecked user: %d/%d", dbUserCount, totalUsers);
    process.stdout.write(`checked user: ${dbUserCount}/${totalUsers}\r`)
  } while (userCount === USER_BULK_SIZE)

  await con.destroy()
  const elapsed = new Date().getTime() - start
  logger.info('export user to humhub, statistics:', {
    timeSeconds: elapsed / 1000.0,
    gradidoUserCount: dbUserCount,
    createdCount: executedHumhubActionsCount[ExecutedHumhubAction.CREATE],
    updatedCount: executedHumhubActionsCount[ExecutedHumhubAction.UPDATE],
    skippedCount: executedHumhubActionsCount[ExecutedHumhubAction.SKIP],
    deletedCount: executedHumhubActionsCount[ExecutedHumhubAction.DELETE],
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})
