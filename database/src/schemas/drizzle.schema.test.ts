// AI-GENERATED — not an architecture reference
import { is } from 'drizzle-orm'
import { getTableConfig, MySqlTable } from 'drizzle-orm/mysql-core'
import { AppDatabase } from '../AppDatabase'
import * as schema from './drizzle.schema'

/**
 * The schema describes the tables the migrations (ts-mysql-migrate) create; nothing is
 * generated from it. So nothing but a test notices when the two drift apart. This one holds
 * the primary keys against the database - Drizzle reads them for `$returningId()`.
 */

const appDB = AppDatabase.getInstance()

const schemaTables = Object.values(schema).filter((value): value is MySqlTable =>
  is(value, MySqlTable),
)

function schemaPrimaryKey(table: MySqlTable): string[] {
  const config = getTableConfig(table)
  const single = config.columns.filter((column) => column.primary).map((column) => column.name)
  const composite = config.primaryKeys.flatMap((key) => key.columns.map((column) => column.name))
  return [...single, ...composite]
}

beforeAll(async () => {
  await appDB.init()
})

afterAll(async () => {
  await appDB.destroy()
})

describe('drizzle.schema', () => {
  it('describes every table with the primary key the database has', async () => {
    const rows: { tableName: string; columnName: string }[] = await appDB
      .getDataSource()
      .query(
        "SELECT table_name AS tableName, column_name AS columnName FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND constraint_name = 'PRIMARY' ORDER BY table_name, ordinal_position",
      )
    // The fixture has to prove itself: without rows every comparison below compares nothing.
    expect(schemaTables.length).toBeGreaterThan(10)

    const mismatches = schemaTables.flatMap((table) => {
      const name = getTableConfig(table).name
      const inDatabase = rows.filter((row) => row.tableName === name).map((row) => row.columnName)
      const inSchema = schemaPrimaryKey(table)
      return inSchema.join(',') === inDatabase.join(',')
        ? []
        : [`${name}: schema [${inSchema}], database [${inDatabase}]`]
    })
    expect(mismatches).toEqual([])
  })
})
