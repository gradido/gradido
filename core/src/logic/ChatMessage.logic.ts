// AI-GENERATED — not an architecture reference
import {
  ChatMemberRef,
  ChatMessageDeliveryState,
  ChatMessageNotify,
  ChatMessageSelect,
  dbEnsureDirectChatConversation,
  dbInsertChatMessage,
  dbSelectChatConversationMember,
  dbUpdateChatMessageDelivery,
} from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ChatMessage`)

/** Which branch filed a message. Only ever written to the log. */
export type ChatMessageBranch = 'local' | 'outgoing' | 'incoming'

/** A message between two members, as the branch that sends or receives it hands it over. */
export interface ChatMessageToStore {
  messageUuid: string
  sender: ChatMemberRef
  recipient: ChatMemberRef
  subject: string | null
  body: string
  notify: ChatMessageNotify
  deliveryState: ChatMessageDeliveryState
}

/**
 * What a database error may tell the log: its code, never its message. A failed Drizzle query
 * carries its parameters in the message ("Failed query: ... params: ..."), and the parameters
 * of a chat message are its subject and its text.
 */
const errorCode = (error: unknown): string => {
  const failed = error as { code?: unknown; cause?: { code?: unknown }; name?: unknown } | null
  const code = failed?.cause?.code ?? failed?.code ?? failed?.name
  return typeof code === 'string' ? code : 'unknown'
}

/**
 * Files a message between two members in their conversation -- the first message opens it --
 * and hands back the row, or null when it could not be filed.
 *
 * ⛔ Never throws. A message from the form "send an e-mail", and one arriving from another
 * server, was mailed before the chat existed and still has to be: whatever the database throws
 * is caught here and logged, and the caller mails as if nothing had been stored. This catch and
 * the ones in recordChatMessageDelivery and readChatMemberMutedAt are where that is decided. A
 * message written in the chat itself (sendChatMessage) IS its row: that caller takes a null
 * as "not sent".
 *
 * The log says which message went where -- uuid, conversation, branch -- and never its
 * subject or text.
 */
export async function storeChatMessage(
  message: ChatMessageToStore,
  branch: ChatMessageBranch,
): Promise<ChatMessageSelect | null> {
  const logger = createLogger()
  try {
    const conversation = await dbEnsureDirectChatConversation(message.sender, message.recipient)
    const stored = await dbInsertChatMessage({
      messageUuid: message.messageUuid,
      conversationId: conversation.id,
      senderCommunityUuid: message.sender.communityUuid,
      senderGradidoId: message.sender.gradidoId,
      subject: message.subject,
      body: message.body,
      notify: message.notify,
      deliveryState: message.deliveryState,
    })
    if (!stored.success) {
      logger.error(
        `chat message not stored: message_uuid=${message.messageUuid} branch=${branch} (${stored.error.message})`,
      )
      return null
    }
    logger.info(
      `chat message stored: message_uuid=${stored.value.messageUuid} conversation_id=${stored.value.conversationId} branch=${branch}`,
    )
    return stored.value
  } catch (error) {
    logger.error(
      `chat message not stored: message_uuid=${message.messageUuid} branch=${branch} (${errorCode(error)})`,
    )
    return null
  }
}

/**
 * Records whether the own copy of a message reached the other server, and when that was
 * tried. Hands back the moment it recorded, or null when nothing was recorded -- so the caller
 * can tell what the row says now.
 *
 * ⛔ Never throws, like storeChatMessage. It runs after the command has gone out: a throw here
 * would turn a delivered message into an error for the person who sent it, or replace the
 * error of a failed delivery with one about this table.
 */
export async function recordChatMessageDelivery(
  messageId: number,
  deliveryState: ChatMessageDeliveryState,
): Promise<Date | null> {
  const logger = createLogger()
  const attemptedAt = new Date()
  try {
    const updated = await dbUpdateChatMessageDelivery(messageId, deliveryState, attemptedAt)
    if (!updated.success) {
      logger.warn(
        `chat message delivery not recorded: id=${messageId} state=${deliveryState} (${updated.error.message})`,
      )
      return null
    }
    logger.debug(`chat message delivery recorded: id=${messageId} state=${deliveryState}`)
    return attemptedAt
  } catch (error) {
    logger.error(
      `chat message delivery not recorded: id=${messageId} state=${deliveryState} (${errorCode(error)})`,
    )
    return null
  }
}

/**
 * When the member muted the conversation, or null (E-024). Read on the member's own server,
 * where the mail about a message to them would go out.
 *
 * ⛔ Never throws, like storeChatMessage. It runs between filing a message and mailing it: a
 * throw here would take the mail away from a message that is filed, and turn it into an error
 * for its sender. A read that fails counts as not muted -- a mail too many is better than
 * silence.
 */
export async function readChatMemberMutedAt(
  conversationId: number,
  member: ChatMemberRef,
): Promise<Date | null> {
  try {
    const row = await dbSelectChatConversationMember(conversationId, member)
    return row?.mutedAt ?? null
  } catch (error) {
    createLogger().error(
      `chat mute mark not read: conversation_id=${conversationId} (${errorCode(error)})`,
    )
    return null
  }
}

/**
 * The wish a message is filed and sent with (E-024, the wake-up call). The first message
 * between two members -- there is no conversation of theirs yet -- goes out as a mail as well,
 * whatever was asked for; there is no choice for it. Every message after it carries what the
 * sender asked for.
 *
 * Decided on the sending server, against its own table, before the message is filed: what is
 * filed and what travels is the wish this returns.
 */
export const chatMessageNotify = (
  requested: ChatMessageNotify,
  conversationExists: boolean,
): ChatMessageNotify => (conversationExists ? requested : ChatMessageNotify.EMAIL)

/**
 * Whether a message goes out as a mail as well: only when the sender asked for one AND the
 * recipient has not muted the conversation. Mute beats the tick (E-024) -- the importance is
 * the sender's to judge, the quiet the recipient's to ask for, and they meet here, on the
 * recipient's server.
 */
export const chatMailWanted = (notify: ChatMessageNotify, mutedAt: Date | null): boolean =>
  notify === ChatMessageNotify.EMAIL && mutedAt === null

/**
 * The sender's wish as a command from another server carries it. Only 'none' is taken at its
 * word; anything else -- missing, unknown, from a server that predates the chat -- means a
 * mail, as every message meant before: a mail too many is better than silence.
 */
export const parseChatMessageNotify = (value: unknown): ChatMessageNotify =>
  value === ChatMessageNotify.NONE ? ChatMessageNotify.NONE : ChatMessageNotify.EMAIL
