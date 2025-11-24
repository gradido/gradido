import { createTestClient } from 'apollo-server-testing'
import { entities } from 'database'
import { datatype, internet, name } from 'faker'

import { CONFIG } from '@/config'
import { CONFIG as CORE_CONFIG } from 'core'
import { createServer } from '@/server/createServer'

import { initLogging } from '@/server/logger'
import { getLogger } from 'log4js'
import { writeHomeCommunityEntry } from './community'
import { contributionLinks } from './contributionLink/index'
import { creations } from './creation/index'
import { contributionLinkFactory } from './factory/contributionLink'
import { creationFactory } from './factory/creation'
import { transactionLinkFactory } from './factory/transactionLink'
import { userFactory } from './factory/user'
import { transactionLinks } from './transactionLink/index'
import { users } from './users/index'

CORE_CONFIG.EMAIL = false
const logger = getLogger('seed')

const context = {
  token: '',
  setHeaders: {
    push: (value: { key: string; value: string }): void => {
      context.token = value.value
    },

    forEach: (): void => {
      // do nothing
    },
  },
  clientTimezoneOffset: 0,
}

export const cleanDB = async () => {
  // this only works as long we do not have foreign key constraints
  for (const entity of entities) {
    if (entity.name !== 'Migration') {
      await resetEntity(entity)
    }
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
  initLogging()
  const server = await createServer(getLogger('apollo'), context)
  const seedClient = createTestClient(server.apollo)
  const { con } = server
  await cleanDB()
  logger.info('##seed## clean database successful...')
  logger.info(`crypto worker enabled: ${CONFIG.USE_CRYPTO_WORKER}`)

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

  await con.destroy()
}

run().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error('error on seeding', err)
})
