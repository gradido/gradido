import { ModuleSetting } from 'database'

// Per-instance switches for optional modules, stored as a single-row singleton
// (module_settings, id = 1) and flipped by an admin in the admin UI.
//
// Read fresh wherever it is needed rather than cached, so flipping the switch takes
// effect at once - the same choice readCreaSettings makes, and the reason the switch
// lives in the database instead of in the server config. It costs nothing on the
// paths that do not ask for it: the authorization gate only reads it for a request
// that actually wants a gated right (see GATED_MODULES in ./gate and isAuthorized).

const SINGLETON_ID = 1

export interface StoredModuleSettings {
  matchingActive: boolean
}

/**
 * The stored module switches. No row means every module is off: a fresh install has
 * no row until an admin saves, and the migration deliberately writes none.
 *
 * Errors are NOT caught here, on purpose. A module switch that cannot be read must
 * deny, never grant - so the failure has to reach the caller instead of turning into
 * a default. Because the gate reads this lazily, a database failure here can only
 * ever refuse a gated request; it cannot affect the rest of the application.
 */
export async function readModuleSettings(): Promise<StoredModuleSettings> {
  const row = await ModuleSetting.findOneBy({ id: SINGLETON_ID })
  return { matchingActive: row?.matchingActive ?? false }
}

/** Upserts the singleton row. Creates it on the first save. */
export async function writeModuleSettings(matchingActive: boolean): Promise<StoredModuleSettings> {
  let row = await ModuleSetting.findOneBy({ id: SINGLETON_ID })
  if (!row) {
    row = ModuleSetting.create({ id: SINGLETON_ID })
  }
  row.matchingActive = matchingActive
  await ModuleSetting.save(row)
  return { matchingActive: row.matchingActive }
}
