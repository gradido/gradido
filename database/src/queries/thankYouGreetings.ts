// AI-GENERATED — not an architecture reference
import { and, count, eq, exists, gte, inArray, isNotNull, isNull, lt, SQL, sql } from 'drizzle-orm'
import { VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { EventType } from '../enum/EventType'
import {
  DBDuplicateEntryError,
  DBInsertFailed,
  DBNotFoundError,
  isDuplicateEntry,
} from '../errorTypes'
import {
  eventsTable,
  ThankYouGreetingInsert,
  ThankYouGreetingSelect,
  thankYouGreetingPicturesTable,
  thankYouGreetingsTable,
  transactionLinksTable,
} from '../schemas/drizzle.schema'
import {
  countFields,
  countsOfRow,
  rowsFrom,
  rowsFromWhere,
  WeeklyCount,
  weekStartOf,
} from './figureCounts'

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

// The figures of the admin's start page (CommunityFiguresResolver): sums, never who. How a count
// answers for several moments at once: figureCounts.ts. A greeting is a link with a greeting row,
// so the counts start from the greetings; a plain link has none and is never counted here. A
// greeting goes with its link when the link is deleted (removeThankYouGreeting): the counts of
// the moments before shrink then -- whoever deletes a link has taken it back.

/** The link of a greeting: the greeting hangs on its code. */
const linkOfGreeting = eq(transactionLinksTable.code, thankYouGreetingsTable.transactionLinkCode)

/**
 * The greeting carries a photo of the sender's own: its picture is filed under the link's code,
 * as two renditions -- counted once. The small one stays after the thank-you is accepted.
 */
const withOwnPicture = (): SQL =>
  exists(
    drizzleDb()
      .select({ id: thankYouGreetingPicturesTable.id })
      .from(thankYouGreetingPicturesTable)
      .where(
        eq(
          thankYouGreetingPicturesTable.transactionLinkCode,
          thankYouGreetingsTable.transactionLinkCode,
        ),
      ),
  )

/**
 * How many thank-you greetings were sent, and of them how many with a photo of the sender's own,
 * from each moment on by the moment the greeting was filed (`created_at`) -- both in one
 * statement, one number per moment. A greeting duplicated from another is a new link with a new
 * row, and counts again.
 */
export async function dbCountThankYouGreetings(
  froms: (Date | null)[],
): Promise<{ sent: number[]; withPicture: number[] }> {
  const [row] = await drizzleDb()
    .select({
      sent: countFields(froms, rowsFrom(thankYouGreetingsTable.createdAt)),
      withPicture: countFields(
        froms,
        rowsFromWhere(thankYouGreetingsTable.createdAt, withOwnPicture()),
      ),
    })
    .from(thankYouGreetingsTable)
  return { sent: countsOfRow(row?.sent, froms), withPicture: countsOfRow(row?.withPicture, froms) }
}

/** dbCountThankYouGreetings by calendar week: in each week from `from` on, in one statement. */
export async function dbCountThankYouGreetingsByWeek(
  from: Date,
): Promise<(WeeklyCount & { withPicture: number })[]> {
  const week = weekStartOf(thankYouGreetingsTable.createdAt)
  return drizzleDb()
    .select({
      weekStart: week,
      n: count(),
      withPicture: count(sql`case when ${withOwnPicture()} then 1 end`),
    })
    .from(thankYouGreetingsTable)
    .where(gte(thankYouGreetingsTable.createdAt, from))
    .groupBy(week)
    .orderBy(week)
}

/** A greeting accepted: its link redeemed -- here, or across the border by a member from afar. */
const accepted = isNotNull(transactionLinksTable.redeemedAt)

/**
 * The account that accepted the greeting was opened through this very link: its registration
 * names the link (`USER_REGISTER_REDEEM`, RegisterUserFromTransactionLinkRole). Never across the
 * border -- a member from afar registered in their own community -- and never an account that
 * was there before, nor one registered through the link that did not accept it.
 */
const byAccountOpenedThroughIt = (): SQL =>
  exists(
    drizzleDb()
      .select({ id: eventsTable.id })
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.type, EventType.USER_REGISTER_REDEEM),
          eq(eventsTable.affectedUserId, transactionLinksTable.redeemedBy),
          eq(eventsTable.involvedTransactionLinkId, transactionLinksTable.id),
        ),
      ),
  )

/**
 * How many thank-you greetings were accepted, and of them how many by an account opened through
 * the greeting itself, from each moment on by the moment the link was redeemed (`redeemed_at`) --
 * both in one statement, one number per moment, so that the second is always part of the first.
 */
export async function dbCountAcceptedThankYouGreetings(
  froms: (Date | null)[],
): Promise<{ accepted: number[]; withNewAccount: number[] }> {
  const [row] = await drizzleDb()
    .select({
      accepted: countFields(froms, rowsFrom(transactionLinksTable.redeemedAt)),
      withNewAccount: countFields(
        froms,
        rowsFromWhere(transactionLinksTable.redeemedAt, byAccountOpenedThroughIt()),
      ),
    })
    .from(thankYouGreetingsTable)
    .innerJoin(transactionLinksTable, linkOfGreeting)
    .where(accepted)
  return {
    accepted: countsOfRow(row?.accepted, froms),
    withNewAccount: countsOfRow(row?.withNewAccount, froms),
  }
}

/** dbCountAcceptedThankYouGreetings by calendar week: in each week from `from` on. */
export async function dbCountAcceptedThankYouGreetingsByWeek(
  from: Date,
): Promise<(WeeklyCount & { withNewAccount: number })[]> {
  const week = weekStartOf(transactionLinksTable.redeemedAt)
  return drizzleDb()
    .select({
      weekStart: week,
      n: count(),
      withNewAccount: count(sql`case when ${byAccountOpenedThroughIt()} then 1 end`),
    })
    .from(thankYouGreetingsTable)
    .innerJoin(transactionLinksTable, linkOfGreeting)
    .where(and(accepted, gte(transactionLinksTable.redeemedAt, from)))
    .groupBy(week)
    .orderBy(week)
}

/**
 * A greeting nobody accepted in time: its link neither redeemed nor deleted (a deleted link was
 * taken back, not missed), and valid until a moment before `now`.
 */
const expiredBy = (now: Date) =>
  and(
    isNull(transactionLinksTable.redeemedAt),
    isNull(transactionLinksTable.deletedAt),
    lt(transactionLinksTable.validUntil, now),
  )

/**
 * How many thank-you greetings expired, from each moment on by the moment their validity ran out
 * (`valid_until`) and up to `now` -- one statement, one number per moment. From the chosen day on
 * are the greetings whose time ran out since that day; all of it, every one that ran out.
 */
export async function dbCountExpiredThankYouGreetings(
  froms: (Date | null)[],
  now: Date,
): Promise<number[]> {
  const [row] = await drizzleDb()
    .select(countFields(froms, rowsFrom(transactionLinksTable.validUntil)))
    .from(thankYouGreetingsTable)
    .innerJoin(transactionLinksTable, linkOfGreeting)
    .where(expiredBy(now))
  return countsOfRow(row, froms)
}

/**
 * dbCountExpiredThankYouGreetings by calendar week: in the week their validity ran out, in each
 * week from `from` on -- the running week up to `now`.
 */
export async function dbCountExpiredThankYouGreetingsByWeek(
  from: Date,
  now: Date,
): Promise<WeeklyCount[]> {
  const week = weekStartOf(transactionLinksTable.validUntil)
  return drizzleDb()
    .select({ weekStart: week, n: count() })
    .from(thankYouGreetingsTable)
    .innerJoin(transactionLinksTable, linkOfGreeting)
    .where(and(expiredBy(now), gte(transactionLinksTable.validUntil, from)))
    .groupBy(week)
    .orderBy(week)
}
