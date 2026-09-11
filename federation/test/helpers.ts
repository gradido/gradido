import { AppDatabase, drizzleOnlyTableNames, entities } from 'database'
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
  // this only works as long we do not have foreign key constraints
  for (const entity of entities) {
    if (entity.name !== 'Migration') {
      await resetEntity(entity)
    }
  }
  // The tables without a TypeORM entity: `entities` does not know them, so their rows used
  // to outlive the test file that wrote them. The list lives next to the schema.
  // Over the TypeORM connection, not Drizzle's pool: that pool opens its first connection
  // on first use, and dht-node runs cleanDB under fake timers, where that never completes.
  const dataSource = AppDatabase.getInstance().getDataSource()
  for (const tableName of drizzleOnlyTableNames) {
    await dataSource.query(`DELETE FROM \`${tableName}\``)
  }
}

export const testEnvironment = async (testLogger = getLogger('apollo') /*, testI18n = i18n */) => {
  const server = await createServer(/* context, */ testLogger /* , testI18n */)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  return { mutate, query, con }
}

export const resetEntity = async (entity: any) => {
  const items = await entity.find({ withDeleted: true })
  if (items.length > 0) {
    const ids = items.map((e: any) => e.id)
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
