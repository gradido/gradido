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
    // The most ordinary case of all: saving a switch that is already in that position. It
    // has to read as a success and leave the stored row exactly as it was. The returned
    // value alone would prove nothing - it is the argument handed back - so the row is
    // read again here.
    await dbUpsertModuleSettings(false)

    expect(await dbUpsertModuleSettings(false)).toEqual({ success: true, value: false })
    expect(await dbSelectModuleSettings()).toMatchObject({ matchingActive: 0 })
    expect(await db.select().from(moduleSettingsTable)).toHaveLength(1)
  })

  it('stamps updated_at on the update path, not only on the insert', async () => {
    // The column's own ON UPDATE clause does not fire when no other column changes, so
    // without the explicit stamp a repeated save would leave the timestamp behind and
    // nobody could tell when a switch was last confirmed.
    await dbUpsertModuleSettings(true)
    const first = (await dbSelectModuleSettings())?.updatedAt

    await new Promise((resolve) => setTimeout(resolve, 5))
    await dbUpsertModuleSettings(true)
    const second = (await dbSelectModuleSettings())?.updatedAt

    expect(first).toBeInstanceOf(Date)
    expect(second?.getTime()).toBeGreaterThan((first as Date).getTime())
  })
})
