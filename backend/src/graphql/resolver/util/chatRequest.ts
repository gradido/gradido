// AI-GENERATED — not an architecture reference
import { ChatImageInput } from '@input/ChatImageInput'
import { acceptAndReencodeChatMessageImage, ChatMessageImageAccepted } from 'core'
import { ChatMemberRef } from 'database'
import { CHAT_IMAGES_ACCEPTED_MAX_PER_REQUEST } from '@/data/ChatConversation.logic'
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
 * The picture a member sends with a chat message or with a transfer, as it is stored: checked,
 * then decoded and encoded again (acceptAndReencodeChatMessageImage) -- or the refusal:
 * CHAT_IMAGE_NOT_ACCEPTED with the reason -- EMPTY, TOO_LARGE, NOT_JPEG or SIZE. The log gets
 * the numbers, never the picture.
 *
 * ⛔ Counted in the HTTP request's budget BEFORE any work is done on the picture: a document may
 * repeat a mutation under any number of aliases.
 */
export const acceptedPicture = async (
  image: ChatImageInput,
  context: Context,
): Promise<ChatMessageImageAccepted> => {
  context.requestBudget.chatImagesAccepted += 1
  const count = context.requestBudget.chatImagesAccepted
  if (count > CHAT_IMAGES_ACCEPTED_MAX_PER_REQUEST) {
    throw new LogError('Too many pictures sent at once', count)
  }
  const accepted = await acceptAndReencodeChatMessageImage(image)
  if (!accepted.success) {
    const { reason, bytes, width, height } = accepted.error
    throw new LogError(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}`, { bytes, width, height })
  }
  return accepted.value
}
