// AI-GENERATED — not an architecture reference
import { dbSelectModuleSettings } from 'database'

import { ModuleActivation } from '@/data/Module.logic'

/**
 * Which optional modules this instance offers, held for the process rather than read per
 * request.
 *
 * The authorization check asks on every authorized root field, and it is the one place in
 * this backend that must not do database work. It would read through the drizzle pool,
 * which is a second connection pool beside TypeORM's, and putting that on the request
 * path made three timer-faking tests hang: a request awaiting a mysql2 promise never
 * returns while jest has process.nextTick faked, and because the suite runs --runInBand
 * the damaged pool outlived the file that damaged it.
 *
 * So the request path only ever reads memory. The value is primed while the server starts,
 * replaced the moment an admin writes it, and otherwise refreshed in the background once
 * it has gone stale - started by a reader, never awaited by one.
 *
 * What this gives up, said plainly: with more than one backend process a flip made in one
 * of them reaches the others within REFRESH_AFTER_MS rather than at once. There is one
 * process today, and in it the flip is immediate.
 */

const REFRESH_AFTER_MS = 30_000

/** Everything off. What a fresh install reads, and the safe state to start from. */
let activation: ModuleActivation = { matchingActive: false }
let readAt = 0
let refreshing = false

const readFromDatabase = async (): Promise<ModuleActivation> => {
  const row = await dbSelectModuleSettings()
  // Boolean() rather than a comparison against 1: drizzle's tinyint column normalizes
  // what the driver hands back, so this only has to turn 0/1 into a boolean.
  return { matchingActive: Boolean(row?.matchingActive) }
}

/**
 * Primes the cache while the server starts, on real timers and before it serves anything.
 *
 * Deliberately not guarded: a backend that cannot read which modules it offers has no
 * business answering requests, and at this point the database is known to be up -
 * AppDatabase.init() has already checked the schema version.
 */
export const loadModuleActivation = async (): Promise<void> => {
  activation = await readFromDatabase()
  readAt = Date.now()
}

/** Replaces it in the process that just wrote the switches, so the flip is immediate there. */
export const setModuleActivation = (next: ModuleActivation): void => {
  activation = next
  readAt = Date.now()
}

/**
 * The switches as this process currently knows them. Never awaits.
 *
 * A stale value starts one background refresh and the caller still gets the value in hand.
 * A refresh that fails changes nothing: the last value the database actually gave stays,
 * and the next reader tries again. That is a deliberate departure from refusing the
 * request - an unreachable database should not withdraw a module from everyone.
 */
export const getModuleActivation = (): ModuleActivation => {
  if (!refreshing && Date.now() - readAt > REFRESH_AFTER_MS) {
    refreshing = true
    readFromDatabase()
      .then((next) => {
        activation = next
        readAt = Date.now()
      })
      .catch(() => {
        // keep what we have
      })
      .finally(() => {
        refreshing = false
      })
  }
  return activation
}

/** Test seam: puts the process back into the state a fresh start is in. */
export const resetModuleActivation = (): void => {
  activation = { matchingActive: false }
  readAt = 0
  refreshing = false
}
