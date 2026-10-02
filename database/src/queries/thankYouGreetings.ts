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
