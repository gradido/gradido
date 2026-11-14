// AI-GENERATED — not an architecture reference
import { and, asc, count, eq, inArray, ne, sql } from 'drizzle-orm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import {
  SupportTicketMessageInsert,
  SupportTicketMessageType,
  SupportTicketStatus,
  supportTicketMessagesTable,
  supportTicketsTable,
  usersTable,
} from '../schemas/drizzle.schema'

/**
 * A message of the thread as the member reads it, with what the member may be shown of its
 * author: the username, the initials the circle's colour comes from, and the pair that names a
 * member everywhere in the wallet. `authorId` is for the caller to look up the author's picture
 * date in one batch -- it is not for the member.
 */
export interface SupportTicketDialogMessage {
  id: number
  message: string
  createdAt: Date
  type: SupportTicketMessageType
  authorId: number
  authorAlias: string | null
  authorFirstName: string | null
  authorLastName: string | null
  authorGradidoId: string | null
  authorCommunityUuid: string | null
}

/** Files a message in a request's thread and answers its id. The time is the caller's. */
export async function dbInsertSupportTicketMessage(
  row: SupportTicketMessageInsert & { createdAt: Date },
  tx: DrizzleTransaction,
): Promise<number> {
  const [result] = await tx.insert(supportTicketMessagesTable).values(row)
  return result.insertId
}

/**
 * How many messages of a request's thread the member reads: the dialog, without the moderation's
 * notes -- a note reaches the member in no number either, also not in the limit of a thread.
 * Counted where the request is this member's; another member's request answers 0, as a missing
 * one does: how full somebody else's thread is is nobody's business.
 */
export async function dbCountSupportTicketDialogOfOwner(
  supportTicketId: number,
  ownerId: number,
  tx: DrizzleTransaction,
): Promise<number> {
  const [row] = await tx
    .select({ messages: count() })
    .from(supportTicketMessagesTable)
    .innerJoin(
      supportTicketsTable,
      and(
        eq(supportTicketsTable.id, supportTicketMessagesTable.supportTicketId),
        eq(supportTicketsTable.userId, ownerId),
      ),
    )
    .where(
      and(
        eq(supportTicketMessagesTable.supportTicketId, supportTicketId),
        eq(supportTicketMessagesTable.type, SupportTicketMessageType.DIALOG),
      ),
    )
  return row.messages
}

/**
 * The thread of a request as its owner reads it, the oldest message first: the DIALOG messages
 * and no other kind -- the moderation's internal notes are not the member's, and a kind added
 * later is not either until somebody says so here. Another member's request answers no message,
 * as a missing one does. One query, the authors with it.
 */
export async function dbSelectSupportTicketDialogOfOwner(
  supportTicketId: number,
  ownerId: number,
): Promise<SupportTicketDialogMessage[]> {
  return drizzleDb()
    .select({
      id: supportTicketMessagesTable.id,
      message: supportTicketMessagesTable.message,
      createdAt: supportTicketMessagesTable.createdAt,
      type: supportTicketMessagesTable.type,
      authorId: supportTicketMessagesTable.userId,
      authorAlias: usersTable.alias,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorGradidoId: usersTable.gradidoId,
      authorCommunityUuid: usersTable.communityUuid,
    })
    .from(supportTicketMessagesTable)
    .innerJoin(
      supportTicketsTable,
      and(
        eq(supportTicketsTable.id, supportTicketMessagesTable.supportTicketId),
        eq(supportTicketsTable.userId, ownerId),
      ),
    )
    .leftJoin(usersTable, eq(usersTable.id, supportTicketMessagesTable.userId))
    .where(
      and(
        eq(supportTicketMessagesTable.supportTicketId, supportTicketId),
        eq(supportTicketMessagesTable.type, SupportTicketMessageType.DIALOG),
        // a deleted request shows no thread, here as in the wallet
        ne(supportTicketsTable.status, SupportTicketStatus.DELETED),
      ),
    )
    .orderBy(asc(supportTicketMessagesTable.id))
}

/**
 * The newest DIALOG message of each of these requests, by its request: its kind and whether the
 * moderation wrote it -- what the details button of a row shows (who had the last word). The
 * notes are left out as an allow-list, like everywhere the member's side is concerned. One query
 * for the page; a request without a dialog message is missing from the map.
 */
export async function dbSelectNewestSupportTicketDialogs(
  supportTicketIds: number[],
): Promise<Map<number, { type: SupportTicketMessageType; isModerator: boolean }>> {
  if (supportTicketIds.length === 0) {
    return new Map()
  }
  const newest = drizzleDb()
    .select({ id: sql<number>`max(${supportTicketMessagesTable.id})`.as('newest_id') })
    .from(supportTicketMessagesTable)
    .where(
      and(
        inArray(supportTicketMessagesTable.supportTicketId, supportTicketIds),
        eq(supportTicketMessagesTable.type, SupportTicketMessageType.DIALOG),
      ),
    )
    .groupBy(supportTicketMessagesTable.supportTicketId)
  const rows = await drizzleDb()
    .select({
      supportTicketId: supportTicketMessagesTable.supportTicketId,
      type: supportTicketMessagesTable.type,
      isModerator: supportTicketMessagesTable.isModerator,
    })
    .from(supportTicketMessagesTable)
    .where(inArray(supportTicketMessagesTable.id, newest))
  return new Map(
    rows.map(({ supportTicketId, type, isModerator }) => [supportTicketId, { type, isModerator }]),
  )
}

/** A message of a request's thread as the moderation reads it: the author's row number with it. */
export type SupportTicketThreadMessage = SupportTicketDialogMessage & { isModerator: boolean }

/**
 * The whole thread of a request as the moderation reads it, the oldest message first: the dialog
 * and the moderation's notes, in a deleted request as well. One query, the authors with it.
 *
 * ⛔ No scope here and no owner: whether the moderator may read this thread is checked before it
 * is asked for (dbSelectSupportTicketOwnerInScope), and an empty answer says only that nothing is
 * written yet.
 */
export async function dbSelectSupportTicketThread(
  supportTicketId: number,
): Promise<SupportTicketThreadMessage[]> {
  return drizzleDb()
    .select({
      id: supportTicketMessagesTable.id,
      message: supportTicketMessagesTable.message,
      createdAt: supportTicketMessagesTable.createdAt,
      type: supportTicketMessagesTable.type,
      isModerator: supportTicketMessagesTable.isModerator,
      authorId: supportTicketMessagesTable.userId,
      authorAlias: usersTable.alias,
      authorFirstName: usersTable.firstName,
      authorLastName: usersTable.lastName,
      authorGradidoId: usersTable.gradidoId,
      authorCommunityUuid: usersTable.communityUuid,
    })
    .from(supportTicketMessagesTable)
    .leftJoin(usersTable, eq(usersTable.id, supportTicketMessagesTable.userId))
    .where(eq(supportTicketMessagesTable.supportTicketId, supportTicketId))
    .orderBy(asc(supportTicketMessagesTable.id))
}
