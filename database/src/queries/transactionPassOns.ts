// AI-GENERATED — not an architecture reference
import { count, gte, inArray } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { TransactionPassOnSelect, transactionPassOnsTable } from '../schemas'
import { countFields, countsOfRow, rowsFrom, WeeklyCount, weekStartOf } from './figureCounts'

/**
 * Notes that a transfer passes a received thank-you on (migration 0166): `transactionId` is the
 * sender's SEND booking of the transfer, `originTransactionId` their own RECEIVE booking of the
 * thank-you passed on.
 *
 * ⛔ Whether the thank-you is the sender's own is not asked here: the caller has read it as the
 * member's own RECEIVE row first (dbSelectReceivedTransferOfUser). A booking is history -- whose
 * it is and what kind it is never change between that read and this write.
 */
export async function dbInsertTransactionPassOn(
  transactionId: number,
  originTransactionId: number,
): Promise<void> {
  await drizzleDb().insert(transactionPassOnsTable).values({ transactionId, originTransactionId })
}

/**
 * The thank-yous these transfers pass on, by the ids of their SEND bookings, in one query: a row
 * for each of them that passes one on, none for one that does not. No ids, no query.
 */
export async function dbSelectTransactionPassOnsOf(
  transactionIds: number[],
): Promise<TransactionPassOnSelect[]> {
  if (transactionIds.length === 0) {
    return []
  }
  return drizzleDb()
    .select()
    .from(transactionPassOnsTable)
    .where(inArray(transactionPassOnsTable.transactionId, transactionIds))
}

/**
 * How many transfers passed a received thank-you on, from each moment on by the moment the trail
 * was noted -- one statement, one number per moment (the figures of the admin's start page,
 * figureCounts.ts). A thank-you passed on twice counts twice: each transfer is a row. Only what
 * went through the buttons that pass a thank-you on, and only from the release that brought the
 * trail (migration 0166).
 */
export async function dbCountTransactionPassOns(froms: (Date | null)[]): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, rowsFrom(transactionPassOnsTable.createdAt)))
    .from(transactionPassOnsTable)
  return countsOfRow(row, froms)
}

/** dbCountTransactionPassOns by calendar week: in each week from `from` on. */
export async function dbCountTransactionPassOnsByWeek(from: Date): Promise<WeeklyCount[]> {
  const week = weekStartOf(transactionPassOnsTable.createdAt)
  return drizzleDb()
    .select({ weekStart: week, n: count() })
    .from(transactionPassOnsTable)
    .where(gte(transactionPassOnsTable.createdAt, from))
    .groupBy(week)
    .orderBy(week)
}
