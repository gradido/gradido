// AI-GENERATED — not an architecture reference
import { ChatMemberRef, dbSelectChatMessageForMember } from 'database'
import { LogError } from '@/server/LogError'

/**
 * The message a new message answers, checked before anything is filed: one `caller` can read --
 * a message of a conversation they are in, not marked deleted (dbSelectChatMessageForMember) --
 * and of the very conversation the answer goes into. Hands back its uuid as it is filed, which is
 * what the answer is filed with, or null where the message answers none.
 *
 * Refused as CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY for everything else -- no such message, one of
 * another conversation, a deleted one, a conversation that does not exist yet --, with nothing
 * that tells these apart: what the caller cannot read, they do not learn about here either.
 *
 * `conversationId`: where the answer goes -- null where the two members have no conversation
 * yet, and so nothing to answer.
 */
export async function checkedReplyTo(
  replyTo: string | null | undefined,
  caller: ChatMemberRef,
  conversationId: number | null,
): Promise<string | null> {
  if (!replyTo) {
    return null
  }
  const answered =
    conversationId === null ? null : await dbSelectChatMessageForMember(replyTo, caller)
  if (!answered?.success || answered.value.conversationId !== conversationId) {
    throw new LogError('CHAT_MESSAGE_NOT_SENT: UNKNOWN_REPLY')
  }
  return answered.value.messageUuid
}
