// AI-GENERATED — not an architecture reference
import { EditChatMessageArgs } from '@arg/EditChatMessageArgs'
import { ChatMessage } from '@model/ChatMessage'
import { minLength } from 'class-validator'
import { databaseErrorCode } from 'core'
import {
  ChatMemberRef,
  ChatMessageSelect,
  dbSelectChatConversationMembers,
  dbSelectChatMessageForMember,
  dbSelectChatMessageImageInfos,
  dbUpdateChatMessageBody,
} from 'database'
import { getLogger } from 'log4js'
import { MESSAGE_MIN_CHARS } from 'shared'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { isSameChatMember } from '@/data/ChatConversation.logic'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'
import { chatMessagesOf } from './util/chatMessagesOf'
import { callerOf } from './util/chatRequest'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatEditResolver`)

/**
 * The write, and the row as it stands after it -- or the refusal: UNKNOWN_MESSAGE where the
 * message is gone by now, NOT_STORED where the database failed.
 *
 * ⛔ What the database throws does not leave this function. A failed query carries its parameters
 * in its message, and the first parameter of this one is the text: thrown on, it would be written
 * to the request log and sent back in the answer. The log gets the database's error code.
 */
const changedText = async (
  messageUuid: string,
  writer: ChatMemberRef,
  body: string,
): Promise<ChatMessageSelect> => {
  let changed: Awaited<ReturnType<typeof dbUpdateChatMessageBody>>
  try {
    changed = await dbUpdateChatMessageBody(messageUuid, writer, body)
  } catch (error) {
    throw new LogError('CHAT_MESSAGE_NOT_EDITED: NOT_STORED', messageUuid, databaseErrorCode(error))
  }
  if (!changed.success) {
    throw new LogError('CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE', messageUuid)
  }
  return changed.value
}

/**
 * Changing a message (Bernd, 01.10.2026, E-060): a member changes the text of a message they
 * wrote -- in a conversation of two or in a group, at any time.
 */
@Resolver()
export class ChatEditResolver {
  /**
   * Gives a message of the caller's another text and hands back the caller's copy as it stands
   * then, with `editedAt` -- the thread says "bearbeitet" beside it, for everybody who reads it.
   * The earlier text is not kept. The subject of a letter stays, and so does a picture: of a
   * message with a picture, the caption changes.
   *
   * Nothing goes out again: no mail about the change, and a mail that went out with the message
   * keeps the words it had. A copy somebody forwarded earlier keeps them too -- it is a message
   * of its own. The other members get the new text with their wallet's beat
   * (newChatMessagesSince, `edited`).
   *
   * The same text again changes nothing and marks nothing: the copy comes back as it is.
   *
   * Behind SEND_CHAT_MESSAGE: an account that may not write may not rewrite either.
   *
   * Refused as CHAT_MESSAGE_NOT_EDITED with the reason, before anything is written:
   * - UNKNOWN_MESSAGE: no such message in a conversation of the caller's, or one marked deleted
   *   (dbSelectChatMessageForMember) -- a transfer shown in a thread has no row either;
   * - NOT_OWN: somebody else wrote it;
   * - FORWARDED: a forwarded copy -- its words are somebody else's;
   * - EMPTY: no text, where the message carries no picture -- the bounds of a message being sent
   *   (isLongEnoughForChatMessage);
   * - OTHER_COMMUNITY: a conversation with a member of another community. Their server holds a
   *   copy of its own, and a change made only here would leave the two reading different words.
   *   Refused until the change travels there (the next step of E-060).
   * And where the write itself failed: UNKNOWN_MESSAGE for a message gone in the meantime,
   * NOT_STORED for a database that failed.
   *
   * ⛔ The check and the write are two statements, so the write names the caller and the rules
   * again (dbUpdateChatMessageBody): whatever became of the message in between, nobody's message
   * but the caller's is changed.
   *
   * The log gets the message's uuid, never a text.
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Mutation(() => ChatMessage)
  async editChatMessage(
    @Args() { messageUuid, body }: EditChatMessageArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessage> {
    const caller = callerOf(context)
    const found = await dbSelectChatMessageForMember(messageUuid, caller)
    if (!found.success) {
      throw new LogError('CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE', messageUuid)
    }
    const message = found.value
    const writer = {
      communityUuid: message.senderCommunityUuid,
      gradidoId: message.senderGradidoId,
    }
    if (!isSameChatMember(writer, caller)) {
      throw new LogError('CHAT_MESSAGE_NOT_EDITED: NOT_OWN', messageUuid)
    }
    if (message.forwardedFromGradidoId !== null) {
      throw new LogError('CHAT_MESSAGE_NOT_EDITED: FORWARDED', messageUuid)
    }
    if (
      !minLength(body, MESSAGE_MIN_CHARS) &&
      (await dbSelectChatMessageImageInfos([message.messageUuid])).length === 0
    ) {
      throw new LogError('CHAT_MESSAGE_NOT_EDITED: EMPTY', messageUuid)
    }
    if (body === message.body) {
      const [unchanged] = await chatMessagesOf([message], caller)
      return unchanged
    }
    // The caller is a member of this community: whoever is of another one has a copy elsewhere.
    const members = await dbSelectChatConversationMembers(message.conversationId)
    if (
      members.some(
        (member) => member.communityUuid.toLowerCase() !== caller.communityUuid.toLowerCase(),
      )
    ) {
      throw new LogError('CHAT_MESSAGE_NOT_EDITED: OTHER_COMMUNITY', messageUuid)
    }
    const changed = await changedText(message.messageUuid, caller, body)
    createLogger().info(`chat message edited: message_uuid=${changed.messageUuid}`)
    const [copy] = await chatMessagesOf([changed], caller)
    return copy
  }
}
