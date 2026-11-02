// AI-GENERATED — not an architecture reference
import { sql } from 'drizzle-orm'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { MIGRATIONS_TABLE } from '../config/const'
import {
  dbDeleteAllRowsExceptMigrations,
  dbTruncateAllRowsExceptMigrations,
} from './informationSchemaTables'

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

describe('dbTruncateAllRowsExceptMigrations', () => {
  const insertEvents = (rows: number) =>
    appDB
      .getDataSource()
      .query(
        `INSERT INTO events (type, affected_user_id, acting_user_id) VALUES ${Array.from({ length: rows }, () => "('TEST', 1, 1)").join(', ')}`,
      )
  const highestEventId = async (): Promise<number> => {
    const [row] = await appDB.getDataSource().query('SELECT MAX(id) AS id FROM events')
    return Number(row.id)
  }

  afterEach(async () => {
    await dbDeleteAllRowsExceptMigrations()
  })

  it('empties a table with a counter and one without, and keeps migrations', async () => {
    await insertEvents(1)
    await appDB
      .getDataSource()
      .query(
        "INSERT INTO user_favorites (user_id, favorite_community_uuid, favorite_gradido_id) VALUES (1, 'c', 'g')",
      )
    const migrationsBefore = await count(MIGRATIONS_TABLE)
    // The fixture has to prove itself: without rows the check below passes on any statement.
    expect(await count('events')).toBeGreaterThan(0)
    expect(await count('user_favorites')).toBeGreaterThan(0)
    expect(migrationsBefore).toBeGreaterThan(0)

    await dbTruncateAllRowsExceptMigrations()

    expect(await count('events')).toBe(0)
    expect(await count('user_favorites')).toBe(0)
    expect(await count(MIGRATIONS_TABLE)).toBe(migrationsBefore)
  })

  it('empties a table a foreign key refers to, and checks foreign keys again afterwards', async () => {
    const dataSource = appDB.getDataSource()
    await dataSource.query(
      'CREATE TABLE fk_probe_parent (id INT AUTO_INCREMENT PRIMARY KEY) ENGINE=InnoDB',
    )
    try {
      await dataSource.query(
        'CREATE TABLE fk_probe_child (id INT AUTO_INCREMENT PRIMARY KEY, parent_id INT NOT NULL, FOREIGN KEY (parent_id) REFERENCES fk_probe_parent (id)) ENGINE=InnoDB',
      )
      await dataSource.query('INSERT INTO fk_probe_parent VALUES ()')
      await dataSource.query('INSERT INTO fk_probe_child (parent_id) VALUES (1)')

      await dbTruncateAllRowsExceptMigrations()

      expect(await count('fk_probe_parent')).toBe(0)
      expect(await count('fk_probe_child')).toBe(0)
      const [[row]] = (await drizzleDb().execute(
        sql.raw('SELECT @@foreign_key_checks AS checks'),
      )) as unknown as [{ checks: number }[]]
      expect(Number(row.checks)).toBe(1)
    } finally {
      await dataSource.query('DROP TABLE IF EXISTS fk_probe_child, fk_probe_parent')
    }
  })

  it('lets the ids count from 1 again, also of a table already emptied by DELETE', async () => {
    await insertEvents(2)
    await dbDeleteAllRowsExceptMigrations()
    await insertEvents(1)
    // The fixture has to prove itself: after the DELETE alone the id does not start at 1.
    expect(await highestEventId()).toBeGreaterThan(1)
    await dbDeleteAllRowsExceptMigrations()

    await dbTruncateAllRowsExceptMigrations()

    await insertEvents(1)
    expect(await highestEventId()).toBe(1)
  })
})
