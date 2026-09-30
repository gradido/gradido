// AI-GENERATED — not an architecture reference
import { ChatMessage } from '@model/ChatMessage'
import {
  ChatMemberRef,
  ChatMessageImageInfo,
  ChatMessageSelect,
  dbSelectChatGroupUuids,
  dbSelectChatMessageImageInfos,
} from 'database'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { chatMemberKey, chatMemberUsers } from './chatMemberUsers'

/**
 * The messages of these rows as `caller` reads them -- a page of a thread, of a group, or what is
 * new across all of them --, each with what is known about its pictures (P7), for a message
 * written in a group, the group's uuid and who wrote it (P5), and for a forwarded copy, who wrote
 * its words first (E-059).
 *
 * ⛔ Read for all of them at once, never one query per message: the pictures in one query, which
 * of the conversations are groups in another, and only where there is a group message or a
 * forwarded copy, the users who wrote them (chatMemberUsers) -- the writers of both in one go. A
 * picture is matched to its message by the message's uuid the way the columns compare it,
 * without regard to case.
 */
export async function chatMessagesOf(
  rows: ChatMessageSelect[],
  caller: ChatMemberRef,
): Promise<ChatMessage[]> {
  if (rows.length === 0) {
    return []
  }
  const [infos, groupUuids] = await Promise.all([
    dbSelectChatMessageImageInfos(rows.map((row) => row.messageUuid)),
    dbSelectChatGroupUuids(rows.map((row) => row.conversationId)),
  ])
  const byMessage = new Map<string, ChatMessageImageInfo[]>()
  for (const info of infos) {
    const key = info.messageUuid.toLowerCase()
    byMessage.set(key, [...(byMessage.get(key) ?? []), info])
  }
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
  const writers = await chatMemberUsers([
    ...rows.filter((row) => groupUuids.has(row.conversationId)).map(senderOf),
    ...rows.map(firstWriterOf).filter((pair): pair is ChatMemberRef => pair !== null),
  ])
  return rows.map((row) => {
    const groupUuid = groupUuids.get(row.conversationId)
    const firstWriter = firstWriterOf(row)
    return new ChatMessage(
      row,
      caller,
      byMessage.get(row.messageUuid.toLowerCase()) ?? [],
      groupUuid === undefined
        ? null
        : { groupUuid, senderUser: writers.get(chatMemberKey(senderOf(row))) ?? null },
      firstWriter === null ? null : (writers.get(chatMemberKey(firstWriter)) ?? null),
    )
  })
}
