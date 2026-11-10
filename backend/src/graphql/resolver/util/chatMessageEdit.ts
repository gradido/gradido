// AI-GENERATED — not an architecture reference

import { ApiClientCache } from 'core'
import { ChatMemberRef, dbFindAuthenticatedForeignCommunityByIdentifier } from 'database'
import { VoidResult } from 'shared'

/**
 * Why a changed text did not reach the other server, for the member's wallet and for the log:
 * - NO_WAY_TO_DELIVER: the other community is not known here as one through the handshake;
 * - NOT_CONFIRMED: the request went out and the other server did not change its copy. It
 *   refused, or did not answer. `detail` is the status and what it said, for the log.
 */
export interface ChatMessageEditNotCarried {
  reason: 'NO_WAY_TO_DELIVER' | 'NOT_CONFIRMED'
  detail: string
}

/**
 * Carries the changed text of a message to the server of the other member of the conversation
 * (E-060) over the peer api (editChatMessage), naming the writer, the message by the uuid both
 * copies carry, and the new text. Where it fails the caller leaves its own copy as it is, so that
 * the two members go on reading the same words.
 *
 * Nothing is written here, on either side of a failure. The text is not measured against the
 * request limit: a change carries no picture, and without one every text fits.
 *
 * Never throws for what the other server does.
 */
export async function carryChatMessageEditAcrossBorder({
  writer,
  otherCommunityUuid,
  messageUuid,
  body,
}: {
  writer: ChatMemberRef
  otherCommunityUuid: string
  messageUuid: string
  body: string
}): Promise<VoidResult<ChatMessageEditNotCarried>> {
  const receiverCom = await dbFindAuthenticatedForeignCommunityByIdentifier(otherCommunityUuid)
  if (!receiverCom) {
    return { success: false, error: { reason: 'NO_WAY_TO_DELIVER', detail: otherCommunityUuid } }
  }
  const { error } = await ApiClientCache.getInstance()
    .get(receiverCom)
    .editChatMessage({ writer, messageUuid, body })
  if (!error) {
    return { success: true }
  }
  return {
    success: false,
    error: { reason: 'NOT_CONFIRMED', detail: `${error.status}: ${String(error.value)}` },
  }
}
