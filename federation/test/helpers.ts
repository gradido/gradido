import { dbDeleteAllRowsExceptMigrations } from 'database'
import { createTestClient } from 'apollo-server-testing'

import { createServer } from '@/server/createServer'

import { getLogger } from 'config-schema/test/testSetup'

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
  // Every table except `migrations`, in one statement that reads the table list itself - a
  // table with or without a TypeORM entity, and one added tomorrow, alike.
  await dbDeleteAllRowsExceptMigrations()
}

export const testEnvironment = async (testLogger = getLogger('apollo') /*, testI18n = i18n */) => {
  const server = await createServer(/* context, */ testLogger /* , testI18n */)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  return { mutate, query, con }
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
