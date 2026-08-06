// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed } from '../errorTypes'
import { ModuleSettingsInsert, moduleSettingsTable } from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const ModuleSettingsUpsertFailed = (row: ModuleSettingsInsert) =>
  new DBInsertFailed<ModuleSettingsInsert>('module_settings', row)

/** The singleton row id. The table holds one row for the whole instance. */
export const MODULE_SETTINGS_ID = 1

/**
 * The stored module switches, or `undefined` when no row exists yet.
 *
 * No `Result`: an absent row is not a failure. A fresh install has no row until an
 * admin saves for the first time, and the caller reads that as "every module off" -
 * the same safe state an upgraded database starts from.
 */
export async function dbSelectModuleSettings(): Promise<
  typeof moduleSettingsTable.$inferSelect | undefined
> {
  const result = await drizzleDb()
    .select()
    .from(moduleSettingsTable)
    .where(eq(moduleSettingsTable.id, MODULE_SETTINGS_ID))
    .limit(1)
  return result.at(0)
}

/**
 * Writes the switches, creating the singleton row on the first save.
 *
 * One statement rather than select-then-insert: two admins saving at the same moment
 * would otherwise both find no row and both insert id = 1, and one of them would hit
 * the primary key.
 */
export async function dbUpsertModuleSettings(
  matchingActive: boolean,
): Promise<Result<boolean, DBInsertFailed<ModuleSettingsInsert>>> {
  const row: ModuleSettingsInsert = {
    id: MODULE_SETTINGS_ID,
    matchingActive: matchingActive ? 1 : 0,
  }

  const result = await drizzleDb()
    .insert(moduleSettingsTable)
    .values(row)
    .onDuplicateKeyUpdate({ set: { matchingActive: row.matchingActive, updatedAt: new Date() } })

  // Deliberately NOT a check on affectedRows: MySQL answers 1 for an insert, 2 for an
  // update that changed something, and 0 when the stored row already held these values.
  // Saving a switch that is already in that position is a success, not a failure, so
  // counting rows here would report the most ordinary case as broken.
  const firstRow = result.at(0)
  if (firstRow) {
    return { success: true, value: matchingActive }
  }

  return { success: false, error: ModuleSettingsUpsertFailed(row) }
}
