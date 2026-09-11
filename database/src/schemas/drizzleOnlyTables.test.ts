// AI-GENERATED — not an architecture reference
import { AppDatabase } from '../AppDatabase'
import { entities } from '../entity'
import { drizzleOnlyTableNames } from './drizzleOnlyTables'

/**
 * `cleanDB` in the test helpers empties TypeORM's `entities` and `drizzleOnlyTables`, and
 * nothing else. This holds both lists against the tables the migrations actually create, so
 * a new table that is on neither fails here - not months later, as a test that fails or
 * passes depending on which files happened to run before it.
 */

const appDB = AppDatabase.getInstance()

beforeAll(async () => {
  await appDB.init()
})

afterAll(async () => {
  await appDB.destroy()
})

describe('the tables cleanDB empties', () => {
  let databaseTables: string[]
  let entityTables: string[]

  beforeAll(async () => {
    const rows: { name: string }[] = await appDB
      .getDataSource()
      .query(
        "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'",
      )
    databaseTables = rows.map((row) => row.name)
    entityTables = entities.map((entity) => appDB.getDataSource().getMetadata(entity).tableName)
  })

  it('knows every table the migrations create', () => {
    const known = new Set([...entityTables, ...drizzleOnlyTableNames])
    // The fixture has to prove itself: an empty result would make the check below pass on
    // any schema at all.
    expect(databaseTables).toContain('users')
    // ⚠️ A table named here needs an entry in `drizzleOnlyTables` - see AGENTS.md.
    expect(databaseTables.filter((table) => !known.has(table))).toEqual([])
  })

  it('lists only tables that exist', () => {
    expect(drizzleOnlyTableNames.filter((table) => !databaseTables.includes(table))).toEqual([])
  })

  // A table with an entity is emptied through `entities` already; listed here as well it
  // would be emptied twice, and the list would stop saying what it is for.
  it('lists no table that has a TypeORM entity', () => {
    expect(drizzleOnlyTableNames.filter((table) => entityTables.includes(table))).toEqual([])
  })
})
