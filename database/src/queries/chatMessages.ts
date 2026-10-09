// AI-GENERATED — not an architecture reference
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm'
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
 * One message by its uuid, for a member of its conversation, while it is not marked deleted --
 * what may be forwarded (E-059): only what the member can read in a thread of theirs.
 * DBNotFoundError for everything else -- no such message, a member of another conversation, a
 * deleted message --, with nothing that tells these apart, as dbSelectChatMessageImageForMember
 * answers for a picture.
 *
 * The uuid is compared the way the column compares it, without regard to case.
 */
export async function dbSelectChatMessageForMember(
  messageUuid: string,
  member: ChatMemberRef,
): Promise<Result<ChatMessageSelect, DBNotFoundError>> {
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
    .where(and(eq(chatMessagesTable.messageUuid, messageUuid), isNull(chatMessagesTable.deletedAt)))
    .limit(1)
  const found = rows.at(0)
  return found
    ? { success: true, value: found.message }
    : { success: false, error: ChatMessageNotFound(`message_uuid for a member`) }
}

/**
 * The messages with these uuids, in one query for a whole page: what the answers on that page
 * quote (`reply_to_message_uuid`). Messages marked deleted are not among them, and a uuid without
 * a row has no entry. In no particular order -- the caller matches them by uuid.
 *
 * ⛔ Not asked for a member: whether a quoted message may be shown is the caller's to check, by
 * its conversation -- an answer quotes a message of its own conversation and no other
 * (chatMessagesOf).
 *
 * The uuids are compared the way the column compares them, without regard to case.
 */
export async function dbSelectChatMessagesByUuids(
  messageUuids: string[],
): Promise<ChatMessageSelect[]> {
  if (messageUuids.length === 0) {
    return []
  }
  return drizzleDb()
    .select()
    .from(chatMessagesTable)
    .where(
      and(
        inArray(chatMessagesTable.messageUuid, messageUuids),
        isNull(chatMessagesTable.deletedAt),
      ),
    )
}

/**
 * Changes the text of a message (E-060) and hands back the row as it stands afterwards. Only the
 * one who wrote it changes it: the sender's pair is part of the where clause, as the member's
 * pair is for the read pointer -- a caller naming somebody else changes nothing. Not a message
 * marked deleted, and not a forwarded copy: its words are somebody else's. DBNotFoundError for
 * all of these alike, and for a uuid without a row.
 *
 * `edited_at` is the database's clock at the statement, in utc -- what drizzle reads and writes a
 * datetime as --, never a clock of the caller: the wallet's beat asks "what was changed since"
 * against the same clock (dbSelectChatUnreadSummary's `now`), whichever process made the change.
 *
 * The subject stays, and nothing else on the row changes. The same text again is a success
 * (FOUND_ROWS) and moves `edited_at`: whether that is a change is the caller's to decide before
 * it asks.
 *
 * The uuid and the pair are compared the way the columns compare them, without regard to case.
 */
export async function dbUpdateChatMessageBody(
  messageUuid: string,
  sender: ChatMemberRef,
  body: string,
): Promise<Result<ChatMessageSelect, DBNotFoundError>> {
  const result = await drizzleDb()
    .update(chatMessagesTable)
    .set({ body, editedAt: sql`utc_timestamp(3)` })
    .where(
      and(
        eq(chatMessagesTable.messageUuid, messageUuid),
        eq(chatMessagesTable.senderCommunityUuid, sender.communityUuid),
        eq(chatMessagesTable.senderGradidoId, sender.gradidoId),
        isNull(chatMessagesTable.deletedAt),
        isNull(chatMessagesTable.forwardedFromGradidoId),
      ),
    )
  const message =
    result[0]?.affectedRows === 1 ? await dbSelectChatMessageByUuid(messageUuid) : null
  return message
    ? { success: true, value: message }
    : { success: false, error: ChatMessageNotFound(`message_uuid for its sender`) }
}

/**
 * A place in the order the texts of messages were changed in (E-060): the moment of a change by
 * the database's clock, and within that moment the message's id. An id of 0 stands before every
 * message of its moment.
 */
export interface ChatEditPosition {
  editedAt: Date
  id: number
}

/**
 * What was changed for a member (E-060): the messages of every conversation the member is in
 * whose text was changed after the place `after` names, in the order they were changed -- by
 * moment, within a moment by id --, and whether more are left over the cap. Asked on the wallet's
 * beat beside dbSelectChatMessagesSince, so that an open thread shows the new text without being
 * loaded again.
 *
 * ⛔ By the database's clock (`edited_at`), not by a number that counts up. A counter is handed
 * out when a row is written and seen when it is committed, and two changes made at the same
 * moment can be committed in the other order -- the limit dbSelectChatMessagesSince lives with
 * (#3977). A moment can be asked for again with room to spare: the caller goes back a little
 * (ChatResolver.newChatMessagesSince), and what comes twice is the same message with the same
 * text.
 *
 * The id within the moment is what lets a caller go on exactly after the last message it was
 * handed: several messages can be changed in one millisecond, and a place named by the moment
 * alone would either hand all of them out again or pass some over.
 *
 * The member's own changes are among them, made on another device or in another tab. Messages
 * marked deleted are not. Every conversation the member is in is found through the member's own
 * rows, as dbSelectChatMessagesSince finds them.
 *
 * On the beat the read starts at the moment in the index on edited_at (migration 0151) and takes
 * the few messages changed since, whoever's they are, each then checked against the member's
 * rows. Measured on MariaDB 10.11 (01.10.2026; 36,000 messages, 1,808 of them changed, a member
 * of 30 conversations): 5 messages read and 0.03 ms from ten seconds back, 79 and 0.3 ms from
 * two days back. Without the index, every message of the member's conversations on every beat:
 * 6,000 read, 9 ms. Asked from long ago, the plan turns to the member's conversations first.
 *
 * Read `limit + 1` rows: the one over the limit answers `hasMore`, and is not handed back.
 *
 * Throws for a limit below 1, a moment that is none and an id below 0: that is a caller's bug
 * (AGENTS.md).
 */
export async function dbSelectChatMessagesEditedAfter(
  member: ChatMemberRef,
  options: { after: ChatEditPosition; limit: number },
): Promise<{ messages: ChatMessageSelect[]; hasMore: boolean }> {
  const { after, limit } = options
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`dbSelectChatMessagesEditedAfter: ${limit} is not a page size`)
  }
  if (!(after.editedAt instanceof Date) || Number.isNaN(after.editedAt.getTime())) {
    throw new Error(`dbSelectChatMessagesEditedAfter: ${String(after.editedAt)} is not a moment`)
  }
  if (!Number.isInteger(after.id) || after.id < 0) {
    throw new Error(`dbSelectChatMessagesEditedAfter: ${after.id} is not a message id`)
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
    .where(
      and(
        // From the moment on, as one range for the index on edited_at -- and of the moment
        // itself only what lies above the id.
        gte(chatMessagesTable.editedAt, after.editedAt),
        or(gt(chatMessagesTable.editedAt, after.editedAt), gt(chatMessagesTable.id, after.id)),
        isNull(chatMessagesTable.deletedAt),
      ),
    )
    .orderBy(asc(chatMessagesTable.editedAt), asc(chatMessagesTable.id))
    .limit(limit + 1)
  return {
    messages: rows.slice(0, limit).map((row) => row.message),
    hasMore: rows.length > limit,
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
