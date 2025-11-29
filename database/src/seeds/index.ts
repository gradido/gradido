import { AppDatabase } from '../AppDatabase'
import { createCommunity } from './community'
import { userFactoryBulk } from './factory/user'
import { users } from './users'
import { internet, name } from 'faker'
import { creationFactoryBulk } from './factory/creation'
import { creations } from './creation'
import { transactionLinkFactoryBulk } from './factory/transactionLink'
import { transactionLinks } from './transactionLink'
import { contributionLinkFactory } from './factory/contributionLink'
import { contributionLinks } from './contributionLink'
import { User } from '../entity'
import { UserInterface } from './users/UserInterface'

const RANDOM_USER_COUNT = 100

async function run() {
  console.info('##seed## seeding started...')
  
  const db = AppDatabase.getInstance()
  await db.init()
  await clearDatabase()

  // seed home community
  const homeCommunity = await createCommunity(false)  
  console.info(`##seed## seeding home community successful ...`)

  // seed standard users
  // put into map for later direct access
  const userCreationIndexedByEmail = new Map<string, User>()
  const defaultUsers = await userFactoryBulk(users, homeCommunity)
  for (const dbUser of defaultUsers) {
    userCreationIndexedByEmail.set(dbUser.emailContact.email, dbUser)
  }
  console.info(`##seed## seeding all standard users successful ...`)  

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
  console.info(`##seed## seeding ${RANDOM_USER_COUNT} random users successful ...`)

  // create GDD serial, must be called one after another because seeding don't use semaphore
  const moderatorUser = userCreationIndexedByEmail.get('peter@lustig.de')!
  await creationFactoryBulk(creations, userCreationIndexedByEmail, moderatorUser)
  console.info(`##seed## seeding all creations successful ...`)

  // create Contribution Links
  for (const contributionLink of contributionLinks) {
    await contributionLinkFactory(contributionLink)
  }
  console.info(`##seed## seeding all contributionLinks successful ...`)

  // create Transaction Links
  await transactionLinkFactoryBulk(transactionLinks, userCreationIndexedByEmail)
  console.info(`##seed## seeding all transactionLinks successful ...`)

  await db.destroy()
  console.info(`##seed## seeding successful...`)
}

async function clearDatabase() {
  await AppDatabase.getInstance().getDataSource().transaction(async trx => {
    await trx.query(`SET FOREIGN_KEY_CHECKS = 0`)
    await trx.query(`TRUNCATE TABLE contributions`)
    await trx.query(`TRUNCATE TABLE contribution_links`)
    await trx.query(`TRUNCATE TABLE users`)
    await trx.query(`TRUNCATE TABLE user_contacts`)
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

