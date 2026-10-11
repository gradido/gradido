// AI-GENERATED — not an architecture reference
import { SetChatMessageReactionArgs } from '@arg/SetChatMessageReactionArgs'
import { ChatMessage } from '@model/ChatMessage'
import { databaseErrorCode } from 'core'
import {
  ChatMemberRef,
  ChatMessageSelect,
  DrizzleTransaction,
  dbDeleteChatMessageReaction,
  dbSelectChatConversationMembers,
  dbSelectChatMessageForMember,
  dbUpdateChatMessageReactedAt,
  dbUpsertChatMessageReaction,
  drizzleDb,
} from 'database'
import { getLogger } from 'log4js'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import * as v from 'valibot'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CHAT_REACTIONS_MAX_PER_REQUEST } from '@/data/ChatReaction.logic'
import { chatReactionEmojiSchema } from '@/data/ChatReaction.schema'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'
import { chatMessagesOf } from './util/chatMessagesOf'
import { callerOf } from './util/chatRequest'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatReactionResolver`)

/** What the database says of a transaction it ended to resolve a deadlock: none of it was written. */
const DEADLOCK = 'ER_LOCK_DEADLOCK'

/**
 * The write: the stamp on the message and the member's reaction, in one transaction -- both are
 * there afterwards, or neither. The stamp first: it holds the message's row, so that two members
 * reacting to one message at the same moment write one after the other, and it carries the rule
 * once more (dbUpdateChatMessageReactedAt) -- whatever became of the message or of the caller's
 * membership since they were looked up, nothing is written for somebody who is not in the
 * conversation. Refused as UNKNOWN_MESSAGE then, and as NOT_STORED where the database failed.
 *
 * Tried once more where the database ended the transaction to resolve a deadlock. The stamp holds
 * the message's row and reads the caller's membership; marking a conversation read
 * (dbUpdateChatConversationMemberLastRead) holds the membership and reads the message -- the same
 * member doing both to one message in the same instant can meet crosswise. Nothing of a
 * transaction ended so is written, and the second try finds the other one gone.
 *
 * What the database throws does not leave this function: the log gets its error code, never its
 * message, which carries the statement's values.
 */
const reactionWritten = async (
  message: ChatMessageSelect,
  caller: ChatMemberRef,
  emoji: string | null,
): Promise<void> => {
  const write = (): Promise<boolean> =>
    drizzleDb().transaction(async (tx: DrizzleTransaction) => {
      const touched = await dbUpdateChatMessageReactedAt(message.id, caller, tx)
      if (!touched.success) {
        return false
      }
      if (emoji === null) {
        await dbDeleteChatMessageReaction(message.id, caller, tx)
      } else {
        await dbUpsertChatMessageReaction({ messageId: message.id, ...caller, emoji }, tx)
      }
      return true
    })
  let stamped = false
  try {
    stamped = await write().catch((error: unknown) => {
      if (databaseErrorCode(error) !== DEADLOCK) {
        throw error
      }
      return write()
    })
  } catch (error) {
    throw new LogError(
      'CHAT_REACTION_NOT_SET: NOT_STORED',
      message.messageUuid,
      databaseErrorCode(error),
    )
  }
  if (!stamped) {
    throw new LogError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE', message.messageUuid)
  }
}

/**
 * Reacting to a message (Bernd, 11.10.2026): a member of a conversation answers a message with an
 * emoji, and everybody in the conversation sees it under the message.
 */
@Resolver()
export class ChatReactionResolver {
  /**
   * Sets the caller's reaction to a message, or takes it back (`emoji` absent), and hands back the
   * message as the caller reads it then, with its reactions. One reaction a member and message:
   * another emoji takes the place of the one before. Taking back where there is none changes
   * nothing but the message's moment of reactions.
   *
   * To every message of a conversation the caller is in -- somebody else's and their own, in a
   * conversation of two and in a group. The other members get it with their wallet's beat
   * (newChatMessagesSince, `reacted`). No mail goes out about a reaction, and nothing becomes
   * unread by it.
   *
   * Behind SEND_CHAT_MESSAGE: an account that may not write may not react either. Taking a
   * reaction back is behind it too -- the mutation is one, and its right the writing one: an
   * account whose address was never confirmed takes back a reaction of its first day once the
   * address is confirmed (RESTRICTED_WHILE_UNCONFIRMED keeps taking back one's own things open
   * elsewhere; here it does not).
   *
   * Refused as CHAT_REACTION_NOT_SET with the reason, before anything is written:
   * - UNKNOWN_EMOJI: not one of the wallet's forty-eight (chatReactionEmojiSchema);
   * - UNKNOWN_MESSAGE: no such message in a conversation of the caller's, or one marked deleted
   *   (dbSelectChatMessageForMember) -- a transfer shown in a thread has no row either;
   * - OTHER_COMMUNITY: a conversation with a member of another community. Their server holds a
   *   copy of the message, and a reaction has no way there yet: set here alone, the two would
   *   read different things under the same message.
   *
   * And where the write itself failed (reactionWritten): UNKNOWN_MESSAGE for a message gone in the
   * meantime, NOT_STORED for a database that failed.
   *
   * The log gets the message's uuid, never the emoji: with the message it would say what somebody
   * thought of it. The request log leaves it out as well (`$emoji` in filterVariables).
   */
  @Authorized([RIGHTS.SEND_CHAT_MESSAGE])
  @Mutation(() => ChatMessage)
  async setChatMessageReaction(
    @Args() { messageUuid, emoji }: SetChatMessageReactionArgs,
    @Ctx() context: Context,
  ): Promise<ChatMessage> {
    // ⛔ Counted in the HTTP request's budget before anything is looked up: a document may repeat
    // this field under any number of aliases (RequestBudget in server/context.ts).
    context.requestBudget.chatReactionsSet += 1
    const count = context.requestBudget.chatReactionsSet
    if (count > CHAT_REACTIONS_MAX_PER_REQUEST) {
      throw new LogError('Too many chat reactions set at once', count)
    }
    const caller = callerOf(context)
    const reaction = emoji ?? null
    if (reaction !== null && !v.safeParse(chatReactionEmojiSchema, reaction).success) {
      throw new LogError('CHAT_REACTION_NOT_SET: UNKNOWN_EMOJI', messageUuid)
    }
    const found = await dbSelectChatMessageForMember(messageUuid, caller)
    if (!found.success) {
      throw new LogError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE', messageUuid)
    }
    // The caller is a member of this community: whoever is of another one reads a copy elsewhere.
    const members = await dbSelectChatConversationMembers(found.value.conversationId)
    if (
      members.some(
        (member) => member.communityUuid.toLowerCase() !== caller.communityUuid.toLowerCase(),
      )
    ) {
      throw new LogError('CHAT_REACTION_NOT_SET: OTHER_COMMUNITY', messageUuid)
    }
    await reactionWritten(found.value, caller, reaction)
    createLogger().info(
      `chat reaction ${reaction === null ? 'taken back' : 'set'}: message_uuid=${found.value.messageUuid}`,
    )
    // Read again: the stamp is the database's clock, and the answer carries it (`reactedAt`).
    const stamped = await dbSelectChatMessageForMember(messageUuid, caller)
    if (!stamped.success) {
      throw new LogError('CHAT_REACTION_NOT_SET: UNKNOWN_MESSAGE', messageUuid)
    }
    const [copy] = await chatMessagesOf([stamped.value], caller)
    return copy
  }
}
