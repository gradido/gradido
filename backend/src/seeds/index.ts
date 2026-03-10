import {
  AppDatabase,
  creationFactoryBulk,
  transactionLinkFactoryBulk,
  User,
  UserInterface,
} from 'database'
import { internet, name } from 'faker'
import { getLogger } from 'log4js'
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
  logger.info(`crypto worker enabled: ${CONFIG.USE_CRYPTO_WORKER}`)

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
  const randomUsers = new Array<UserInterface>(RANDOM_USER_COUNT)
  for (let i = 0; i < RANDOM_USER_COUNT; i++) {
    randomUsers[i] = {
      firstName: name.firstName(),
      lastName: name.lastName(),
      email: internet.email(),
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

async function clearDatabase(db: AppDatabase) {
  await db.getDataSource().transaction(async (trx) => {
    await trx.query(`SET FOREIGN_KEY_CHECKS = 0`)
    await trx.query(`TRUNCATE TABLE contributions`)
    await trx.query(`TRUNCATE TABLE contribution_links`)
    await trx.query(`TRUNCATE TABLE events`)
    await trx.query(`TRUNCATE TABLE users`)
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
