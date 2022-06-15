/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import createServer from '../server/createServer'
import { createTestClient } from 'apollo-server-testing'

import { name, internet, datatype } from 'faker'

import { users } from './users/index'
import { creations } from './creation/index'
import { transactionLinks } from './transactionLink/index'
import { contributionLinks } from './contributionLink/index'
import { userFactory } from './factory/user'
import { creationFactory } from './factory/creation'
import { transactionLinkFactory } from './factory/transactionLink'
import { contributionLinkFactory } from './factory/contributionLink'
import { entities } from '@entity/index'
import CONFIG from '@/config'

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
}

export const cleanDB = async () => {
  // this only works as long we do not have foreign key constraints
  for (let i = 0; i < entities.length; i++) {
    await resetEntity(entities[i])
  }
}

const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((i: any) => i.id)
    await entity.delete(ids)
  }
}

const run = async () => {
  const server = await createServer(context)
  const seedClient = createTestClient(server.apollo)
  const { con } = server
  await cleanDB()

  // seed the standard users
  for (let i = 0; i < users.length; i++) {
    await userFactory(seedClient, users[i])
  }

  // seed 100 random users
  for (let i = 0; i < 100; i++) {
    await userFactory(seedClient, {
      firstName: name.firstName(),
      lastName: name.lastName(),
      email: internet.email(),
      language: datatype.boolean() ? 'en' : 'de',
    })
  }

  // create GDD
  for (let i = 0; i < creations.length; i++) {
    const now = new Date().getTime() // we have to wait a little! quick fix for account sum problem of bob@baumeister.de, (see https://github.com/gradido/gradido/issues/1886)
    await creationFactory(seedClient, creations[i])
    // eslint-disable-next-line no-empty
    while (new Date().getTime() < now + 1000) {} // we have to wait a little! quick fix for account sum problem of bob@baumeister.de, (see https://github.com/gradido/gradido/issues/1886)
  }

  // create Transaction Links
  for (let i = 0; i < transactionLinks.length; i++) {
    await transactionLinkFactory(seedClient, transactionLinks[i])
  }

  // create Contribution Links
  for (let i = 0; i < contributionLinks.length; i++) {
    await contributionLinkFactory(seedClient, contributionLinks[i])
  }

  await con.close()
}

run()
