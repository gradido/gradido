// AI-GENERATED — not an architecture reference
import {
  ChatMemberRef,
  ChatMessageDeliveryState,
  ChatMessageNotify,
  ChatMessageSelect,
  dbEnsureDirectChatConversation,
  dbInsertChatMessage,
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
 * ⛔ Never throws. Every message that comes here was mailed before the chat existed and still
 * has to be: whatever the database throws is caught here and logged, and the caller mails as
 * if nothing had been stored. This catch and the one in recordChatMessageDelivery are where
 * that is decided.
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
 * tried.
 *
 * ⛔ Never throws, like storeChatMessage. It runs after the command has gone out: a throw here
 * would turn a delivered message into an error for the person who sent it, or replace the
 * error of a failed delivery with one about this table.
 */
export async function recordChatMessageDelivery(
  messageId: number,
  deliveryState: ChatMessageDeliveryState,
): Promise<void> {
  const logger = createLogger()
  try {
    const updated = await dbUpdateChatMessageDelivery(messageId, deliveryState, new Date())
    if (!updated.success) {
      logger.warn(
        `chat message delivery not recorded: id=${messageId} state=${deliveryState} (${updated.error.message})`,
      )
      return
    }
    logger.debug(`chat message delivery recorded: id=${messageId} state=${deliveryState}`)
  } catch (error) {
    logger.error(
      `chat message delivery not recorded: id=${messageId} state=${deliveryState} (${errorCode(error)})`,
    )
  }
}
