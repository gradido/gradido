// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import {
  DBDuplicateEntryError,
  DBInsertFailed,
  DBNotFoundError,
  isDuplicateEntry,
} from '../errorTypes'
import {
  ThankYouGreetingInsert,
  ThankYouGreetingSelect,
  thankYouGreetingsTable,
  transactionLinksTable,
} from '../schemas/drizzle.schema'

/** A greeting's row without the name: what an error about the row carries. */
export type ThankYouGreetingInsertWithoutName = Omit<ThankYouGreetingInsert, 'recipientName'>

// An error is what ends up in a log, and the name one member wrote about somebody else must
// not: the row goes into the error without it.
const ThankYouGreetingInsertFailed = ({
  recipientName: _recipientName,
  ...row
}: ThankYouGreetingInsert) =>
  new DBInsertFailed<ThankYouGreetingInsertWithoutName>('thank_you_greetings', row)
const ThankYouGreetingDuplicate = (transactionLinkCode: string) =>
  new DBDuplicateEntryError('thank_you_greetings', 'transaction_link_code', transactionLinkCode)
const ThankYouGreetingNotFound = (transactionLinkCode: string) =>
  new DBNotFoundError('thank_you_greetings', `transaction_link_code = ${transactionLinkCode}`)

/**
 * Files the greeting of a transaction link. A code that already has one comes back as
 * DBDuplicateEntryError: the unique key refuses the second row.
 *
 * ⛔ Written BEFORE the link it belongs to (createTransactionLink): a greeting whose link
 * could not be saved is taken back out with dbDeleteThankYouGreetingByLinkCode. In between
 * nobody reaches it -- every reader starts from a link.
 */
export async function dbInsertThankYouGreeting(
  row: ThankYouGreetingInsert,
): Promise<VoidResult<DBDuplicateEntryError | DBInsertFailed<ThankYouGreetingInsertWithoutName>>> {
  try {
    const result = await drizzleDb().insert(thankYouGreetingsTable).values(row)
    if (result[0]?.affectedRows === 1) {
      return { success: true }
    }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { success: false, error: ThankYouGreetingDuplicate(row.transactionLinkCode) }
    }
    throw error
  }
  return { success: false, error: ThankYouGreetingInsertFailed(row) }
}

/**
 * The greetings of these links, in no particular order; a link without one is simply not in
 * the answer. One statement for a whole page of links.
 *
 * An empty list asks the database nothing: `inArray` over no values would not be valid SQL.
 */
export async function dbSelectThankYouGreetingsByLinkCodes(
  transactionLinkCodes: string[],
): Promise<ThankYouGreetingSelect[]> {
  if (transactionLinkCodes.length === 0) {
    return []
  }
  return drizzleDb()
    .select()
    .from(thankYouGreetingsTable)
    .where(inArray(thankYouGreetingsTable.transactionLinkCode, transactionLinkCodes))
}

/** The greeting of a link, and whose link it is. */
export type ThankYouGreetingOfLink = {
  /** `transaction_links.user_id`: the member who made the link, and wrote the greeting. */
  linkUserId: number
  greeting: ThankYouGreetingSelect
}

/**
 * The greetings of these links, as a map from the link's id to its greeting; a link without
 * one is simply not in the map. One statement for a whole page of bookings.
 *
 * Written for the booking list: a booking made from a link carries the link's id
 * (`transactions.transaction_link_id`), while the greeting hangs on the link's code. So the
 * two tables are joined on the code and narrowed to the ids -- the answer is keyed by what the
 * caller holds, and the code never has to travel through the resolver.
 *
 * ⛔ With each greeting comes the member who made its link, and the answer is not complete
 * without that: the id on a booking's row does not prove the greeting is that booking's. A
 * greeting is shown with a booking only where the link's maker is the booking's sender --
 * the caller's rule (backend/src/data/Transaction.logic.ts, greetingOfBooking), and the
 * reason this function does not hand out a greeting on its own.
 *
 * No condition on `deletedAt`: the list names links that were redeemed, and
 * deleteTransactionLink refuses a redeemed link.
 *
 * A plain Map rather than a Result, as dbSelectThankYouCardLabels beside the same list: an id
 * without a row is no failure, it is a booking without a greeting. An empty list asks the
 * database nothing.
 */
export async function dbSelectThankYouGreetingsByLinkIds(
  transactionLinkIds: number[],
): Promise<Map<number, ThankYouGreetingOfLink>> {
  if (transactionLinkIds.length === 0) {
    return new Map()
  }
  const rows = await drizzleDb()
    .select({
      transactionLinkId: transactionLinksTable.id,
      linkUserId: transactionLinksTable.userId,
      greeting: thankYouGreetingsTable,
    })
    .from(thankYouGreetingsTable)
    .innerJoin(
      transactionLinksTable,
      eq(transactionLinksTable.code, thankYouGreetingsTable.transactionLinkCode),
    )
    .where(inArray(transactionLinksTable.id, transactionLinkIds))

  return new Map(
    rows.map((row) => [
      row.transactionLinkId,
      { linkUserId: row.linkUserId, greeting: row.greeting },
    ]),
  )
}

/**
 * Takes the greeting of a link out. Not found IS an expected outcome here: a plain link has
 * none.
 */
export async function dbDeleteThankYouGreetingByLinkCode(
  transactionLinkCode: string,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .delete(thankYouGreetingsTable)
    .where(eq(thankYouGreetingsTable.transactionLinkCode, transactionLinkCode))
  if (result[0]?.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: ThankYouGreetingNotFound(transactionLinkCode) }
}
