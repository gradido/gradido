import { AppDatabase, drizzleOnlyTableNames, entities } from 'database'

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

export const testEnvironment = async () => {
  const appDB = AppDatabase.getInstance()
  await appDB.init()
  return { con: appDB.getDataSource(), db: appDB }
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
