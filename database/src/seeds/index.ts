import { AppDatabase } from '../AppDatabase'
import { clearDatabase } from '../../migration/clear'
import { createCommunity } from './community'
import { userFactory } from './factory/user'
import { users } from './users'
import { datatype, internet, name } from 'faker'
import { creationFactory } from './factory/creation'
import { creations } from './creation'
import { transactionLinkFactory } from './factory/transactionLink'
import { transactionLinks } from './transactionLink'
import { contributionLinkFactory } from './factory/contributionLink'
import { contributionLinks } from './contributionLink'
import { User } from '../entity'
import { TransactionLink } from '../entity'
import { ContributionLink } from '../entity'

const RANDOM_USER_COUNT = 100

async function run() {
  const now = new Date()
  // clear database, use mysql2 directly, not AppDatabase
  await clearDatabase()

  const db = AppDatabase.getInstance()
  await db.init()

  // seed home community
  const homeCommunity = await createCommunity(false)
  console.info('##seed## seeding home community successful...')

  // seed standard users
  // start creation of all users in parallel
  // put into map for later direct access
  const userCreationIndexedByEmail = new Map<string, Promise<User>>()
  for (const user of users) {
    userCreationIndexedByEmail.set(user.email!, userFactory(user, homeCommunity))
  }
  const defaultUsersPromise = Promise.all(userCreationIndexedByEmail.values()).then(() => {
    // log message after all users are created
    console.info('##seed## seeding all standard users successful...')
  })

  // seed 100 random users
  // start creation of all random users in parallel
  const randomUsersCreation: Promise<User>[] = []
  for (let i = 0; i < RANDOM_USER_COUNT; i++) {
    randomUsersCreation.push(userFactory({
      firstName: name.firstName(),
      lastName: name.lastName(),
      email: internet.email(),
      language: datatype.boolean() ? 'en' : 'de',
    }, homeCommunity))
  }
  const randomUsersPromise = Promise.all(randomUsersCreation).then(() => {
    // log message after all random users are created
    console.info(`##seed## seeding ${RANDOM_USER_COUNT} random users successful...`)
  })

  // create Contribution Links
  // start creation of all contribution links in parallel
  const contributionLinksPromises: Promise<ContributionLink>[] = []
  for (const contributionLink of contributionLinks) {
    contributionLinksPromises.push(contributionLinkFactory(contributionLink))
  }
  const contributionLinksPromise = Promise.all(contributionLinksPromises).then(() => {
    // log message after all contribution links are created
    console.info('##seed## seeding all contributionLinks successful...')
  })

  // create Transaction Links
  // start creation of all transaction links in parallel
  const transactionLinksPromises: Promise<TransactionLink>[] = []
  for (const transactionLink of transactionLinks) {
    const user = await userCreationIndexedByEmail.get(transactionLink.email)!
    transactionLinksPromises.push(transactionLinkFactory(transactionLink, user.id))
  }
  const transactionLinksPromise = Promise.all(transactionLinksPromises).then(() => {
    // log message after all transaction links are created
    console.info('##seed## seeding all transactionLinks successful...')
  })

  // create GDD serial, must be called one after another because seeding don't use semaphore
  const moderatorUser = await userCreationIndexedByEmail.get('peter@lustig.de')!
  for (const creation of creations) {
    const user = await userCreationIndexedByEmail.get(creation.email)!
    await creationFactory(creation, user, moderatorUser)
  }

  // wait for all promises to be resolved
  await Promise.all([
    defaultUsersPromise,
    randomUsersPromise,
    contributionLinksPromise,
    transactionLinksPromise,
  ])

  await db.destroy()
  const timeDiffSeconds = (new Date().getTime() - now.getTime()) / 1000
  console.info(`##seed## seeding successful... after ${timeDiffSeconds} seconds`)
}

run().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error('error on seeding', err)
})

