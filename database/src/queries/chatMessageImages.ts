// AI-GENERATED — not an architecture reference
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import {
  DBDuplicateEntryError,
  DBInsertFailed,
  DBNotFoundError,
  isDuplicateEntry,
} from '../errorTypes'
import {
  ChatMessageImageInsert,
  chatConversationMembersTable,
  chatMessageImagesTable,
  chatMessagesTable,
} from '../schemas/drizzle.schema'
import { ChatMemberRef } from './chatConversationMembers'

/**
 * What is known about a picture without the picture: all that a list of messages may read.
 * The bubble takes its room from `width` and `height` before the picture has come.
 */
export interface ChatMessageImageInfo {
  imageUuid: string
  messageUuid: string
  position: number
  width: number
  height: number
}

/** A picture's row without the picture: what an error about the row carries. */
export type ChatMessageImageInsertWithoutImage = Omit<ChatMessageImageInsert, 'image'>

// An error is what ends up in a log, and a picture a member sent must not: the row goes into the
// error without its bytes.
const ChatMessageImageInsertFailed = ({ image: _image, ...row }: ChatMessageImageInsert) =>
  new DBInsertFailed<ChatMessageImageInsertWithoutImage>('chat_message_images', row)
const ChatMessageImageDuplicate = (row: ChatMessageImageInsert) =>
  new DBDuplicateEntryError(
    'chat_message_images',
    'image_uuid, or message_uuid with position',
    `${row.imageUuid}, ${row.messageUuid} ${row.position ?? 0}`,
  )

/**
 * Files one picture of a message. An image_uuid that is taken, or a place in the message that
 * is, comes back as DBDuplicateEntryError: the unique keys refuse the second row.
 *
 * ⛔ Written BEFORE the message it belongs to (deliverChatMessageLocally): a picture whose
 * message could not be filed is taken back out with dbDeleteChatMessageImagesByMessageUuid. In
 * between, no member reaches it -- dbSelectChatMessageImageForMember needs the message.
 */
export async function dbInsertChatMessageImage(
  row: ChatMessageImageInsert,
): Promise<VoidResult<DBDuplicateEntryError | DBInsertFailed<ChatMessageImageInsertWithoutImage>>> {
  try {
    const result = await drizzleDb().insert(chatMessageImagesTable).values(row)
    if (result[0]?.affectedRows === 1) {
      return { success: true }
    }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { success: false, error: ChatMessageImageDuplicate(row) }
    }
    throw error
  }
  return { success: false, error: ChatMessageImageInsertFailed(row) }
}

/**
 * Removes the pictures of a message and says how many there were -- for a message that could
 * not be filed after its pictures were. None is an answer, not a failure.
 */
export async function dbDeleteChatMessageImagesByMessageUuid(messageUuid: string): Promise<number> {
  const result = await drizzleDb()
    .delete(chatMessageImagesTable)
    .where(eq(chatMessageImagesTable.messageUuid, messageUuid))
  return result[0]?.affectedRows ?? 0
}

/**
 * What is known about the pictures of these messages, in one query for a whole page: by message,
 * and within a message by place. A message without a picture has no entry.
 *
 * ⛔ Never the picture itself. A page carries up to a hundred messages, and at up to 35 KB a
 * picture it would be megabytes read, only for the list to throw them away. The picture
 * comes one at a time, asked for by the member who is shown the message
 * (dbSelectChatMessageImageForMember).
 *
 * The uuids are compared the way the column compares them, without regard to case.
 */
export async function dbSelectChatMessageImageInfos(
  messageUuids: string[],
): Promise<ChatMessageImageInfo[]> {
  if (messageUuids.length === 0) {
    return []
  }
  return drizzleDb()
    .select({
      imageUuid: chatMessageImagesTable.imageUuid,
      messageUuid: chatMessageImagesTable.messageUuid,
      position: chatMessageImagesTable.position,
      width: chatMessageImagesTable.width,
      height: chatMessageImagesTable.height,
    })
    .from(chatMessageImagesTable)
    .where(inArray(chatMessageImagesTable.messageUuid, messageUuids))
    .orderBy(asc(chatMessageImagesTable.messageUuid), asc(chatMessageImagesTable.position))
}

/**
 * A picture for a member: its bytes where the member -- the pair -- is in the conversation of
 * the picture's message, and the message is not marked deleted.
 *
 * ⛔ The one query that reads the picture, and the rule is in it rather than at the caller: a
 * rule every caller has to remember to apply is not a rule. Not found is the one answer for
 * every other case alike -- no such picture, a stranger asking, a deleted message, a picture
 * whose message was never filed --, so that nothing tells them apart (ChatResolver.
 * chatMessageImage).
 */
export async function dbSelectChatMessageImageForMember(
  imageUuid: string,
  member: ChatMemberRef,
): Promise<Result<Buffer, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select({ image: chatMessageImagesTable.image })
    .from(chatMessageImagesTable)
    .innerJoin(
      chatMessagesTable,
      and(
        eq(chatMessagesTable.messageUuid, chatMessageImagesTable.messageUuid),
        isNull(chatMessagesTable.deletedAt),
      ),
    )
    .innerJoin(
      chatConversationMembersTable,
      and(
        eq(chatConversationMembersTable.conversationId, chatMessagesTable.conversationId),
        eq(chatConversationMembersTable.communityUuid, member.communityUuid),
        eq(chatConversationMembersTable.gradidoId, member.gradidoId),
      ),
    )
    .where(eq(chatMessageImagesTable.imageUuid, imageUuid))
    .limit(1)
  const found = rows.at(0)
  return found
    ? { success: true, value: found.image }
    : {
        success: false,
        error: new DBNotFoundError(
          'chat_message_images',
          `image_uuid = ${imageUuid} for a member of its conversation`,
        ),
      }
}
