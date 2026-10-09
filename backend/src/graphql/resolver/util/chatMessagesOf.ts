// AI-GENERATED — not an architecture reference
import { ChatMessage } from '@model/ChatMessage'
import { ChatMessageQuote } from '@model/ChatMessageQuote'
import {
  ChatMemberRef,
  ChatMessageImageInfo,
  ChatMessageSelect,
  dbSelectChatGroupUuids,
  dbSelectChatMessageImageInfos,
  dbSelectChatMessagesByUuids,
} from 'database'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { chatMemberKey, chatMemberUsers } from './chatMemberUsers'

/**
 * The messages of these rows as `caller` reads them -- a page of a thread, of a group, or what is
 * new across all of them --, each with what is known about its pictures (P7), for a message
 * written in a group, the group's uuid and who wrote it (P5), for a forwarded copy, who wrote
 * its words first (E-059), and for an answer, the message it quotes.
 *
 * ⛔ Read for all of them at once, never one query per message: the quoted messages in one query
 * -- asked only where a row answers one --, the pictures in one, which of the conversations are
 * groups in another, and only where there is a group message or a forwarded copy, the users who
 * wrote them (chatMemberUsers) -- the writers of both, and of what a group's answers quote, in
 * one go. A picture is matched to its message by the message's uuid the way the columns compare
 * it, without regard to case, and so is a quoted message to its answer.
 *
 * ⛔ A quoted message is shown only where it lies in the conversation of its answer: `caller`
 * reads that conversation, and nothing says they read another. The senders check it before an
 * answer is filed (checkedReplyTo); here it is checked again, on what is read.
 */
export async function chatMessagesOf(
  rows: ChatMessageSelect[],
  caller: ChatMemberRef,
): Promise<ChatMessage[]> {
  if (rows.length === 0) {
    return []
  }
  const answered = rows.flatMap((row) => row.replyToMessageUuid ?? [])
  const quotedRows = answered.length > 0 ? await dbSelectChatMessagesByUuids(answered) : []
  const quotedByUuid = new Map(quotedRows.map((row) => [row.messageUuid.toLowerCase(), row]))
  const quotedOf = (row: ChatMessageSelect): ChatMessageSelect | null => {
    const quoted = row.replyToMessageUuid
      ? quotedByUuid.get(row.replyToMessageUuid.toLowerCase())
      : undefined
    return quoted && quoted.conversationId === row.conversationId ? quoted : null
  }
  const [infos, groupUuids] = await Promise.all([
    dbSelectChatMessageImageInfos([...rows, ...quotedRows].map((row) => row.messageUuid)),
    dbSelectChatGroupUuids(rows.map((row) => row.conversationId)),
  ])
  const byMessage = new Map<string, ChatMessageImageInfo[]>()
  for (const info of infos) {
    const key = info.messageUuid.toLowerCase()
    byMessage.set(key, [...(byMessage.get(key) ?? []), info])
  }
  const imagesOf = (row: ChatMessageSelect): ChatMessageImageInfo[] =>
    byMessage.get(row.messageUuid.toLowerCase()) ?? []
  const senderOf = (row: ChatMessageSelect): ChatMemberRef => ({
    communityUuid: row.senderCommunityUuid,
    gradidoId: row.senderGradidoId,
  })
  // The first writer of a forwarded copy, where it is somebody else than its sender: a copy of
  // one's own words names nobody (E-059).
  const firstWriterOf = (row: ChatMessageSelect): ChatMemberRef | null =>
    row.forwardedFromCommunityUuid === null ||
    row.forwardedFromGradidoId === null ||
    isSameChatMember(
      { communityUuid: row.forwardedFromCommunityUuid, gradidoId: row.forwardedFromGradidoId },
      senderOf(row),
    )
      ? null
      : { communityUuid: row.forwardedFromCommunityUuid, gradidoId: row.forwardedFromGradidoId }
  // Who wrote what a group's answer quotes: named as the writer of a group's message is. Between
  // two members the thread knows both, and nobody is looked up.
  const quotedInGroupOf = (row: ChatMessageSelect): ChatMessageSelect | null =>
    groupUuids.has(row.conversationId) ? quotedOf(row) : null
  const writers = await chatMemberUsers([
    ...rows.filter((row) => groupUuids.has(row.conversationId)).map(senderOf),
    ...rows.map(firstWriterOf).filter((pair): pair is ChatMemberRef => pair !== null),
    ...rows.flatMap((row) => {
      const quoted = quotedInGroupOf(row)
      return quoted ? [senderOf(quoted)] : []
    }),
  ])
  return rows.map((row) => {
    const groupUuid = groupUuids.get(row.conversationId)
    const firstWriter = firstWriterOf(row)
    const quoted = quotedOf(row)
    return new ChatMessage(
      row,
      caller,
      imagesOf(row),
      groupUuid === undefined
        ? null
        : { groupUuid, senderUser: writers.get(chatMemberKey(senderOf(row))) ?? null },
      firstWriter === null ? null : (writers.get(chatMemberKey(firstWriter)) ?? null),
      quoted === null
        ? null
        : new ChatMessageQuote(
            quoted,
            caller,
            imagesOf(quoted).length > 0,
            groupUuid === undefined ? null : (writers.get(chatMemberKey(senderOf(quoted))) ?? null),
          ),
    )
  })
}
