/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { createTestClient } from 'apollo-server-testing'
import createServer from '../src/server/createServer'
import { initialize } from '@dbTools/helpers'
import { entities } from '@entity/index'
import { i18n, logger } from './testSetup'

export const headerPushMock = jest.fn((t) => {
  context.token = t.value
})

const context = {
  token: '',
  setHeaders: {
    push: headerPushMock,
    forEach: jest.fn(),
  },
  clientTimezoneOffset: 0,
}

export const cleanDB = async () => {
  // this only works as lond we do not have foreign key constraints
  for (let i = 0; i < entities.length; i++) {
    await resetEntity(entities[i])
  }
}

export const testEnvironment = async (testLogger: any = logger, testI18n: any = i18n) => {
  const server = await createServer(context, testLogger, testI18n)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  await initialize()
  return { mutate, query, con }
}

export const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((i: any) => i.id)
    await entity.delete(ids)
  }
}

export const resetToken = () => {
  context.token = ''
}

// format date string as it comes from the frontend for the contribution date
export const contributionDateFormatter = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

export const setClientTimezoneOffset = (offset: number): void => {
  context.clientTimezoneOffset = offset
}
