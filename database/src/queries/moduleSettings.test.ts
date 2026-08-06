// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { moduleSettingsTable } from '../schemas'
import { dbSelectModuleSettings, dbUpsertModuleSettings } from './moduleSettings'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(moduleSettingsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('moduleSettings query test', () => {
  it('reads no row on a fresh database', async () => {
    // The migration writes no row on purpose, so this is the state every install starts
    // in - and the caller has to read it as "every module off".
    expect(await dbSelectModuleSettings()).toBeUndefined()
  })

  it('creates the singleton row on the first save', async () => {
    const result = await dbUpsertModuleSettings(true)

    expect(result).toEqual({ success: true, value: true })
    expect(await db.select().from(moduleSettingsTable)).toMatchObject([
      { id: 1, matchingActive: 1 },
    ])
  })

  it('updates the existing row instead of adding a second one', async () => {
    await dbUpsertModuleSettings(false)

    const rows = await db.select().from(moduleSettingsTable)
    expect(rows).toHaveLength(1)
    expect(await dbSelectModuleSettings()).toMatchObject({ matchingActive: 0 })
  })

  it('reports success when the stored value is written again', async () => {
    // MySQL answers affectedRows 0 here, because the row already holds this value.
    // Saving a switch that is already in that position must not read as a failure.
    await dbUpsertModuleSettings(false)

    expect(await dbUpsertModuleSettings(false)).toEqual({ success: true, value: false })
  })
})
