// AI-GENERATED — not an architecture reference
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  ThankYouCardInsert,
  ThankYouCardSelect,
  thankYouCardsTable,
} from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const CardNotFound = (where: string) => new DBNotFoundError('thank_you_cards', where)
const CardInsertFailed = (row: ThankYouCardInsert) =>
  new DBInsertFailed<ThankYouCardInsert>('thank_you_cards', row)

/** Three wrong PINs and the card is dead until its owner unblocks it in their own wallet. */
export const MAX_FAILED_ATTEMPTS = 3

export async function dbInsertThankYouCard(
  row: ThankYouCardInsert,
): Promise<VoidResult<DBInsertFailed<ThankYouCardInsert>>> {
  const result = await drizzleDb().insert(thankYouCardsTable).values(row)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: CardInsertFailed(row) }
}

/**
 * One card by its printed code, deliberately NOT scoped to an owner and NOT filtered by
 * `blockedAt`.
 *
 * Both omissions are on purpose. The caller is the payment path, and it has to tell three
 * answers apart that a narrower query would fold into one silent "nothing found": there
 * is no such card, the card is blocked, the card is fine. Only the first of those may
 * look like a typo in the URL; the second has to be said out loud, because a merchant
 * standing at the counter needs to know to stop trying.
 */
export async function dbSelectThankYouCardByCode(
  code: string,
): Promise<Result<ThankYouCardSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(thankYouCardsTable)
    .where(eq(thankYouCardsTable.code, code))

  const row = rows.at(0)
  if (!row) {
    return { success: false, error: CardNotFound(`code=${code}`) }
  }
  return { success: true, value: row }
}

/**
 * One card by its id. The payment path reads the card through its request rather than
 * through a code the caller sent again, so that a swapped code cannot pay from a
 * different card than the one that was scanned.
 */
export async function dbSelectThankYouCardById(
  id: number,
): Promise<Result<ThankYouCardSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(thankYouCardsTable)
    .where(eq(thankYouCardsTable.id, id))

  const row = rows.at(0)
  if (!row) {
    return { success: false, error: CardNotFound(`id=${id}`) }
  }
  return { success: true, value: row }
}

/** Every card a member ever had, oldest first — the blocked ones included, on purpose. */
export async function dbSelectThankYouCardsByUserId(userId: number): Promise<ThankYouCardSelect[]> {
  return drizzleDb()
    .select()
    .from(thankYouCardsTable)
    .where(eq(thankYouCardsTable.userId, userId))
    .orderBy(asc(thankYouCardsTable.id))
}

/** The one card a member can currently pay with, if there is one. */
export async function dbSelectActiveThankYouCard(
  userId: number,
): Promise<Result<ThankYouCardSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(thankYouCardsTable)
    .where(and(eq(thankYouCardsTable.userId, userId), isNull(thankYouCardsTable.blockedAt)))
    .orderBy(asc(thankYouCardsTable.id))

  const row = rows.at(0)
  if (!row) {
    return { success: false, error: CardNotFound(`userId=${userId} and not blocked`) }
  }
  return { success: true, value: row }
}

/**
 * Block a card. Written as a conditional update so that blocking an already blocked card
 * does not move `blockedAt` forward — the moment a card died is worth keeping.
 */
export async function dbBlockThankYouCard(
  cardId: number,
  blockedAt: Date,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(thankYouCardsTable)
    .set({ blockedAt })
    .where(and(eq(thankYouCardsTable.id, cardId), isNull(thankYouCardsTable.blockedAt)))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows > 0) {
    return { success: true }
  }
  return { success: false, error: CardNotFound(`id=${cardId} and not already blocked`) }
}

/** Unblocking is the owner's own act, in their own wallet. It also clears the counter. */
export async function dbUnblockThankYouCard(cardId: number): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(thankYouCardsTable)
    .set({ blockedAt: null, failedAttempts: 0 })
    .where(eq(thankYouCardsTable.id, cardId))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows > 0) {
    return { success: true }
  }
  return { success: false, error: CardNotFound(`id=${cardId}`) }
}

/**
 * Count one wrong PIN and report the new total, so the caller can block at the limit
 * without reading the row again.
 *
 * The increment is done by the database (`failed_attempts + 1`), not by reading and
 * writing back: two counters racing each other would otherwise both write the same
 * value, and the third attempt would never be the third.
 */
export async function dbIncrementFailedAttempts(
  cardId: number,
): Promise<Result<number, DBNotFoundError>> {
  const result = await drizzleDb()
    .update(thankYouCardsTable)
    .set({ failedAttempts: sql`${thankYouCardsTable.failedAttempts} + 1` })
    .where(eq(thankYouCardsTable.id, cardId))

  const firstRow = result[0]
  if (!firstRow || firstRow.affectedRows === 0) {
    return { success: false, error: CardNotFound(`id=${cardId}`) }
  }

  const rows = await drizzleDb()
    .select({ failedAttempts: thankYouCardsTable.failedAttempts })
    .from(thankYouCardsTable)
    .where(eq(thankYouCardsTable.id, cardId))

  const row = rows.at(0)
  if (!row) {
    return { success: false, error: CardNotFound(`id=${cardId}`) }
  }
  return { success: true, value: row.failedAttempts }
}

/** A correct PIN wipes the slate. */
export async function dbResetFailedAttempts(cardId: number): Promise<VoidResult> {
  await drizzleDb()
    .update(thankYouCardsTable)
    .set({ failedAttempts: 0 })
    .where(eq(thankYouCardsTable.id, cardId))
  return { success: true }
}
