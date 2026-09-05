// AI-GENERATED — not an architecture reference
import { CreaSetting } from '../entity/CreaSetting'

// `crea_settings` is a TypeORM table today (migration 0106). These two functions are step 1
// of the query migration for the one column the first creation owns: moved here, not yet
// translated to Drizzle. The model/effort/fast-mode half of the row is still read and
// written from backend/src/apis/anthropic/crea/settings.ts and follows later.

const SINGLETON_ID = 1

/**
 * Who signs the first creation (ES-005), or null when nobody is configured — and null is
 * the normal state of every installation until an admin picks somebody, so it is a value,
 * not a failure.
 */
export async function dbGetFirstCreationSignerUserId(): Promise<number | null> {
  const row = await CreaSetting.findOneBy({ id: SINGLETON_ID })
  return row?.firstCreationSignerUserId ?? null
}

/**
 * Sets (or clears) the signer. Column-targeted on purpose: the row also carries the
 * moderation settings, and a `save()` of a loaded entity would write those back from
 * whatever moment it was loaded. Creates the singleton row when the admin has never
 * saved any Crea setting before.
 *
 * Plain `void`: with a valid id this always succeeds, there is no expected failure.
 */
export async function dbSetFirstCreationSignerUserId(userId: number | null): Promise<void> {
  const updated = await CreaSetting.update(
    { id: SINGLETON_ID },
    { firstCreationSignerUserId: userId },
  )
  if (!updated.affected) {
    await CreaSetting.insert({ id: SINGLETON_ID, firstCreationSignerUserId: userId })
  }
}
