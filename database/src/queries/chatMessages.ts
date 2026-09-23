// AI-GENERATED — not an architecture reference
import { asc, eq, sql } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  ChatMessageDeliveryState,
  ChatMessageInsert,
  ChatMessageSelect,
  chatMessagesTable,
} from '../schemas/drizzle.schema'

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
 * Records how a delivery went: the state, and when it was tried. The time is overwritten on
 * every attempt, so once the message is delivered it is the moment of delivery.
 *
 * Writing the state the row already has is a success: mysql2 connects with FOUND_ROWS, so
 * `affectedRows` counts the matched row, not a changed one. An id without a row comes back
 * as DBNotFoundError.
 */
export async function dbUpdateChatMessageDelivery(
  id: number,
  deliveryState: ChatMessageDeliveryState,
  lastAttemptAt: Date,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(chatMessagesTable)
    .set({ deliveryState, lastAttemptAt })
    .where(eq(chatMessagesTable.id, id))
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: ChatMessageNotFound(`id = ${id}`) }
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
