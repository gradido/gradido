/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import createServer from '../server/createServer'
import { createTestClient } from 'apollo-server-testing'

import { users } from './users/index'
import { createUserFactory } from './factory/user'
import { entities } from '@entity/index'

const context = {
  token: '',
  setHeaders: {
    push: (value: string): void => {
      context.token = value
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
  const testClient = createTestClient(server.apollo)
  const { mutate } = testClient
  const { con } = server
  await cleanDB()

  for (let i = 0; i < users.length; i++) {
    await createUserFactory(mutate, users[i])
  }

  await con.close()
}

run()
