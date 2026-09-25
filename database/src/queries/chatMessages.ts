// AI-GENERATED — not an architecture reference
import { and, asc, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  ChatMessageDeliveryState,
  ChatMessageInsert,
  ChatMessageMailState,
  ChatMessageSelect,
  chatConversationMembersTable,
  chatMessagesTable,
} from '../schemas/drizzle.schema'
import { ChatMemberRef } from './chatConversationMembers'

/** A message row without its subject and text: what an error about the row carries. */
export type ChatMessageInsertWithoutText = Omit<ChatMessageInsert, 'subject' | 'body'>

const ChatMessageNotFound = (where: string) => new DBNotFoundError('chat_messages', where)
// An error is what ends up in a log, and the text of a message must not: the row goes into
// the error without its subject and body.
const ChatMessageInsertFailed = ({ subject: _subject, body: _body, ...row }: ChatMessageInsert) =>
  new DBInsertFailed<ChatMessageInsertWithoutText>('chat_messages', row)

async function dbSelectChatMessageByUuid(messageUuid: string): Promise<ChatMessageSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.messageUuid, messageUuid))
    .limit(1)
  return rows.at(0) ?? null
}

/**
 * Files a message and hands back its row. The same message_uuid a second time -- a delivery
 * that came twice -- is not a failure but the same message: the unique key catches the
 * second row, the no-op update leaves the first as it is, and the first comes back.
 *
 * DBInsertFailed if no row with that uuid is there afterwards, or if the one there is not
 * this message. A delivery that came twice has the same conversation and the same sender; a
 * row with another one means the uuid was used again -- it comes from the sending server's
 * payload -- and this message is not filed under it. The sender is compared the way the
 * column compares it, without regard to case.
 */
export async function dbInsertChatMessage(
  row: ChatMessageInsert,
): Promise<Result<ChatMessageSelect, DBInsertFailed<ChatMessageInsertWithoutText>>> {
  await drizzleDb()
    .insert(chatMessagesTable)
    .values(row)
    .onDuplicateKeyUpdate({ set: { messageUuid: sql`${chatMessagesTable.messageUuid}` } })
  const message = await dbSelectChatMessageByUuid(row.messageUuid)
  if (
    message &&
    message.conversationId === row.conversationId &&
    message.senderCommunityUuid.toLowerCase() === row.senderCommunityUuid.toLowerCase() &&
    message.senderGradidoId.toLowerCase() === row.senderGradidoId.toLowerCase()
  ) {
    return { success: true, value: message }
  }
  return { success: false, error: ChatMessageInsertFailed(row) }
}

/**
 * Records how a delivery went: the state, when it was tried, and what the other server said
 * became of the mail (E-034; null where it said nothing, or where the delivery failed) -- one
 * statement for all three. The time is overwritten on every attempt, so once the message is
 * delivered it is the moment of delivery.
 *
 * Writing the state the row already has is a success: mysql2 connects with FOUND_ROWS, so
 * `affectedRows` counts the matched row, not a changed one. An id without a row comes back
 * as DBNotFoundError.
 */
export async function dbUpdateChatMessageDelivery(
  id: number,
  deliveryState: ChatMessageDeliveryState,
  lastAttemptAt: Date,
  mailState: ChatMessageMailState | null,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(chatMessagesTable)
    .set({ deliveryState, lastAttemptAt, mailState })
    .where(eq(chatMessagesTable.id, id))
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: ChatMessageNotFound(`id = ${id}`) }
}

/**
 * Records what became of the mail about a message between two members of this community
 * (E-034): its one row, which both of them read, is filed before the recipient's quiet is read.
 * One statement, and nothing else on the row changes -- a local message has no delivery to
 * record.
 *
 * The same value again is a success (FOUND_ROWS); an id without a row is DBNotFoundError.
 */
export async function dbUpdateChatMessageMailState(
  id: number,
  mailState: ChatMessageMailState,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(chatMessagesTable)
    .set({ mailState })
    .where(eq(chatMessagesTable.id, id))
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: ChatMessageNotFound(`id = ${id}`) }
}

/**
 * One page of a conversation: the newest `limit` messages with an id below `before` (all of
 * them when `before` is not given), in the order they arrived, and whether older ones are
 * left.
 *
 * Paged by the row id rather than by a page number. A conversation grows at the bottom while
 * somebody reads it, so a page counted from the newest end shifts with every arrival and
 * shows a message twice or skips one at its edge. The id of the oldest message on screen
 * stays where it is, and it is the order itself (E-018): the next page asks for ids strictly
 * below it, and the id is the primary key, so there is no tie for a boundary to split.
 *
 * Read newest first, `limit + 1` rows: the one row over the limit answers `hasMore` without
 * a second query, and is not handed back. Messages marked deleted are not on any page.
 *
 * Throws for a limit below 1: that is a caller's bug, not a page (AGENTS.md).
 */
export async function dbSelectChatMessagesPage(
  conversationId: number,
  options: { before?: number; limit: number },
): Promise<{ messages: ChatMessageSelect[]; hasMore: boolean }> {
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error(`dbSelectChatMessagesPage: ${options.limit} is not a page size`)
  }
  const newestFirst = await drizzleDb()
    .select()
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.conversationId, conversationId),
        isNull(chatMessagesTable.deletedAt),
        options.before === undefined ? undefined : lt(chatMessagesTable.id, options.before),
      ),
    )
    .orderBy(desc(chatMessagesTable.id))
    .limit(options.limit + 1)
  return {
    messages: newestFirst.slice(0, options.limit).reverse(),
    hasMore: newestFirst.length > options.limit,
  }
}

/**
 * What is new for a member: the messages with an id above `afterId` in every conversation the
 * member is in, in the order they arrived (E-018), and whether more are left above the last one
 * handed out. The one query the wallet asks on its beat (E-017).
 *
 * Every conversation the member is in is found through the member's own rows in
 * chat_conversation_members, not through the pair key of a direct conversation: a group (P5)
 * has members and no pair key, and comes along without a change here.
 *
 * The member's own messages are among them: written on another device or in another tab, they
 * are new to this one. Messages marked deleted are not, as they are on no page of a thread.
 *
 * Read `limit + 1` rows, as dbSelectChatMessagesPage does: the one row over the limit answers
 * `hasMore` without a second query, and is not handed back. The next call starts after the last
 * id handed out, so what the cap leaves out comes with the next call.
 *
 * Throws for a limit below 1 and for an id below 0: that is a caller's bug (AGENTS.md).
 */
export async function dbSelectChatMessagesSince(
  member: ChatMemberRef,
  options: { afterId: number; limit: number },
): Promise<{ messages: ChatMessageSelect[]; hasMore: boolean }> {
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error(`dbSelectChatMessagesSince: ${options.limit} is not a page size`)
  }
  if (!Number.isInteger(options.afterId) || options.afterId < 0) {
    throw new Error(`dbSelectChatMessagesSince: ${options.afterId} is not a message id`)
  }
  const rows = await drizzleDb()
    .select({ message: chatMessagesTable })
    .from(chatMessagesTable)
    .innerJoin(
      chatConversationMembersTable,
      and(
        eq(chatConversationMembersTable.conversationId, chatMessagesTable.conversationId),
        eq(chatConversationMembersTable.communityUuid, member.communityUuid),
        eq(chatConversationMembersTable.gradidoId, member.gradidoId),
      ),
    )
    .where(and(gt(chatMessagesTable.id, options.afterId), isNull(chatMessagesTable.deletedAt)))
    .orderBy(asc(chatMessagesTable.id))
    .limit(options.limit + 1)
  return {
    messages: rows.slice(0, options.limit).map((row) => row.message),
    hasMore: rows.length > options.limit,
  }
}

/**
 * The messages of a conversation in the order they arrived on this server -- the only order
 * a conversation has; nothing is sorted by a sender's clock.
 */
export async function dbSelectChatMessagesByConversationId(
  conversationId: number,
): Promise<ChatMessageSelect[]> {
  return drizzleDb()
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, conversationId))
    .orderBy(asc(chatMessagesTable.id))
}
