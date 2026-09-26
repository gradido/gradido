import { createTestClient } from 'apollo-server-testing'
import {
  AppDatabase,
  drizzleOnlyTableNames,
  entities,
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
  // this only works as long we do not have foreign key constraints
  for (const entity of entities) {
    if (entity.name !== 'Migration') {
      await resetEntity(entity)
    }
  }
  // The tables without a TypeORM entity: `entities` does not know them, so their rows used
  // to outlive the test file that wrote them. The list lives next to the schema.
  // Over the TypeORM connection, not Drizzle's: dht-node runs cleanDB under Jest's fake
  // timers, which fake `process.nextTick` - and mysql2, Drizzle's driver, hands every result
  // over through it. TypeORM runs on the `mysql` package and is not affected.
  const dataSource = AppDatabase.getInstance().getDataSource()
  for (const tableName of drizzleOnlyTableNames) {
    await dataSource.query(`DELETE FROM \`${tableName}\``)
  }
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

export const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((e: any) => e.id)
    await entity.delete(ids)
  }
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
