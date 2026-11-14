// AI-GENERATED — not an architecture reference
import { and, asc, count, eq } from 'drizzle-orm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import {
  SupportTicketMessageInsert,
  SupportTicketMessageType,
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
 * How many messages the thread of a request holds -- every kind, the moderation's notes as
 * well --, where the request is this member's. Another member's request answers 0, as a missing
 * one does: how full somebody else's thread is is nobody's business.
 */
export async function dbCountSupportTicketMessagesOfOwner(
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
    .where(eq(supportTicketMessagesTable.supportTicketId, supportTicketId))
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
      ),
    )
    .orderBy(asc(supportTicketMessagesTable.id))
}
