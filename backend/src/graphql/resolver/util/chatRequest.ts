// AI-GENERATED — not an architecture reference
import { ChatImageInput } from '@input/ChatImageInput'
import { acceptChatMessageImage, ChatMessageImageAccepted } from 'core'
import { ChatMemberRef } from 'database'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

/*
 * What a request to the chat brings, read the same way by the chat with one member
 * (ChatResolver) and by the groups (ChatGroupResolver).
 */

/** The caller as a conversation member knows them: the pair, never users.id. */
export const callerOf = (context: Context): ChatMemberRef => {
  const user = getUser(context)
  return { communityUuid: user.communityUuid, gradidoId: user.gradidoID }
}

/**
 * The picture of a message as it came in (acceptChatMessageImage), or the refusal:
 * CHAT_IMAGE_NOT_ACCEPTED with the reason -- EMPTY, TOO_LARGE, NOT_JPEG or SIZE. The log gets
 * the numbers, never the picture.
 */
export const acceptedPicture = (image: ChatImageInput): ChatMessageImageAccepted => {
  const accepted = acceptChatMessageImage(image)
  if (!accepted.success) {
    const { reason, bytes, width, height } = accepted.error
    throw new LogError(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}`, { bytes, width, height })
  }
  return accepted.value
}
