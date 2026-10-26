// AI-GENERATED — not an architecture reference
import { and, eq, gt, isNotNull, lte, notExists, sql } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { TransactionTypeId } from '../enum'
import { transactionReadsStartTable, transactionReadsTable, transactionsTable } from '../schemas'
import { ChatMemberRef } from './chatConversationMembers'

/**
 * Where the counting of unread transfers begins on this server (migration 0165, Chat E-086): the
 * highest booking id when the migration ran. Every transfer received up to it counts as seen.
 * 0 where the row is missing, which no migrated database has.
 */
export async function dbSelectTransactionReadsStart(): Promise<number> {
  const rows = await drizzleDb()
    .select({ transactionId: transactionReadsStartTable.transactionId })
    .from(transactionReadsStartTable)
    .where(eq(transactionReadsStartTable.id, 1))
    .limit(1)
  return rows[0]?.transactionId ?? 0
}

/** Transfers from one person the member has not seen yet. */
export interface UnreadReceivedTransfers {
  /** Whoever sent them, by the pair their bookings name them by. */
  communityUuid: string
  gradidoId: string
  /** How many of their transfers the member has not seen. */
  count: number
  /** The newest of them, by its id: the member's RECEIVE booking. */
  latestId: number
}

/** The member's own RECEIVE bookings of transfers, above `afterId`, that nobody marked seen. */
const unseenReceivedBy = (userId: number, afterId: number) =>
  and(
    eq(transactionsTable.userId, userId),
    eq(transactionsTable.typeId, TransactionTypeId.RECEIVE),
    gt(transactionsTable.id, afterId),
    notExists(
      drizzleDb()
        .select({ one: sql`1` })
        .from(transactionReadsTable)
        .where(sql`${transactionReadsTable.transactionId} = ${transactionsTable.id}`),
    ),
  )

/**
 * The transfers the member received and has not seen, per person who sent them (Chat E-086): the
 * gold dot at that person, the mark in the menu -- and the chat's beat asks it, every fifteen
 * seconds while a wallet is open.
 *
 * Only above `afterId` -- the start of the counting (dbSelectTransactionReadsStart): one range of
 * the index on `user_id`, whose entries InnoDB orders by the primary key as well, so the read
 * begins at the start and not at the member's first booking. Bookings without the pair of whoever
 * sent them have no person to stand at, and are left out.
 *
 * The pair as the bookings spell it: one person spelled two ways -- the uuids are compared without
 * regard to case everywhere else -- comes as two entries, for the caller to take together.
 */
export async function dbSelectUnreadReceivedTransfers(
  userId: number,
  afterId: number,
): Promise<UnreadReceivedTransfers[]> {
  const rows = await drizzleDb()
    .select({
      communityUuid: transactionsTable.linkedUserCommunityUuid,
      gradidoId: transactionsTable.linkedUserGradidoId,
      count: sql`count(*)`.mapWith(Number),
      latestId: sql`max(${transactionsTable.id})`.mapWith(Number),
    })
    .from(transactionsTable)
    .where(
      and(
        unseenReceivedBy(userId, afterId),
        isNotNull(transactionsTable.linkedUserCommunityUuid),
        isNotNull(transactionsTable.linkedUserGradidoId),
      ),
    )
    .groupBy(transactionsTable.linkedUserCommunityUuid, transactionsTable.linkedUserGradidoId)
  return rows.flatMap((row) =>
    row.communityUuid && row.gradidoId
      ? [
          {
            communityUuid: row.communityUuid,
            gradidoId: row.gradidoId,
            count: row.count,
            latestId: row.latestId,
          },
        ]
      : [],
  )
}

/**
 * Marks as seen the transfers the member received from `partner` up to `upToId` and above
 * `afterId` -- what their conversation showed (Chat E-086): the thread hands the newest transfer
 * it showed, and the older ones were shown above it. Answers how many were marked now; marked
 * before is no failure, it stays as it was.
 *
 * Only the member's own RECEIVE bookings from that person are taken: an id of anything else marks
 * nothing. The pair is compared by the column's own rule, as a parameter takes it.
 */
export async function dbMarkReceivedTransfersSeen(
  userId: number,
  partner: ChatMemberRef,
  upToId: number,
  afterId: number,
): Promise<number> {
  // `created_at` takes its default: the select names the one column it fills.
  const result = await drizzleDb()
    .insert(transactionReadsTable)
    .ignore()
    .select(
      drizzleDb()
        .select({ transactionId: transactionsTable.id })
        .from(transactionsTable)
        .where(
          and(
            unseenReceivedBy(userId, afterId),
            lte(transactionsTable.id, upToId),
            eq(transactionsTable.linkedUserCommunityUuid, partner.communityUuid),
            eq(transactionsTable.linkedUserGradidoId, partner.gradidoId),
          ),
        ),
    )
  return result[0]?.affectedRows ?? 0
}

/**
 * Marks one transfer the member received as seen: they opened it in the booking list, or answered
 * it with a reaction (Chat E-086, Bernd: "nur wenn die Transaktion geöffnet wurde oder in anderer
 * Weise reagiert wurde"). Only that one -- an older transfer from the same person stays unread
 * until it is seen itself. False where the id is no RECEIVE booking of the member's; marked
 * before is true, and stays as it was.
 */
export async function dbMarkReceivedTransferSeen(
  userId: number,
  transactionId: number,
): Promise<boolean> {
  const own = await drizzleDb()
    .select({ id: transactionsTable.id })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.id, transactionId),
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.typeId, TransactionTypeId.RECEIVE),
      ),
    )
    .limit(1)
  if (own.length === 0) {
    return false
  }
  await drizzleDb().insert(transactionReadsTable).ignore().values({ transactionId })
  return true
}
