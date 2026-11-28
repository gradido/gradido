// AI-GENERATED — not an architecture reference
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { creaSettingsTable } from '../schemas/drizzle.schema'
import {
  dbGetFirstCreationSignerUserId,
  dbSelectCreaSettings,
  dbSetFirstCreationSignerUserId,
  dbUpsertCreaModerationSettings,
} from './creaSettings'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const appDB = AppDatabase.getInstance()
const rowCount = async () => (await drizzleDb().select().from(creaSettingsTable)).length

beforeAll(async () => {
  await appDB.init()
  await dbDeleteAllRowsExceptMigrations()
})
afterAll(async () => {
  await dbDeleteAllRowsExceptMigrations()
  await appDB.destroy()
})

describe('creaSettings query test', () => {
  it('answers null when no Crea setting was ever saved', async () => {
    expect(await dbGetFirstCreationSignerUserId()).toBeNull()
  })

  it('creates the singleton row on the first set and reads the signer back', async () => {
    await dbSetFirstCreationSignerUserId(7)
    expect(await dbGetFirstCreationSignerUserId()).toBe(7)
    expect(await rowCount()).toBe(1)
  })

  it('leaves the moderation settings on the row alone', async () => {
    // What the admin's Crea page had stored before the signer was picked.
    await dbUpsertCreaModerationSettings({ model: 'claude-opus-5', effort: 'high', fastMode: true })
    await dbSetFirstCreationSignerUserId(9)
    expect(await dbSelectCreaSettings()).toMatchObject({
      model: 'claude-opus-5',
      effort: 'high',
      fastMode: true,
      firstCreationSignerUserId: 9,
    })
  })

  it('leaves the signer alone when the moderation settings are saved', async () => {
    await dbUpsertCreaModerationSettings({ model: null, effort: 'low', fastMode: false })
    expect(await dbSelectCreaSettings()).toMatchObject({
      model: null,
      effort: 'low',
      fastMode: false,
      firstCreationSignerUserId: 9,
    })
  })

  it('lets two admins create the singleton at the same moment without a duplicate', async () => {
    await dbDeleteAllRowsExceptMigrations()
    await Promise.all([dbSetFirstCreationSignerUserId(3), dbSetFirstCreationSignerUserId(4)])
    expect(await rowCount()).toBe(1)
    expect([3, 4]).toContain(await dbGetFirstCreationSignerUserId())
  })

  it('clears the signer with null and does not add a second row', async () => {
    await dbSetFirstCreationSignerUserId(null)
    expect(await dbGetFirstCreationSignerUserId()).toBeNull()
    expect(await rowCount()).toBe(1)
  })
})
