// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { thankYouCardSettingsTable } from '../schemas'
import {
  dbDeleteThankYouCardSettings,
  dbSelectThankYouCardSettings,
  dbUpdateThankYouCardLimits,
  dbUpsertThankYouCardSettings,
} from './thankYouCardSettings'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const settingsOf = (userId: number, pin = 111111) => ({
  userId,
  pin,
  pinSalt: `salt-${userId}`,
  maxPerPayment: GradidoUnit.fromNumber(50),
  maxPerDay: GradidoUnit.fromNumber(100),
})

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(thankYouCardSettingsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('thankYouCardSettings query test', () => {
  // The absence of a row is the normal state for everybody who never switched card
  // payment on, so it has to be an answer rather than a fault.
  it('reports "no settings" for a member who never switched it on', async () => {
    const result = await dbSelectThankYouCardSettings(1)
    expect(result.success).toBe(false)
  })

  it('creates the row on first write and reads it back', async () => {
    await dbUpsertThankYouCardSettings(settingsOf(2))

    const result = await dbSelectThankYouCardSettings(2)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.pin).toBe(111111)
      expect(result.value.pinSalt).toBe('salt-2')
      expect(result.value.maxPerPayment.toString()).toBe(GradidoUnit.fromNumber(50).toString())
      expect(result.value.maxPerDay.toString()).toBe(GradidoUnit.fromNumber(100).toString())
    }
  })

  it('replaces PIN and limits on a second write instead of adding a row', async () => {
    await dbUpsertThankYouCardSettings(settingsOf(3))
    await dbUpsertThankYouCardSettings({
      ...settingsOf(3, 222222),
      maxPerPayment: GradidoUnit.fromNumber(20),
    })

    const result = await dbSelectThankYouCardSettings(3)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.pin).toBe(222222)
      expect(result.value.maxPerPayment.toString()).toBe(GradidoUnit.fromNumber(20).toString())
    }
  })

  // ⚠️ MySQL answers an unchanged upsert with 0 affected rows. Saving the same limits
  // again is the most common case there is, so it must not be read as a failure.
  it('succeeds when the very same values are saved again', async () => {
    await dbUpsertThankYouCardSettings(settingsOf(4))

    const again = await dbUpsertThankYouCardSettings(settingsOf(4))

    expect(again.success).toBe(true)
  })

  it('changes the limits without touching the PIN', async () => {
    await dbUpsertThankYouCardSettings(settingsOf(5))

    const result = await dbUpdateThankYouCardLimits(5, {
      maxPerPayment: GradidoUnit.fromNumber(5),
      maxPerDay: GradidoUnit.fromNumber(15),
    })

    expect(result.success).toBe(true)
    const read = await dbSelectThankYouCardSettings(5)
    if (read.success) {
      expect(read.value.pin).toBe(111111)
      expect(read.value.maxPerDay.toString()).toBe(GradidoUnit.fromNumber(15).toString())
    }
  })

  it('reports a missing row when limits are set for somebody who is switched off', async () => {
    const result = await dbUpdateThankYouCardLimits(6, {
      maxPerPayment: GradidoUnit.fromNumber(5),
      maxPerDay: GradidoUnit.fromNumber(15),
    })
    expect(result.success).toBe(false)
  })

  it('switches card payment off by removing the row', async () => {
    await dbUpsertThankYouCardSettings(settingsOf(7))

    await dbDeleteThankYouCardSettings(7)

    expect((await dbSelectThankYouCardSettings(7)).success).toBe(false)
  })
})
