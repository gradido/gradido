// AI-GENERATED — not an architecture reference
import {
  ChatMessageMailState,
  ChatMessageNotify,
  User as DbUser,
  dbSelectChatMessageImageInfos,
  dbUpdateChatMessageBody,
  dbUpdateForeignUserAlias,
  dbUpsertForeignUser,
  findUserByUuids,
} from 'database'
import { status } from 'elysia'
import { getLogger } from 'log4js'
import { MESSAGE_MIN_CHARS } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendCustomEmail } from '../../emails/sendEmailVariants'
import {
  chatMailWentOut,
  chatMessageMailState,
  databaseErrorCode,
  readChatMemberMutedAt,
  storeChatMessage,
} from '../../logic/ChatMessage.logic'
import {
  acceptIncomingChatMessageImages,
  removeChatMessageImages,
  storeIncomingChatMessageImage,
} from '../../logic/ChatMessageImage.logic'
import { ApiClientCompleted } from '../ApiClient'
import { ChatMessageWire, EditChatMessageWire } from '../schema'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.chatMessages.${method}`)

// ⛔ A member of the calling community writes, and nobody else: derive in apiRoutes has proven
// which community calls, and the writer is named in it. A server changes and sends messages of
// its own members only (FÖD-14). Nothing here writes a subject, a text or a picture to the log.

/**
 * A message from a member of the calling community to a member of this one: filed here under the
 * uuid the sending server filed its own copy under, and mailed where that is wanted -- a letter
 * always, a chat message when asked for and not muted by the recipient (E-024, E-034).
 *
 * Answers what became of the mail: MAILED, MUTED, or null -- none asked for, or none went out.
 * What the mail transport reported stays in this server's debug log: it names the recipient's
 * address.
 */
export async function receiveChatMessage({
  body,
  senderClient,
}: {
  body: ChatMessageWire
  senderClient: ApiClientCompleted
}) {
  const logger = createLogger('receiveChatMessage')
  if (body.sender.communityUuid !== senderClient.communityUuid) {
    logger.debug(`a message of a member of ${body.sender.communityUuid}, sent by another community`)
    return status('Unauthorized')
  }
  // P7b: checked and encoded again before anything is filed, the sender included, as the sending
  // server did. A refusal is a bug or a forgery, and the sender sees "not delivered".
  const accepted = await acceptIncomingChatMessageImages(body.images)
  if (!accepted.success) {
    logger.warn(
      `chat message picture refused: message_uuid=${body.messageUuid} (${accepted.error})`,
    )
    return status('Bad Request', `CHAT_IMAGE_NOT_ACCEPTED: ${accepted.error}`)
  }
  const senderUser = await findSender(body.sender)
  if (!senderUser) {
    return status('Not Found', 'Sender user not found')
  }
  // a member of this community: never a row filed for one of another
  const recipientUser = await findUserByUuids(
    body.recipient.communityUuid,
    body.recipient.gradidoId,
  )
  if (!recipientUser) {
    return status('Not Found', 'Recipient user not found')
  }

  const { messageUuid } = body
  const letter = body.notify === 'letter'
  // a letter wishes a mail; the column holds 'email' or 'none'
  const notify = body.notify === 'letter' ? ChatMessageNotify.EMAIL : body.notify
  const recipient = {
    communityUuid: recipientUser.communityUuid,
    gradidoId: recipientUser.gradidoID,
  }
  // The picture first, under the message's uuid, then the message -- as the sending server filed
  // its copy. A message whose picture cannot be filed is not filed and not mailed. A picture a
  // delivery of the same message filed before is not taken out again.
  const [picture] = accepted.value
  let pictureFiledNow = false
  if (picture) {
    const filed = await storeIncomingChatMessageImage(messageUuid, picture)
    if (!filed.success) {
      return filed.error === 'CONTRADICTION'
        ? status('Conflict', 'CHAT_IMAGE_NOT_ACCEPTED: CONTRADICTION')
        : status('Internal Server Error', 'CHAT_MESSAGE_NOT_STORED')
    }
    pictureFiledNow = filed.value === 'FILED'
  }
  const stored = await storeChatMessage(
    {
      messageUuid,
      sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
      recipient,
      subject: body.subject || null,
      body: body.body,
      notify,
      deliveryState: 'delivered',
    },
    'incoming',
  )
  if (!stored && picture) {
    if (pictureFiledNow) {
      await removeChatMessageImages(messageUuid)
    }
    return status('Internal Server Error', 'CHAT_MESSAGE_NOT_STORED')
  }
  // A message that could not be filed is mailed as before the chat: the mail is then all the
  // recipient gets of it, and without the conversation there is no mute mark to read.
  const mutedAt = stored ? await readChatMemberMutedAt(stored.conversationId, recipient) : null
  let mailState: ChatMessageMailState | null = stored
    ? chatMessageMailState(notify, mutedAt, letter)
    : ChatMessageMailState.MAILED
  if (mailState === ChatMessageMailState.MAILED) {
    const sent = await sendCustomEmail({
      firstName: recipientUser.firstName,
      lastName: recipientUser.lastName,
      email: recipientUser.emailContact.email,
      language: recipientUser.language,
      senderAlias: senderUser.alias,
      // the way back to the sender behind the mail's button
      senderUuid: senderUser.gradidoID,
      senderCommunityUuid: senderUser.communityUuid,
      subject: body.subject ?? '',
      memo: body.body,
      // the mail says there is a picture, and shows none (MAIL-008)
      hasImage: Boolean(picture),
    })
    logger.debug('mail transport answered', sent)
    if (!chatMailWentOut(sent)) {
      mailState = null
    }
  }
  return { mailState }
}

/**
 * The sender: the `users` row this server keeps for the member of the calling community, filed
 * now where there is none (E-034) -- the way the receiving side of a transfer files its sender,
 * by the pair and the alias -- and brought up to date where the alias changed over there. What
 * cannot be filed or updated leaves the sender as it was, and a sender not on file unknown.
 */
async function findSender(sender: ChatMessageWire['sender']): Promise<DbUser | null> {
  const logger = createLogger('findSender')
  const onFile = await findUserByUuids(sender.communityUuid, sender.gradidoId, true)
  try {
    if (onFile) {
      if (onFile.alias !== sender.alias) {
        const updated = await dbUpdateForeignUserAlias(onFile.id, sender.alias)
        if (updated.success) {
          // the mail names the sender by it
          onFile.alias = sender.alias
        } else {
          logger.warn(`sender's alias not updated: users.id=${onFile.id} (${updated.error.name})`)
        }
      }
      return onFile
    }
    const filed = await dbUpsertForeignUser(sender)
    if (!filed.success) {
      logger.warn(`sender not filed (${filed.error.name})`)
      return null
    }
    logger.info(`sender filed as a member of another community: users.id=${filed.value}`)
    return await findUserByUuids(sender.communityUuid, sender.gradidoId, true)
  } catch (error) {
    logger.error(`sender not filed or not updated (${databaseErrorCode(error)})`)
    return onFile
  }
}

/** Why a change was refused, as the answer carries it; the sending server logs it. */
export const EDIT_CHAT_MESSAGE_REFUSED = {
  // The writer is not a member of the community that sends the change.
  NOT_THE_WRITERS_COMMUNITY: 'CHAT_MESSAGE_NOT_EDITED: NOT_THE_WRITERS_COMMUNITY',
  // No text, where the message carries no picture.
  EMPTY: 'CHAT_MESSAGE_NOT_EDITED: EMPTY',
  // No message of that writer under that uuid here -- or it is marked deleted, or a forwarded copy.
  UNKNOWN_MESSAGE: 'CHAT_MESSAGE_NOT_EDITED: UNKNOWN_MESSAGE',
  // The database failed; this server's log has its error code.
  NOT_STORED: 'CHAT_MESSAGE_NOT_EDITED: NOT_STORED',
} as const

/**
 * A member of the calling community changed a message they wrote to a member here (E-060): the
 * copy filed here gets the new text and says "bearbeitet". The writer has to be a member of the
 * calling community, and the sender of the message on file (dbUpdateChatMessageBody names the
 * pair in its where clause). Nothing is mailed, nothing else on the row changes.
 */
export async function editChatMessage({
  body: { writer, messageUuid, body },
  senderClient,
}: {
  body: EditChatMessageWire
  senderClient: ApiClientCompleted
}) {
  const logger = createLogger('editChatMessage')
  const refuse = (code: 'Unauthorized' | 'Bad Request' | 'Not Found', reason: string) => {
    logger.warn(`chat message not edited: message_uuid=${messageUuid} (${reason})`)
    return status(code, reason)
  }
  if (writer.communityUuid !== senderClient.communityUuid) {
    return refuse('Unauthorized', EDIT_CHAT_MESSAGE_REFUSED.NOT_THE_WRITERS_COMMUNITY)
  }
  try {
    // a caption may go where the picture stays (E-044); any other text may not be emptied
    if (
      Array.from(body).length < MESSAGE_MIN_CHARS &&
      (await dbSelectChatMessageImageInfos([messageUuid])).length === 0
    ) {
      return refuse('Bad Request', EDIT_CHAT_MESSAGE_REFUSED.EMPTY)
    }
    if (!(await dbUpdateChatMessageBody(messageUuid, writer, body)).success) {
      return refuse('Not Found', EDIT_CHAT_MESSAGE_REFUSED.UNKNOWN_MESSAGE)
    }
  } catch (error) {
    // ⛔ As its code: a failed query carries its parameters in its message, the text among them.
    logger.error(
      `chat message not edited: message_uuid=${messageUuid} (${databaseErrorCode(error)})`,
    )
    return status('Internal Server Error', EDIT_CHAT_MESSAGE_REFUSED.NOT_STORED)
  }
  logger.info(`chat message edited: message_uuid=${messageUuid} branch=incoming`)
  return true
}
