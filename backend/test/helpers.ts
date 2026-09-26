import { createTestClient } from 'apollo-server-testing'
import { dbDeleteAllRowsExceptMigrations } from 'database'
import {
  AppDatabase,
  HOME_COMMUNITY_CHANGED_CHANNEL,
} from 'database'

import { newRequestBudget } from '@/server/context'
import { createServer } from '@/server/createServer'

import { getLogger } from 'log4js'

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
  // A getter, because Apollo copies this object for every operation and the copy reads each
  // property once: every operation of the test client gets a budget of its own, as every
  // HTTP request does from the context function. A plain object here would be ONE budget
  // for a whole test file, and the tenth full-size picture of the file would be its last.
  get requestBudget() {
    return newRequestBudget()
  },
}

export const cleanDB = async () => {
  // Every table except `migrations`, in one statement that reads the table list itself - a
  // table with or without a TypeORM entity, and one added tomorrow, alike.
  await dbDeleteAllRowsExceptMigrations()
  
  // The rows are gone past the query functions, so nobody announced it: the cached home
  // community would outlive them. publish() reaches this process at once, Redis or not.
  AppDatabase.getInstance().publish(HOME_COMMUNITY_CHANGED_CHANNEL)
}

export const testEnvironment = async (testLogger = getLogger('apollo')) => {
  const server = await createServer( testLogger, context)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  return { mutate, query, con, db: server.db }
}

// Taken while it is still the real one - see useFakeTimersForDrizzle.
const realNextTick = process.nextTick

/**
 * `jest.useFakeTimers()` for code that reaches a Drizzle query. Jest 27's modern timers fake
 * `process.nextTick` along with the rest, and mysql2 - Drizzle's driver - hands every result
 * over through it: under the plain call a Drizzle query waits forever, and the test dies on
 * the hook timeout. TypeORM runs on the `mysql` package and does not notice, which is why
 * this only shows once a query moves to Drizzle. Undone as usual by `jest.useRealTimers()`.
 */
export const useFakeTimersForDrizzle = () => {
  jest.useFakeTimers()
  process.nextTick = realNextTick
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
