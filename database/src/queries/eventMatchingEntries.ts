// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { VoidResult } from 'shared'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DBInsertFailed } from '../errorTypes'
import {
  EventMatchingEntryInsert,
  EventMatchingEntrySelect,
  eventMatchingEntriesTable,
} from '../schemas/drizzle.schema'

const EventMatchingEntryInsertFailed = (row: EventMatchingEntryInsert) =>
  new DBInsertFailed<EventMatchingEntryInsert>('event_matching_entries', row)

/**
 * Notes the entry an event link offered at an account (migration 0160). It waits there until
 * the address is confirmed.
 *
 * With `tx`, in the caller's transaction: the registration notes it with the account it opens,
 * so there is never an account without the entry it registered with, nor an entry noted for an
 * account that was not opened.
 *
 * One row an account. A second one for the same account is refused by the unique key and
 * thrown as Drizzle reports it -- with the row's values, the words of the entry, in its
 * message, so a caller hands on its driver code and not the error. Only the registration that
 * opens an account notes an entry, so a second one is a caller's mistake and not something to
 * answer.
 */
export async function dbInsertEventMatchingEntry(
  row: EventMatchingEntryInsert,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<VoidResult<DBInsertFailed<EventMatchingEntryInsert>>> {
  const result = await (tx ?? drizzleDb()).insert(eventMatchingEntriesTable).values(row)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: EventMatchingEntryInsertFailed(row) }
}

/**
 * Whether an entry waits at this account. Asked over the pool, outside any transaction: nearly
 * every confirmation has nothing noted, and for it this one read is all there is.
 */
export async function dbHasEventMatchingEntry(userId: number): Promise<boolean> {
  const rows = await drizzleDb()
    .select({ id: eventMatchingEntriesTable.id })
    .from(eventMatchingEntriesTable)
    .where(eq(eventMatchingEntriesTable.userId, userId))
    .limit(1)
  return rows.length > 0
}

/**
 * Takes the entry that waits at this account, to make it: hands it over and removes the note.
 * Nothing is handed over where none waits -- no event link, or another confirmation took it.
 *
 * ⛔ Only in a transaction, and the entry is made in the same one. That the note is gone is
 * what keeps a second confirmation from making a second entry; gone without the entry, the
 * entry would be lost. Together they happen or do not: where making the entry fails, the note
 * is back with the transaction.
 *
 * ⛔ The FIRST statement of its transaction, and a locking read. Of two confirmations at the
 * same moment the second waits here for the row the first holds, and then finds none. A plain
 * read before it would fix the transaction's view of the table: MariaDB from 11.6.2 on
 * (`innodb_snapshot_isolation`, on by default there) then refuses the delete of a row that
 * changed after that view with an error, where older versions find no row.
 */
export async function dbTakeEventMatchingEntry(
  userId: number,
  tx: DrizzleTransaction,
): Promise<EventMatchingEntrySelect | undefined> {
  const rows = await tx
    .select()
    .from(eventMatchingEntriesTable)
    .where(eq(eventMatchingEntriesTable.userId, userId))
    .for('update')
  const noted = rows.at(0)
  if (!noted) {
    return undefined
  }
  await tx.delete(eventMatchingEntriesTable).where(eq(eventMatchingEntriesTable.id, noted.id))
  return noted
}
