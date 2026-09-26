import { AppDatabase, dbDeleteAllRowsExceptMigrations } from 'database'

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

export const testEnvironment = async () => {
  const appDB = AppDatabase.getInstance()
  await appDB.init()
  return { con: appDB.getDataSource(), db: appDB }
}

// Taken while it is still the real one - see useFakeTimersForDrizzle.
const realNextTick = process.nextTick

/**
 * `jest.useFakeTimers()` for code that reaches a Drizzle query - `cleanDB` does. Jest 27's
 * modern timers fake `process.nextTick` along with the rest, and mysql2 - Drizzle's driver -
 * hands every result over through it: under the plain call a Drizzle query waits forever.
 * Same helper as in backend/test/helpers.ts. Undone as usual by `jest.useRealTimers()`.
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
