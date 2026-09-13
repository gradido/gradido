// AI-GENERATED — not an architecture reference
import { and, asc, eq, isNull, like, sql } from 'drizzle-orm'
import { OptInType } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { userContactsTable } from '../schemas/drizzle.schema'

// Drizzle only. The `user_contacts` queries still on TypeORM live in
// `./userContacts.typeorm` - the ones that take or return the entity, and the ones that join
// a caller's TypeORM transaction. The life of a row is described there.
//
// Wherever TypeORM read `user_contacts` as its main table it added `deleted_at IS NULL` on
// its own (the entity has a `@DeleteDateColumn`); Drizzle adds nothing, so the reads below
// spell that condition out. TypeORM's delete query builder never added it, so the deletes
// below do not either.

/**
 * Every address this member has CONFIRMED, oldest first. A pending change is left out on
 * purpose: an address that was merely typed in must not answer anything on the member's
 * behalf - not even whether it ever bought something.
 */
export async function dbFindConfirmedUserContactEmails(userId: number): Promise<string[]> {
  const rows = await drizzleDb()
    .select({ email: userContactsTable.email })
    .from(userContactsTable)
    .where(
      and(
        eq(userContactsTable.userId, userId),
        eq(userContactsTable.emailChecked, true),
        isNull(userContactsTable.deletedAt),
      ),
    )
    .orderBy(asc(userContactsTable.createdAt))
  return rows.map((row) => row.email)
}

/**
 * The members who hold an address containing this text - under ANY of their rows, current,
 * earlier or pending - each id once. This is how the admin search finds somebody by the
 * address the GDT server still knows them by. Not a join: `User.userContacts` has no
 * usable join column (its inverse side is the `email_id` relation), so the ids are looked
 * up here and handed to the user query.
 *
 * `%` and `_` in the text act as wildcards, as they did in TypeORM's `Like`.
 */
export async function dbFindUserIdsByEmailLike(searchCriteria: string): Promise<number[]> {
  const rows = await drizzleDb()
    .select({ userId: userContactsTable.userId })
    .from(userContactsTable)
    .where(
      and(
        like(userContactsTable.email, `%${searchCriteria}%`),
        isNull(userContactsTable.deletedAt),
      ),
    )
  return [...new Set(rows.map((row) => row.userId))]
}

/**
 * Remove the pending changes that ran past their window, so the addresses they hold are
 * free again - for one address, or for everybody when none is given. The window is
 * counted from the last time a code went out, which is `updated_at` once the row was
 * touched and `created_at` before. Hard delete, see the file comment in
 * `./userContacts.typeorm`. Returns how many rows went.
 *
 * `olderThan` goes to the driver as it is, not through the column's mapping: Drizzle
 * would write a `datetime` column's value as UTC, mysql2 writes a bare Date in the
 * connection's time zone - which is what the TypeORM version sent.
 */
export async function dbPurgeExpiredEmailChanges(olderThan: Date, email?: string): Promise<number> {
  const result = await drizzleDb()
    .delete(userContactsTable)
    .where(
      and(
        eq(userContactsTable.emailOptInTypeId, OptInType.EMAIL_OPT_IN_CHANGE),
        // Only fresh rows. A take-back is one of the member's own confirmed addresses and is
        // never deleted; it is restored by the paths that know whose it is.
        eq(userContactsTable.emailChecked, false),
        sql`COALESCE(${userContactsTable.updatedAt}, ${userContactsTable.createdAt}) < ${olderThan}`,
        email ? eq(userContactsTable.email, email) : undefined,
      ),
    )
  return result[0]?.affectedRows ?? 0
}

/**
 * Give up every never-confirmed change that is holding this address - however young.
 *
 * ⛔ This is NOT the same question as `dbPurgeExpiredEmailChanges`, and the difference is
 * the whole point. That one tidies away claims that ran out of time. This one settles a
 * conflict between two claims on the SAME address: a pending change is somebody who TYPED
 * the address in, a registration is somebody who is about to be sent mail at it and has to
 * answer it. The typed claim yields.
 *
 * Without that, the typed claim wins - silently, and for as long as it is renewed. It kept
 * the address from whoever actually holds the mailbox, and it closed the Elopage webhook for
 * a paying buyer whose address a stranger had once typed into a change form.
 *
 * A CONFIRMED row is never touched: that address is proven, and it stays its owner's - which
 * is also why a take-back (a member's own earlier address, borrowed) survives this.
 */
export async function dbReleaseUnconfirmedEmailChangeFor(email: string): Promise<number> {
  const result = await drizzleDb()
    .delete(userContactsTable)
    .where(
      and(
        eq(userContactsTable.emailOptInTypeId, OptInType.EMAIL_OPT_IN_CHANGE),
        eq(userContactsTable.emailChecked, false),
        eq(userContactsTable.email, email),
      ),
    )
  return result[0]?.affectedRows ?? 0
}
