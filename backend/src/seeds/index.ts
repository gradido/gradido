/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import createServer from '../server/createServer'
import { createTestClient } from 'apollo-server-testing'

import { name, internet, random } from 'faker'

import { users } from './users/index'
import { creations } from './creation/index'
import { userFactory } from './factory/user'
import { creationFactory } from './factory/creation'
import { entities } from '@entity/index'

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
  // this only works as lond we do not have foreign key constraints
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
      language: random.boolean() ? 'en' : 'de',
    })
  }

  // create GDD
  for (let i = 0; i < creations.length; i++) {
    await creationFactory(seedClient, creations[i])
  }

  await con.close()
}

run()
