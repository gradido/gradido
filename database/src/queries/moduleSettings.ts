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
  // One clock for both paths. Left to the column, the insert would be stamped by the
  // database server and the update by this process, and the two disagree by the server's
  // timezone offset. The explicit stamp is also what makes the update path move at all:
  // ON UPDATE CURRENT_TIMESTAMP only fires when some other column actually changes, and
  // saving a switch that is already in that position changes nothing.
  const now = new Date()
  const row: ModuleSettingsInsert = {
    id: MODULE_SETTINGS_ID,
    matchingActive: matchingActive ? 1 : 0,
    updatedAt: now,
  }

  // The failure has to be caught, not read off the result. Drizzle answers a statement
  // that ran with [ResultSetHeader, FieldPacket[]], so index 0 is always there and always
  // truthy - inspecting it would leave this branch unreachable. A statement that failed
  // rejects instead, and without this catch the driver's own message, failing SQL
  // included, would travel out of here to the caller.
  //
  // Deliberately NOT a check on affectedRows either: MySQL answers 1 for an insert and 2
  // for an update, and saving a switch that is already in that position is a success.
  try {
    await drizzleDb()
      .insert(moduleSettingsTable)
      .values(row)
      .onDuplicateKeyUpdate({ set: { matchingActive: row.matchingActive, updatedAt: now } })
  } catch {
    return { success: false, error: ModuleSettingsUpsertFailed(row) }
  }

  return { success: true, value: matchingActive }
}
