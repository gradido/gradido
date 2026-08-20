// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { thankYouCardSettingsTable } from '../schemas'
import {
  dbDeleteThankYouCardSettings,
  dbSelectThankYouCardSettings,
  dbUpdateThankYouCardLimits,
  dbUpgradeThankYouCardPinDerivation,
  dbUpsertThankYouCardSettings,
} from './thankYouCardSettings'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const settingsOf = (userId: number, pin = 111111n) => ({
  userId,
  pin,
  pinSalt: `salt-${userId}`,
  pinDerivation: 2,
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
      expect(result.value.pin).toBe(111111n)
      expect(result.value.pinSalt).toBe('salt-2')
      expect(result.value.maxPerPayment.toString()).toBe(GradidoUnit.fromNumber(50).toString())
      expect(result.value.maxPerDay.toString()).toBe(GradidoUnit.fromNumber(100).toString())
    }
  })

  it('replaces PIN and limits on a second write instead of adding a row', async () => {
    await dbUpsertThankYouCardSettings(settingsOf(3))
    await dbUpsertThankYouCardSettings({
      ...settingsOf(3, 222222n),
      maxPerPayment: GradidoUnit.fromNumber(20),
    })

    const result = await dbSelectThankYouCardSettings(3)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.pin).toBe(222222n)
      expect(result.value.maxPerPayment.toString()).toBe(GradidoUnit.fromNumber(20).toString())
    }
  })

  /**
   * ⛔ A REAL pin value, not a tidy one.
   *
   * The stored pin is the full 64 bit word `crypto_shorthash` returns, and only 2^53 of the
   * 2^64 possible values fit through a JS number — one in 2048, so virtually every pin is
   * affected. The tests above use 111111n and 222222n —
   * small enough to survive a trip through a JS number, and therefore blind to the only
   * failure that matters here: if anything on the way to the column or back treats the
   * value as a double, the pin comes back changed and NO pin ever matches again, for
   * anybody, while the server counts attempts down and blocks the card.
   *
   * Both directions are covered: the first write (INSERT) and the second one (the
   * ON DUPLICATE KEY UPDATE branch), because they bind their values separately.
   */
  it('keeps a pin above the safe integer range, on the first write and the second', async () => {
    const huge = 18446744073709551557n // just under 2^64, far above 2^53
    const alsoHuge = 9007199254740993n // 2^53 + 1, the first value a double cannot hold

    await dbUpsertThankYouCardSettings(settingsOf(11, huge))
    const first = await dbSelectThankYouCardSettings(11)

    expect(first.success).toBe(true)
    if (first.success) {
      expect(first.value.pin).toBe(huge)
    }

    await dbUpsertThankYouCardSettings(settingsOf(11, alsoHuge))
    const second = await dbSelectThankYouCardSettings(11)

    expect(second.success).toBe(true)
    if (second.success) {
      expect(second.value.pin).toBe(alsoHuge)
    }
  })

  // ⚠️ MySQL answers an unchanged upsert with 0 affected rows. Saving the same limits
  // again is the most common case there is, so it must not be read as a failure.
  /**
   * The silent upgrade path for rows written with the old expensive derivation. The write
   * is guarded by the OLD hash: it must only land while the row still holds the value the
   * caller just proved a PIN against.
   */
  describe('upgrading the pin derivation', () => {
    const legacyRow = (userId: number) => ({ ...settingsOf(userId, 555n), pinDerivation: 1 })

    it('rewrites hash, salt and derivation while the old hash still stands', async () => {
      await dbUpsertThankYouCardSettings(legacyRow(20))

      const upgraded = await dbUpgradeThankYouCardPinDerivation({
        userId: 20,
        oldPin: 555n,
        oldPinDerivation: 1,
        pin: 777n,
        pinSalt: 'fresh-salt',
        pinDerivation: 2,
      })
      expect(upgraded.success).toBe(true)

      const after = await dbSelectThankYouCardSettings(20)
      expect(after.success).toBe(true)
      if (after.success) {
        expect(after.value.pin).toBe(777n)
        expect(after.value.pinSalt).toBe('fresh-salt')
        expect(after.value.pinDerivation).toBe(2)
      }
    })

    /**
     * ⛔ The guard itself: a newer secret must never be overwritten by a derivation of an
     * older one. The owner set a new PIN between prove and upgrade -- the upgrade must
     * match nothing and say so.
     */
    it('refuses when the row changed under the caller', async () => {
      await dbUpsertThankYouCardSettings(legacyRow(21))
      await dbUpsertThankYouCardSettings({ ...settingsOf(21, 999n), pinSalt: 'newer' })

      const upgraded = await dbUpgradeThankYouCardPinDerivation({
        userId: 21,
        oldPin: 555n,
        oldPinDerivation: 1,
        pin: 777n,
        pinSalt: 'stale-salt',
        pinDerivation: 2,
      })
      expect(upgraded.success).toBe(false)

      const after = await dbSelectThankYouCardSettings(21)
      if (after.success) {
        expect(after.value.pin).toBe(999n)
        expect(after.value.pinSalt).toBe('newer')
      }
    })

    /** A second run finds derivation 2 in the row and matches nothing -- harmless. */
    it('is idempotent, the second run matches nothing', async () => {
      await dbUpsertThankYouCardSettings(legacyRow(22))
      const args = {
        userId: 22,
        oldPin: 555n,
        oldPinDerivation: 1,
        pin: 777n,
        pinSalt: 'fresh-salt',
        pinDerivation: 2,
      }
      expect((await dbUpgradeThankYouCardPinDerivation(args)).success).toBe(true)
      expect((await dbUpgradeThankYouCardPinDerivation(args)).success).toBe(false)
    })
  })

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
      expect(read.value.pin).toBe(111111n)
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
