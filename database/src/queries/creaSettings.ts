// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { CreaSettingSelect, creaSettingsTable } from '../schemas/drizzle.schema'

// `crea_settings` is a single-row singleton (id = 1). Every write is an upsert of its own
// columns only: the row carries both the moderation settings and the first-creation signer,
// and writing one half must never put back a stale copy of the other.

const SINGLETON_ID = 1

/** The settings row, or undefined while no admin has ever saved a Crea setting. */
export async function dbSelectCreaSettings(): Promise<CreaSettingSelect | undefined> {
  const rows = await drizzleDb()
    .select()
    .from(creaSettingsTable)
    .where(eq(creaSettingsTable.id, SINGLETON_ID))
  return rows.at(0)
}

/**
 * Writes the moderation settings (model, effort, fast mode), creating the row if needed.
 * One INSERT ... ON DUPLICATE KEY UPDATE, so two admins saving at once cannot race into a
 * duplicate key, and the signer column stays untouched.
 */
export async function dbUpsertCreaModerationSettings(
  settings: Pick<CreaSettingSelect, 'model' | 'effort' | 'fastMode'>,
): Promise<void> {
  await drizzleDb()
    .insert(creaSettingsTable)
    .values({ id: SINGLETON_ID, ...settings })
    .onDuplicateKeyUpdate({ set: settings })
}

/**
 * Who signs the first creation (ES-005), or null when nobody is configured — and null is
 * the normal state of every installation until an admin picks somebody, so it is a value,
 * not a failure.
 */
export async function dbGetFirstCreationSignerUserId(): Promise<number | null> {
  const row = await dbSelectCreaSettings()
  return row?.firstCreationSignerUserId ?? null
}

/**
 * Sets (or clears) the signer. Column-targeted upsert, like the moderation settings above.
 *
 * Plain `void`: with a valid id this always succeeds, there is no expected failure.
 */
export async function dbSetFirstCreationSignerUserId(userId: number | null): Promise<void> {
  await drizzleDb()
    .insert(creaSettingsTable)
    .values({ id: SINGLETON_ID, firstCreationSignerUserId: userId })
    .onDuplicateKeyUpdate({ set: { firstCreationSignerUserId: userId } })
}
