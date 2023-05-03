import { entities } from '@entity/index'
import { createTestClient } from 'apollo-server-testing'
import { name, internet, datatype } from 'faker'

import { CONFIG } from '@/config'
import { createServer } from '@/server/createServer'
import { backendLogger as logger } from '@/server/logger'

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
  for (let i = 0; i < entities.length; i++) {
    await resetEntity(entities[i])
  }
}

const [entityTypes] = entities

const resetEntity = async (entity: typeof entityTypes) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((i) => i.id)
    await entity.delete(ids)
  }
}

const run = async () => {
  const server = await createServer(context)
  const seedClient = createTestClient(server.apollo)
  const { con } = server
  await cleanDB()
  logger.info('##seed## clean database successful...')

  // seed the standard users
  for (let i = 0; i < users.length; i++) {
    const dbUser = await userFactory(seedClient, users[i])
    logger.info(`##seed## seed standard users[ ${i} ]= ${JSON.stringify(dbUser, null, 2)}`)
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
  for (let i = 0; i < creations.length; i++) {
    await creationFactory(seedClient, creations[i])
  }
  logger.info('##seed## seeding all creations successful...')

  // create Transaction Links
  for (let i = 0; i < transactionLinks.length; i++) {
    await transactionLinkFactory(seedClient, transactionLinks[i])
  }
  logger.info('##seed## seeding all transactionLinks successful...')

  // create Contribution Links
  for (let i = 0; i < contributionLinks.length; i++) {
    await contributionLinkFactory(seedClient, contributionLinks[i])
  }
  logger.info('##seed## seeding all contributionLinks successful...')

  await con.close()
}

void run()
