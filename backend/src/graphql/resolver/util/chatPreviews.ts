// AI-GENERATED — not an architecture reference
import { ChatPreview } from '@model/ChatPreview'
import {
  ChatMemberRef,
  ChatMessageSelect,
  ContactRow,
  dbSelectBookingLinesOfUser,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessagesByIds,
  TransactionTypeId,
} from 'database'
import { chatQuoteExcerpt, isSameChatMember } from '@/data/ChatConversation.logic'
import { chatPreviewWords, laterChatPreview } from '@/data/ChatPreview.logic'
import { chatMemberKey, chatMemberUsers } from './chatMemberUsers'

const senderOf = (row: ChatMessageSelect): ChatMemberRef => ({
  communityUuid: row.senderCommunityUuid,
  gradidoId: row.senderGradidoId,
})

/**
 * The lines of these messages as `caller` reads them (E-083), keyed by the message's id: the
 * beginning of its words, whether `caller` wrote it, whether it carries a picture -- and, with
 * `namingWriters` (a group), who wrote it, as a group's message names its writer.
 *
 * ⛔ Read for all of them at once, as chatMessagesOf reads a page: the messages in one query, which
 * of them carry a picture in one, and the writers in one go (chatMemberUsers) -- never one query
 * per line. A message marked deleted, or gone, has no entry.
 *
 * The ids are the caller's to have taken from `caller`'s own conversations
 * (dbSelectChatMessagesByIds).
 */
export async function chatMessagePreviews(
  ids: number[],
  caller: ChatMemberRef,
  { namingWriters }: { namingWriters: boolean },
): Promise<Map<number, ChatPreview>> {
  const rows = await dbSelectChatMessagesByIds(ids)
  if (rows.length === 0) {
    return new Map()
  }
  const mine = (row: ChatMessageSelect) => isSameChatMember(senderOf(row), caller)
  const [infos, writers] = await Promise.all([
    dbSelectChatMessageImageInfos(rows.map((row) => row.messageUuid)),
    namingWriters
      ? chatMemberUsers(rows.filter((row) => !mine(row)).map(senderOf))
      : Promise.resolve(new Map()),
  ])
  // Matched by the message's uuid the way the columns compare it, without regard to case.
  const withPicture = new Set(infos.map((info) => info.messageUuid.toLowerCase()))
  return new Map(
    rows.map((row) => [
      row.id,
      new ChatPreview({
        mine: mine(row),
        excerpt: chatQuoteExcerpt(chatPreviewWords(row.subject, row.body)),
        hasImage: withPicture.has(row.messageUuid.toLowerCase()),
        amount: null,
        // Only the others were looked up: one's own message names nobody (the wallet says "Du"),
        // and between two members nobody is looked up at all.
        senderUser: writers.get(chatMemberKey(senderOf(row))) ?? null,
        at: row.createdAt,
      }),
    ]),
  )
}

/**
 * The lines of these bookings of `userId`'s (E-083), keyed by the booking's id: its memo, the
 * Gradido it moved without their sign, and whether `userId` gave them. One query for all of them.
 * A row without an amount has no line: it would name a wrong one.
 */
export async function bookingPreviews(
  userId: number,
  ids: number[],
): Promise<Map<number, ChatPreview>> {
  const lines = await dbSelectBookingLinesOfUser(userId, ids)
  const previews = new Map<number, ChatPreview>()
  for (const line of lines) {
    if (line.amount === null) {
      continue
    }
    previews.set(
      line.id,
      new ChatPreview({
        mine: line.typeId === TransactionTypeId.SEND,
        excerpt: chatQuoteExcerpt(line.memo),
        hasImage: false,
        amount: line.amount.abs(),
        senderUser: null,
        at: line.balanceDate,
      }),
    )
  }
  return previews
}

/**
 * The line under each of these contacts (E-083), in their order: of the latest message with them
 * and the latest booking, the later one (laterChatPreview); null for a contact with neither -- one
 * only on the referral trace. Both kinds for the whole list in one go each.
 */
export async function contactChatPreviews(
  userId: number,
  member: ChatMemberRef,
  rows: ContactRow[],
): Promise<(ChatPreview | null)[]> {
  const present = (id: number | null): id is number => id !== null
  const [messages, bookings] = await Promise.all([
    chatMessagePreviews(rows.map((row) => row.lastChatMessageId).filter(present), member, {
      namingWriters: false,
    }),
    bookingPreviews(userId, rows.map((row) => row.lastBookingId).filter(present)),
  ])
  return rows.map((row) =>
    laterChatPreview(
      row.lastChatMessageId === null ? null : (messages.get(row.lastChatMessageId) ?? null),
      row.lastBookingId === null ? null : (bookings.get(row.lastBookingId) ?? null),
    ),
  )
}
