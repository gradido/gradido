// AI-GENERATED — not an architecture reference
import { eq, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { EventMatchingArrivalSelect, eventMatchingArrivalsTable } from '../schemas/drizzle.schema'

/**
 * Notes at an account that the invitation onto the map is due: the confirmation has just made
 * the entry an event link noted (migration 0161). The wallet invites the member after their
 * next sign-in, on whichever device, and takes the row away then.
 *
 * In the caller's transaction, the one that makes the entry: an invitation without its entry
 * names a sentence that is not there, an entry without its invitation is a member nobody leads
 * to the map. Both, or neither.
 *
 * One row an account, and a second one replaces the first rather than being refused. An
 * account registers once, so there is no second as a rule; but a refusal here would take the
 * entry down with it, and the entry matters more than the invitation. ⛔ What `affectedRows`
 * says of an upsert (1, 2 or 0) is no success signal, so nothing is read from it.
 */
export async function dbMarkEventMatchingArrival(
  userId: number,
  matchingEntryUuid: string,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<void> {
  await (tx ?? drizzleDb())
    .insert(eventMatchingArrivalsTable)
    .values({ userId, matchingEntryUuid })
    .onDuplicateKeyUpdate({ set: { matchingEntryUuid, createdAt: sql`current_timestamp(3)` } })
}

/**
 * The invitation that is due at this account, or undefined where none is. The entry it names
 * is read by its uuid from the entries themselves (`dbSelectMatchingEntryByUuid`), in a second
 * statement rather than a join: the two tables were created by different migrations, and a
 * comparison across them depends on collations that differ between servers.
 */
export async function dbSelectEventMatchingArrival(
  userId: number,
): Promise<EventMatchingArrivalSelect | undefined> {
  const rows = await drizzleDb()
    .select()
    .from(eventMatchingArrivalsTable)
    .where(eq(eventMatchingArrivalsTable.userId, userId))
    .limit(1)
  return rows.at(0)
}

/**
 * The invitation is over: it had the screen, or the member stands on the map without it. Where
 * none was due, nothing happens -- the wallet may say it twice, from two tabs.
 */
export async function dbDeleteEventMatchingArrival(userId: number): Promise<void> {
  await drizzleDb()
    .delete(eventMatchingArrivalsTable)
    .where(eq(eventMatchingArrivalsTable.userId, userId))
}
