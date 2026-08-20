// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { GradidoUnit, Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import {
  ThankYouCardSettingsInsert,
  ThankYouCardSettingsSelect,
  thankYouCardSettingsTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const SettingsNotFound = (where: string) => new DBNotFoundError('thank_you_card_settings', where)

/** What a member may change once card payment is switched on. */
export interface ThankYouCardLimits {
  maxPerPayment: GradidoUnit
  maxPerDay: GradidoUnit
}

/**
 * The settings row of one member, or a not-found error.
 *
 * ⚠️ "Not found" is not an edge case here, it is the normal answer for everybody who has
 * never switched card payment on — which is everybody at the time this ships. The caller
 * has to read it as "off", not as a fault.
 */
export async function dbSelectThankYouCardSettings(
  userId: number,
): Promise<Result<ThankYouCardSettingsSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(thankYouCardSettingsTable)
    .where(eq(thankYouCardSettingsTable.userId, userId))

  const row = rows.at(0)
  if (!row) {
    return { success: false, error: SettingsNotFound(`userId=${userId}`) }
  }
  return { success: true, value: row }
}

/**
 * Write the settings row, creating it if it is not there yet. This is what switching card
 * payment on does — there is no separate flag, the row itself is the switch.
 *
 * ⚠️ Deliberately no affectedRows check. MySQL answers an upsert with 1 for an insert,
 * 2 for a real change and 0 when the row already held these values — and "saving the same
 * limit again" is the most common case of all. A row count is not a success signal here;
 * the absence of a thrown driver error is.
 */
export async function dbUpsertThankYouCardSettings(
  row: ThankYouCardSettingsInsert,
): Promise<VoidResult> {
  await drizzleDb()
    .insert(thankYouCardSettingsTable)
    .values(row)
    .onDuplicateKeyUpdate({
      set: {
        pin: row.pin,
        pinSalt: row.pinSalt,
        pinDerivation: row.pinDerivation,
        maxPerPayment: row.maxPerPayment,
        maxPerDay: row.maxPerDay,
        updatedAt: new Date(),
      },
    })
  return { success: true }
}

/** Change the two limits without touching the PIN. */
export async function dbUpdateThankYouCardLimits(
  userId: number,
  limits: ThankYouCardLimits,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(thankYouCardSettingsTable)
    .set({ ...limits, updatedAt: new Date() })
    .where(eq(thankYouCardSettingsTable.userId, userId))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows > 0) {
    return { success: true }
  }
  return { success: false, error: SettingsNotFound(`userId=${userId}`) }
}

/**
 * Switching card payment off. The row goes, the cards stay — a member who switches back
 * on later still has their card history, and the blocked ones stay recognisable.
 */
export async function dbDeleteThankYouCardSettings(userId: number): Promise<VoidResult> {
  await drizzleDb()
    .delete(thankYouCardSettingsTable)
    .where(eq(thankYouCardSettingsTable.userId, userId))
  return { success: true }
}
