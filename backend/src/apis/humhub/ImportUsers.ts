import { IsNull, Not } from '@dbTools/typeorm'
import { User } from '@entity/User'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { Connection } from '@/typeorm/connection'
import { checkDBVersion } from '@/typeorm/DBVersion'

import { checkForChanges } from './checkForChanges'
import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { PostUser } from './model/PostUser'

const USER_BULK_SIZE = 20

enum ExecutedHumhubAction {
  UPDATE,
  CREATE,
  SKIP,
}

function getUsersPage(page: number, limit: number): Promise<[User[], number]> {
  return User.findAndCount({
    relations: { emailContact: true },
    skip: page * limit,
    take: limit,
    where: { emailContact: { email: Not(IsNull()) } },
  })
}

async function createOrUpdateOrSkipUser(
  user: User,
  humHubClient: HumHubClient,
  humhubUsers: Map<string, GetUser>,
): Promise<ExecutedHumhubAction> {
  const postUser = new PostUser(user)
  const humhubUser = humhubUsers.get(user.emailContact.email.trim())
  if (humhubUser) {
    if (checkForChanges(humhubUser, user)) {
      return ExecutedHumhubAction.SKIP
    }
    await humHubClient.updateUser(postUser, humhubUser.id)
    return ExecutedHumhubAction.UPDATE
  } else {
    await humHubClient.createUser(postUser)
    return ExecutedHumhubAction.CREATE
  }
}

/**
 * @param client
 * @returns user map indiced with email
 */
async function loadUsersFromHumHub(client: HumHubClient): Promise<Map<string, GetUser>> {
  const start = new Date().getTime()
  const humhubUsers = new Map<string, GetUser>()
  const firstPage = await client.users(0, 50)
  if (!firstPage) {
    throw new LogError('not a single user found on humhub, please check config and setup')
  }
  firstPage.results.forEach((user) => {
    humhubUsers.set(user.account.email.trim(), user)
  })
  let page = 1
  while (humhubUsers.size < firstPage.total) {
    const usersPage = await client.users(page, 50)
    if (!usersPage) {
      throw new LogError('error requesting next users page from humhub')
    }
    usersPage.results.forEach((user) => {
      humhubUsers.set(user.account.email.trim(), user)
    })
    page++
  }
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
  let updatedUserCount = 0
  let createdUserCount = 0
  let skippedUserCount = 0

  do {
    const [users, totalUsers] = await getUsersPage(page, USER_BULK_SIZE)
    dbUserCount += users.length
    userCount = users.length
    page++
    const promises: Promise<ExecutedHumhubAction>[] = []
    users.forEach((user: User) =>
      promises.push(createOrUpdateOrSkipUser(user, humHubClient, humhubUsers)),
    )
    const executedActions = await Promise.all(promises)
    executedActions.forEach((executedAction: ExecutedHumhubAction) => {
      if (executedAction === ExecutedHumhubAction.CREATE) createdUserCount++
      else if (executedAction === ExecutedHumhubAction.UPDATE) updatedUserCount++
      else if (executedAction === ExecutedHumhubAction.SKIP) skippedUserCount++
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
    updatedUserCount,
    createdUserCount,
    skippedUserCount,
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})
