// AI-GENERATED — not an architecture reference
import { count, eq, gte, inArray } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { transactionReactionsTable, transactionsTable } from '../schemas/drizzle.schema'
import { countFields, countsOfRow, rowsFrom, WeeklyCount, weekStartOf } from './figureCounts'

/**
 * The reaction to a transfer, set or replaced (migration 0159): one row a transfer, hung on the
 * recipient's RECEIVE booking. Where the transfer has a reaction already, the unique key catches
 * the second row and the emoji of the first is changed.
 *
 * ⛔ Whether the caller is that transfer's recipient is not asked here: whoever calls this has
 * read the booking as the member's own RECEIVE row first (dbSelectReceivedTransferOfUser). A
 * booking is history -- whose it is and what kind it is never change between that read and
 * this write.
 */
export async function dbUpsertTransactionReaction(
  transactionId: number,
  emoji: string,
): Promise<void> {
  await drizzleDb()
    .insert(transactionReactionsTable)
    .values({ transactionId, emoji })
    .onDuplicateKeyUpdate({ set: { emoji } })
}

/**
 * Takes the reaction to a transfer back and says whether there was one. None is an answer, not
 * a failure. For the recipient's RECEIVE booking, as dbUpsertTransactionReaction.
 */
export async function dbDeleteTransactionReaction(transactionId: number): Promise<boolean> {
  const result = await drizzleDb()
    .delete(transactionReactionsTable)
    .where(eq(transactionReactionsTable.transactionId, transactionId))
  return (result[0]?.affectedRows ?? 0) > 0
}

/**
 * A reaction as a booking list reads it: the RECEIVE booking it hangs on, the emoji, and the
 * booking that one names as its other half -- the sender's SEND row.
 */
export interface TransactionReactionOfBooking {
  transactionId: number
  emoji: string
  linkedTransactionId: number | null
}

/**
 * The reactions that hang on these bookings, in one query for a whole page. A booking without a
 * reaction has no row.
 *
 * `linkedTransactionId` comes from the booking the reaction hangs on, not from the caller: a
 * sender is shown a reaction only where that RECEIVE row names the sender's own row back
 * (reactionOfBooking in the backend) -- a number on the sender's row alone proves nothing:
 * only two rows that name each other are one transfer.
 *
 * ⛔ Not asked for a member: which ids a member may ask with is settled where the page is built
 * -- the member's own RECEIVE rows, and what their own SEND rows name.
 */
export async function dbSelectTransactionReactions(
  transactionIds: number[],
): Promise<TransactionReactionOfBooking[]> {
  if (transactionIds.length === 0) {
    return []
  }
  return drizzleDb()
    .select({
      transactionId: transactionReactionsTable.transactionId,
      emoji: transactionReactionsTable.emoji,
      linkedTransactionId: transactionsTable.linkedTransactionId,
    })
    .from(transactionReactionsTable)
    .innerJoin(transactionsTable, eq(transactionsTable.id, transactionReactionsTable.transactionId))
    .where(inArray(transactionReactionsTable.transactionId, transactionIds))
}

/**
 * How many transfers their recipient answered with a reaction, from each moment on by the moment
 * it was first set -- one statement, one number per moment (the figures of the admin's start
 * page, figureCounts.ts). Another emoji in the place of the first keeps the row and its moment
 * (dbUpsertTransactionReaction); a reaction taken back is gone (dbDeleteTransactionReaction).
 */
export async function dbCountTransactionReactions(froms: (Date | null)[]): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, rowsFrom(transactionReactionsTable.createdAt)))
    .from(transactionReactionsTable)
  return countsOfRow(row, froms)
}

/** dbCountTransactionReactions by calendar week: in each week from `from` on. */
export async function dbCountTransactionReactionsByWeek(from: Date): Promise<WeeklyCount[]> {
  const week = weekStartOf(transactionReactionsTable.createdAt)
  return drizzleDb()
    .select({ weekStart: week, n: count() })
    .from(transactionReactionsTable)
    .where(gte(transactionReactionsTable.createdAt, from))
    .groupBy(week)
    .orderBy(week)
}
