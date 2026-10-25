import {
  AppDatabase,
  creationFactoryBulk,
  transactionLinkFactoryBulk,
  User,
  UserInterface,
} from 'database'
import { internet, name } from 'faker'
import { getLogger } from 'log4js'
import { AppContext, additionalAliasVariants, aliasCandidates, findFirstFreeAlias } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { initLogging } from '@/server/logger'
import { writeHomeCommunityEntry } from './community'
import { contributionLinks } from './contributionLink/index'
import { creations } from './creation/index'
import { contributionLinkFactory } from './factory/contributionLink'
import { userFactoryBulk } from './factory/user'
import { transactionLinks } from './transactionLink/index'
import { users } from './users/index'

const RANDOM_USER_COUNT = 100
const logger = getLogger('seed')

const run = async () => {
  initLogging()
  const db = AppDatabase.getInstance()
  await db.init()
  await clearDatabase(db)
  logger.info('clean database successful...')
  AppContext.getInstance().initPasswordHashing({
    appSecret: CONFIG.LOGIN_APP_SECRET,
    serverKey: CONFIG.LOGIN_SERVER_KEY,
  })

  // seed home community
  const homeCommunity = await writeHomeCommunityEntry()

  // seed the standard users
  // put into map for later direct access
  const userCreationIndexedByEmail = new Map<string, User>()
  const defaultUsers = await userFactoryBulk(users, homeCommunity)
  for (const dbUser of defaultUsers) {
    userCreationIndexedByEmail.set(dbUser.emailContact.email, dbUser)
  }
  logger.info('seeding all standard users successful...')

  // seed 100 random users
  // Every one of them holds a name (migration 0164 refuses a local row without one), built
  // from the generated name the way registration builds it. `taken` is this run's own
  // record of the names handed out, the standard users' included, so no two collide.
  const taken = new Set<string>(defaultUsers.map((dbUser) => dbUser.alias.toLowerCase()))
  const randomUsers = new Array<UserInterface>(RANDOM_USER_COUNT)
  for (let i = 0; i < RANDOM_USER_COUNT; i++) {
    const firstName = name.firstName()
    const lastName = name.lastName()
    const email = internet.email()
    // Drawn here, not in the factory: the ladder's last rung is built from it.
    const gradidoId = uuidv4()
    randomUsers[i] = {
      alias: seedAlias(firstName, lastName, email, gradidoId, taken),
      gradidoId,
      firstName,
      lastName,
      email,
      language: Math.random() < 0.5 ? 'en' : 'de',
    }
  }
  await userFactoryBulk(randomUsers, homeCommunity)
  logger.info('seeding all random users successful...')

  // create GDD
  const moderatorUser = userCreationIndexedByEmail.get('peter@lustig.de')!
  await creationFactoryBulk(creations, userCreationIndexedByEmail, moderatorUser)
  logger.info('seeding all creations successful...')

  // create Transaction Links
  const movedTransactionLinks = transactionLinks.map((transactionLink) => {
    let createdAt = new Date(new Date().getTime() + 1000)
    if (transactionLink.createdAt) {
      createdAt = transactionLink.createdAt
    }
    return {
      ...transactionLink,
      createdAt: createdAt,
    }
  })
  await transactionLinkFactoryBulk(movedTransactionLinks, userCreationIndexedByEmail)
  logger.info('seeding all transactionLinks successful...')

  // create Contribution Links
  for (const contributionLink of contributionLinks) {
    await contributionLinkFactory(null, contributionLink)
  }
  logger.info('seeding all contributionLinks successful...')

  await db.destroy()
}

// The first free name of the ladder registration climbs (RegisterUserRole.getFreeAlias): the
// candidates as they are, then numbered, then the gradido id. Lowercased into `taken`, because
// the column compares case-insensitively.
function seedAlias(
  firstName: string,
  lastName: string,
  email: string,
  gradidoId: string,
  taken: Set<string>,
): string {
  const candidates = aliasCandidates({ firstName, lastName, email })
  const alias =
    findFirstFreeAlias([...taken], candidates) ??
    findFirstFreeAlias([...taken], additionalAliasVariants(candidates)) ??
    gradidoId.slice(0, 18).toLowerCase()
  taken.add(alias.toLowerCase())
  return alias
}

async function clearDatabase(db: AppDatabase) {
  await db.getDataSource().transaction(async (trx) => {
    await trx.query(`SET FOREIGN_KEY_CHECKS = 0`)
    await trx.query(`TRUNCATE TABLE contributions`)
    await trx.query(`TRUNCATE TABLE contribution_links`)
    await trx.query(`TRUNCATE TABLE events`)
    await trx.query(`TRUNCATE TABLE users`)
    await trx.query(`TRUNCATE TABLE user_aliases`)
    await trx.query(`TRUNCATE TABLE user_contacts`)
    await trx.query(`TRUNCATE TABLE user_roles`)
    await trx.query(`TRUNCATE TABLE transactions`)
    await trx.query(`TRUNCATE TABLE transaction_links`)
    await trx.query(`TRUNCATE TABLE communities`)
    await trx.query(`SET FOREIGN_KEY_CHECKS = 1`)
  })
}

run().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error('error on seeding', err)
})
