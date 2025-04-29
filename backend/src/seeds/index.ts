/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { createTestClient } from 'apollo-server-testing'
import { entities } from 'database'
import { name, internet, datatype } from 'faker'

import { CONFIG } from '@/config'
import { createServer } from '@/server/createServer'
import { backendLogger as logger } from '@/server/logger'

import { writeHomeCommunityEntry } from './community'
import { contributionLinks } from './contributionLink/index'
import { creations } from './creation/index'
import { contributionLinkFactory } from './factory/contributionLink'
import { creationFactory } from './factory/creation'
import { transactionLinkFactory } from './factory/transactionLink'
import { userFactory } from './factory/user'
import { transactionLinks } from './transactionLink/index'
import { users } from './users/index'

CONFIG.EMAIL = false

const context = {
  token: '',
  setHeaders: {
    push: (value: { key: string; value: string }): void => {
      context.token = value.value
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    forEach: (): void => {},
  },
  clientTimezoneOffset: 0,
}

export const cleanDB = async () => {
  // this only works as long we do not have foreign key constraints
  for (const entity of entities) {
    await resetEntity(entity)
  }
}

const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((e: any) => e.id)
    await entity.delete(ids)
  }
}

const run = async () => {
  const server = await createServer(context)
  const seedClient = createTestClient(server.apollo)
  const { con } = server
  await cleanDB()
  logger.info('##seed## clean database successful...')

  // seed home community
  await writeHomeCommunityEntry()

  // seed the standard users
  for (const user of users) {
    await userFactory(seedClient, user)
  }
  logger.info('##seed## seeding all standard users successful...')

  // seed 100 random users
  for (let i = 0; i < 100; i++) {
    await userFactory(seedClient, {
      firstName: name.firstName(),
      lastName: name.lastName(),
      email: internet.email(),
      language: datatype.boolean() ? 'en' : 'de',
    })
    logger.info(`##seed## seed ${i}. random user`)
  }
  logger.info('##seed## seeding all random users successful...')

  // create GDD
  for (const creation of creations) {
    await creationFactory(seedClient, creation)
  }
  logger.info('##seed## seeding all creations successful...')

  // create Transaction Links
  for (const transactionLink of transactionLinks) {
    await transactionLinkFactory(seedClient, transactionLink)
  }
  logger.info('##seed## seeding all transactionLinks successful...')

  // create Contribution Links
  for (const contributionLink of contributionLinks) {
    await contributionLinkFactory(seedClient, contributionLink)
  }
  logger.info('##seed## seeding all contributionLinks successful...')

  await con.close()
}

void run()
