// AI-GENERATED — not an architecture reference
import { AppDatabase } from '../AppDatabase'
import { MIGRATIONS_TABLE } from '../config/const'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const appDB = AppDatabase.getInstance()

beforeAll(async () => {
  await appDB.init()
})

afterAll(async () => {
  await appDB.destroy()
})

const count = async (table: string): Promise<number> => {
  const rows: { n: number | string }[] = await appDB
    .getDataSource()
    .query(`SELECT COUNT(*) AS n FROM \`${table}\``)
  return Number(rows[0].n)
}

describe('dbDeleteAllRowsExceptMigrations', () => {
  it('empties a table with a TypeORM entity and one without, and keeps migrations', async () => {
    const dataSource = appDB.getDataSource()
    await dataSource.query(
      "INSERT INTO events (type, affected_user_id, acting_user_id) VALUES ('TEST', 1, 1)",
    )
    await dataSource.query(
      "INSERT INTO user_favorites (user_id, favorite_community_uuid, favorite_gradido_id) VALUES (1, 'c', 'g')",
    )
    const migrationsBefore = await count(MIGRATIONS_TABLE)
    // The fixture has to prove itself: without rows the check below passes on any statement.
    expect(await count('events')).toBeGreaterThan(0)
    expect(await count('user_favorites')).toBeGreaterThan(0)
    expect(migrationsBefore).toBeGreaterThan(0)

    await dbDeleteAllRowsExceptMigrations()

    expect(await count('events')).toBe(0)
    expect(await count('user_favorites')).toBe(0)
    expect(await count(MIGRATIONS_TABLE)).toBe(migrationsBefore)
  })
})
