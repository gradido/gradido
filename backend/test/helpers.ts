/* eslint-disable @typescript-eslint/unbound-method */
import { entities } from '@entity/index'
import { createTestClient } from 'apollo-server-testing'

import { Context } from '@/server/context'
import { createServer } from '@/server/createServer'

import { i18n, logger } from './testSetup'

export const headerPushMock = jest.fn(([t]: Context['setHeaders']) => {
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

export const testEnvironment = async (testLogger = logger, testI18n = i18n) => {
  const server = await createServer(context, testLogger, testI18n)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  return { mutate, query, con }
}

const [entityTypes] = entities

export const resetEntity = async (entity: typeof entityTypes) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((i) => i.id)
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
