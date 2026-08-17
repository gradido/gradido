// AI-GENERATED — not an architecture reference
import { and, eq, gte, sql } from 'drizzle-orm'
import { GradidoUnit, Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  ThankYouCardPaymentInsert,
  ThankYouCardPaymentSelect,
  thankYouCardPaymentsTable,
  thankYouCardsTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const PaymentNotFound = (where: string) => new DBNotFoundError('thank_you_card_payments', where)
const PaymentInsertFailed = (row: ThankYouCardPaymentInsert) =>
  new DBInsertFailed<ThankYouCardPaymentInsert>('thank_you_card_payments', row)

export const PAYMENT_STATE_OPEN = 'open'
export const PAYMENT_STATE_CONSUMED = 'consumed'

/**
 * The request the merchant creates by entering an amount. It is deliberately its own
 * thing rather than an argument to the confirming call: today the PIN confirms it, and
 * later a tap on the payer's own device is meant to confirm the same row without the
 * booking path changing at all.
 */
export async function dbInsertThankYouCardPayment(
  row: ThankYouCardPaymentInsert,
): Promise<Result<number, DBInsertFailed<ThankYouCardPaymentInsert>>> {
  const result = await drizzleDb().insert(thankYouCardPaymentsTable).values(row)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: firstRow.insertId }
  }
  return { success: false, error: PaymentInsertFailed(row) }
}

export async function dbSelectThankYouCardPayment(
  id: number,
): Promise<Result<ThankYouCardPaymentSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(thankYouCardPaymentsTable)
    .where(eq(thankYouCardPaymentsTable.id, id))

  const row = rows.at(0)
  if (!row) {
    return { success: false, error: PaymentNotFound(`id=${id}`) }
  }
  return { success: true, value: row }
}

/**
 * The request a PIN may still be checked against: open, and not yet run out.
 *
 * ⛔ Deliberately separate from `dbSelectThankYouCardPayment`. That one answers "does this
 * row exist", and the confirming path must not decide on that: for a request that was
 * already paid or has expired, NOTHING below may run — least of all counting a failed PIN
 * attempt against the card. Otherwise a merchant who was once paid by a card can replay
 * their own old request with wrong PINs and block that card for good, which turns the
 * three-attempt protection into a weapon against the very account it protects.
 */
export async function dbSelectOpenThankYouCardPayment(
  id: number,
  now: Date,
): Promise<Result<ThankYouCardPaymentSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(thankYouCardPaymentsTable)
    .where(
      and(
        eq(thankYouCardPaymentsTable.id, id),
        eq(thankYouCardPaymentsTable.state, PAYMENT_STATE_OPEN),
        gte(thankYouCardPaymentsTable.validUntil, now),
      ),
    )

  const row = rows.at(0)
  if (!row) {
    return {
      success: false,
      error: PaymentNotFound(`id=${id} and state=${PAYMENT_STATE_OPEN} and not expired`),
    }
  }
  return { success: true, value: row }
}

/**
 * Take the request off the table, and say whether this call was the one that got it.
 *
 * ⚠️ This is where the protection against a double booking sits, so it has to be ONE
 * conditional statement. Reading the state and writing it back in two steps would leave a
 * gap in which a second call reads the same 'open'; the `and(... state = open)` makes the
 * database decide, and `affectedRows` reports who won.
 *
 * ⚠️ The caller must run this BEFORE the money moves. A TypeORM transaction does not
 * cover Drizzle writes, so consuming and booking cannot be made atomic — and of the two
 * possible half-finished states, "request used, no money moved" is the harmless one.
 */
export async function dbConsumeThankYouCardPayment(
  id: number,
  now: Date,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(thankYouCardPaymentsTable)
    .set({ state: PAYMENT_STATE_CONSUMED })
    .where(
      and(
        eq(thankYouCardPaymentsTable.id, id),
        eq(thankYouCardPaymentsTable.state, PAYMENT_STATE_OPEN),
        gte(thankYouCardPaymentsTable.validUntil, now),
      ),
    )

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: PaymentNotFound(`id=${id} and state=${PAYMENT_STATE_OPEN} and not expired`),
  }
}

/**
 * What this card has already spent since `since`, for the daily limit.
 *
 * Counted from the consumed requests rather than from the transactions, for one reason:
 * the limit belongs to the card, and a transaction does not know which card it came from.
 * ⚠️ That also means a request that was consumed while its booking failed still counts
 * against the day. That is the safe direction — it can only ever let somebody spend less
 * than their limit, never more.
 */
export async function dbSumConsumedThankYouCardPayments(
  cardId: number,
  since: Date,
): Promise<GradidoUnit> {
  const rows = await drizzleDb()
    .select({ amount: thankYouCardPaymentsTable.amount })
    .from(thankYouCardPaymentsTable)
    .where(
      and(
        eq(thankYouCardPaymentsTable.cardId, cardId),
        eq(thankYouCardPaymentsTable.state, PAYMENT_STATE_CONSUMED),
        gte(thankYouCardPaymentsTable.createdAt, since),
      ),
    )

  return rows.reduce((sum, row) => sum.add(row.amount), GradidoUnit.fromNumber(0))
}

/**
 * Every open request of one member's cards. The wallet uses it for nothing yet; the
 * device-confirmation path (PS-022) is what it is here for.
 *
 * ★ A query belongs to the table it selects `from`, so this lives here even though it
 * joins the cards table to get from a member to their cards.
 */
export async function dbSelectOpenPaymentsByUserId(
  userId: number,
  now: Date,
): Promise<ThankYouCardPaymentSelect[]> {
  const rows = await drizzleDb()
    .select({ payment: thankYouCardPaymentsTable })
    .from(thankYouCardPaymentsTable)
    .innerJoin(thankYouCardsTable, eq(thankYouCardPaymentsTable.cardId, thankYouCardsTable.id))
    .where(
      and(
        eq(thankYouCardsTable.userId, userId),
        eq(thankYouCardPaymentsTable.state, PAYMENT_STATE_OPEN),
        gte(thankYouCardPaymentsTable.validUntil, now),
      ),
    )

  return rows.map((row) => row.payment)
}

/**
 * Housekeeping for requests nobody ever confirmed. Not wired to anything yet — an expired
 * open request is harmless, it simply stops working.
 */
export async function dbCountExpiredOpenPayments(now: Date): Promise<number> {
  const rows = await drizzleDb()
    .select({ count: sql<number>`count(*)` })
    .from(thankYouCardPaymentsTable)
    .where(
      and(
        eq(thankYouCardPaymentsTable.state, PAYMENT_STATE_OPEN),
        sql`${thankYouCardPaymentsTable.validUntil} < ${now}`,
      ),
    )

  return Number(rows.at(0)?.count ?? 0)
}
