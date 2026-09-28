import { randomUUID } from 'node:crypto'
import {
  ChatMessageMailState,
  User as DbUser,
  dbInsertForeignUser,
  dbUpdateForeignUserAlias,
  findUserByUuids,
  getCommunityByUuid,
} from 'database'
import { getLogger } from 'log4js'
import { ALIAS_MAX_CHARS, GradidoUnit, publicAlias, uuidv4Schema } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendCustomEmail, sendTransactionReceivedEmail } from '../../emails/sendEmailVariants'
import {
  CHAT_MESSAGE_NOTIFY_LETTER,
  chatMailWentOut,
  chatMessageMailState,
  databaseErrorCode,
  parseChatMessageNotify,
  readChatMemberMutedAt,
  storeChatMessage,
} from '../../logic/ChatMessage.logic'
import {
  acceptIncomingChatMessageImages,
  ChatMessageImageToStore,
  chatMessageImagesForLog,
  removeChatMessageImages,
  storeIncomingChatMessageImage,
} from '../../logic/ChatMessageImage.logic'
import { BaseCommand } from '../BaseCommand'
import { commandArgsForLog } from '../commandArgsForLog'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.commands.SendEmailCommand.${method}`)

/**
 * What the command answers. It travels back: the sending server's command client asks for
 * `data`, and `data` is what execute() returns.
 *
 * ⛔ The rule since E-034: what became of the mail about a message travels back -- MAILED, or
 * MUTED where the sender asked for a mail and the recipient has muted the conversation -- so
 * that the sender learns whether a mail went out, and if not, why. What the mail transport
 * reported does NOT travel: it names the recipient's address and says more about the mail than
 * is the sending server's business. It stays in this server's debug log. A message sent without
 * a wish for a mail, and the mail about received Gradido, answer RECEIVED.
 */
export const SEND_MAIL_COMMAND_ANSWER = {
  MAILED: 'mailed',
  MUTED: 'muted',
  RECEIVED: 'received',
} as const
export type SendMailCommandAnswer =
  (typeof SEND_MAIL_COMMAND_ANSWER)[keyof typeof SEND_MAIL_COMMAND_ANSWER]

const sendMailCommandAnswerFor = (
  mailState: ChatMessageMailState | null,
): SendMailCommandAnswer => {
  switch (mailState) {
    case ChatMessageMailState.MAILED:
      return SEND_MAIL_COMMAND_ANSWER.MAILED
    case ChatMessageMailState.MUTED:
      return SEND_MAIL_COMMAND_ANSWER.MUTED
    default:
      return SEND_MAIL_COMMAND_ANSWER.RECEIVED
  }
}

/**
 * The answer as the sending server reads it: the mail state it names, or null -- for RECEIVED,
 * and for anything else, such as what a server from before P3c answers: RECEIVED to every
 * message since P3a, the transport's report before that.
 */
export const chatMessageMailStateOfAnswer = (answer: unknown): ChatMessageMailState | null => {
  switch (answer) {
    case SEND_MAIL_COMMAND_ANSWER.MAILED:
      return ChatMessageMailState.MAILED
    case SEND_MAIL_COMMAND_ANSWER.MUTED:
      return ChatMessageMailState.MUTED
    default:
      return null
  }
}

export interface SendEmailCommandParams {
  mailType: string
  senderComUuid: string
  senderGradidoId: string
  receiverComUuid: string
  receiverGradidoId: string
  subject?: string
  memo?: string
  amount?: string
  // The uuid the sending server filed its own copy of a message under, so that both copies
  // carry the same one. Servers from before the chat send none.
  messageUuid?: string
  // The sender's wish for a message (E-024): 'none' when they asked for no mail, 'letter' from
  // the form "send an e-mail" (CHAT_MESSAGE_NOTIFY_LETTER, E-034). Nothing else is sent; servers
  // from before the chat send nothing, and nothing means a mail (parseChatMessageNotify).
  notify?: string
  // The sender's alias, where they have one: what this server files a sender it does not know
  // yet with, and brings a filed one up to date with (findSender). A transfer files its sender
  // with no more than that: since 17.07.2026 its settle step carries the alias where it carried
  // the first and last name, and the names it files are cut from the alias. No names travel
  // with a message. Servers from before P3c send no alias.
  senderAlias?: string
  // The pictures of a chat message (P7b), one at most: they travel with the message, and this
  // server checks and files them as the sending server did. A server from before P7b does not
  // read the field and files the message without its picture -- a picture without a caption
  // arrives there as an empty message. That lasts only while a release is rolled out: every
  // server gets the same version.
  images?: SendEmailCommandImage[]
}

/** A picture as it travels with a chat message to another community (P7b). */
export interface SendEmailCommandImage {
  // The name both servers file it under -- the sending server its own copy, this one its copy.
  imageUuid: string
  width: number
  height: number
  // The JPEG as base64, as the wallet uploads it.
  data: string
}
export class SendEmailCommand extends BaseCommand<
  Record<string, unknown> | boolean | null | Error
> {
  static readonly SEND_MAIL_COMMAND = 'SEND_MAIL_COMMAND'
  protected requiredFields: string[] = [
    'mailType',
    'senderComUuid',
    'senderGradidoId',
    'receiverComUuid',
    'receiverGradidoId',
  ]
  protected sendEmailCommandParams: SendEmailCommandParams

  constructor(params: any[]) {
    const methodLogger = createLogger(`constructor`)
    // The debug lines write a picture as its length (P7b), the text as before.
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`constructor() params=${JSON.stringify(commandArgsForLog(params))}`)
    }
    super(params)
    this.sendEmailCommandParams = JSON.parse(params[0]) as SendEmailCommandParams
  }

  /**
   * The command as the debug log writes it -- the executor and the factory write the command
   * whole (JSON.stringify): a chat message's picture as its length (P7b), in the arguments as they
   * came and in the parameters read from them.
   */
  toJSON(): Record<string, unknown> {
    return {
      params: commandArgsForLog(this.params),
      requiredFields: this.requiredFields,
      sendEmailCommandParams: this.paramsForLog(),
    }
  }

  private paramsForLog(): SendEmailCommandParams {
    return {
      ...this.sendEmailCommandParams,
      images: chatMessageImagesForLog(
        this.sendEmailCommandParams.images,
      ) as SendEmailCommandParams['images'],
    }
  }

  validate(): boolean {
    const baseValid = super.validate()
    if (!baseValid) {
      return false
    }
    // Additional validations

    return true
  }

  async execute(): Promise<string | boolean | null | Error> {
    const methodLogger = createLogger(`execute`)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`execute() sendEmailCommandParams=${JSON.stringify(this.paramsForLog())}`)
    }
    let result: string
    if (!this.validate()) {
      throw new Error('Invalid command parameters')
    }
    // P7b: the picture of a chat message is checked before anything is filed, the sender
    // included, as the sending server checked it; one this server refuses refuses the command.
    const pictures = this.acceptedPictures()
    // find sender user
    methodLogger.debug(
      `find sender user: ${this.sendEmailCommandParams.senderComUuid} ${this.sendEmailCommandParams.senderGradidoId}`,
    )
    const senderUser = await this.findSender()
    methodLogger.debug(`senderUser=${JSON.stringify(senderUser)}`)
    if (!senderUser) {
      const errmsg = `Sender user not found: ${this.sendEmailCommandParams.senderComUuid} ${this.sendEmailCommandParams.senderGradidoId}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }

    methodLogger.debug(
      `find recipient user: ${this.sendEmailCommandParams.receiverComUuid} ${this.sendEmailCommandParams.receiverGradidoId}`,
    )
    const recipientUser = await findUserByUuids(
      this.sendEmailCommandParams.receiverComUuid,
      this.sendEmailCommandParams.receiverGradidoId,
    )
    methodLogger.debug(`recipientUser=${JSON.stringify(recipientUser)}`)
    if (!recipientUser) {
      const errmsg = `Recipient user not found: ${this.sendEmailCommandParams.receiverComUuid} ${this.sendEmailCommandParams.receiverGradidoId}`
      methodLogger.error(errmsg)
      throw new Error(errmsg)
    }

    const emailParams = {
      firstName: recipientUser.firstName, // will be part of receiver
      lastName: recipientUser.lastName, // will be part of receiver
      email: recipientUser.emailContact.email, // will be part of receiver
      language: recipientUser.language,
      senderAlias: publicAlias(senderUser.alias, senderUser.gradidoID),
      // Both mails put a way back to the sender behind these; without them the templates
      // fall back to a send form with nobody in it. They were in hand here all along -
      // the command carries them as its own required fields - and simply never passed on.
      senderUuid: this.sendEmailCommandParams.senderGradidoId,
      senderCommunityUuid: this.sendEmailCommandParams.senderComUuid,
      subject: this.sendEmailCommandParams.subject || '',
      memo: this.sendEmailCommandParams.memo || '',
      transactionAmount: GradidoUnit.fromString(this.sendEmailCommandParams.amount || '0').abs(),
    }
    methodLogger.debug(`emailParams=${JSON.stringify(emailParams)}`)
    switch (this.sendEmailCommandParams.mailType) {
      case 'sendCustomEmail': {
        // The receiving copy of the chat, filed before it is mailed and never instead of it
        // (storeChatMessage does not throw). The pairs come from the rows just found, in the
        // spelling this server stores them in. A sender's uuid that is none is replaced, like
        // a missing one from an older server.
        const sentUuid = uuidv4Schema.safeParse(this.sendEmailCommandParams.messageUuid)
        const messageUuid = sentUuid.success ? sentUuid.data : randomUUID()
        const notify = parseChatMessageNotify(this.sendEmailCommandParams.notify)
        const letter = this.sendEmailCommandParams.notify === CHAT_MESSAGE_NOTIFY_LETTER
        const recipient = {
          communityUuid: recipientUser.communityUuid,
          gradidoId: recipientUser.gradidoID,
        }
        // P7b: the picture first, under the message's uuid, then the message -- as the sending
        // server filed its copy. A message with a picture that cannot be filed refuses the
        // command and is not mailed: the sender sees "not delivered" rather than a message that
        // lacks its picture over here (E-034). A picture a delivery of the same command filed
        // before is not taken out again.
        const [picture] = pictures
        let pictureFiledNow = false
        if (picture) {
          const filed = await storeIncomingChatMessageImage(messageUuid, picture)
          if (!filed.success) {
            throw new Error(
              filed.error === 'CONTRADICTION'
                ? 'CHAT_IMAGE_NOT_ACCEPTED: CONTRADICTION'
                : 'CHAT_MESSAGE_NOT_STORED',
            )
          }
          pictureFiledNow = filed.value === 'FILED'
        }
        const stored = await storeChatMessage(
          {
            messageUuid,
            sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
            recipient,
            subject: this.sendEmailCommandParams.subject || null,
            body: this.sendEmailCommandParams.memo || '',
            notify,
            deliveryState: 'delivered',
          },
          'incoming',
        )
        if (!stored && picture) {
          if (pictureFiledNow) {
            await removeChatMessageImages(messageUuid)
          }
          throw new Error('CHAT_MESSAGE_NOT_STORED')
        }
        // A chat message is mailed when the sender asked for it and the recipient has not muted
        // the conversation (E-024), read here, on the recipient's own server; a letter from the
        // form whatever the quiet (E-034). A message that could not be filed is mailed as before
        // the chat: the mail is then all the recipient gets of it, and without the conversation
        // there is no mute mark to read. The sender is answered which it was (E-034).
        const mutedAt = stored
          ? await readChatMemberMutedAt(stored.conversationId, recipient)
          : null
        let mailState = stored
          ? chatMessageMailState(notify, mutedAt, letter)
          : ChatMessageMailState.MAILED
        if (mailState === ChatMessageMailState.MAILED) {
          // The mail says there is a picture, and shows none (MAIL-008), as within a community.
          const emailResult = await sendCustomEmail({ ...emailParams, hasImage: Boolean(picture) })
          methodLogger.debug(`mailed: ${this.getEmailResult(emailResult)}`)
          // A mail that did not go out is not answered as one; the transport's report stays here.
          if (!chatMailWentOut(emailResult)) {
            mailState = null
          }
        } else {
          methodLogger.debug(`not mailed: message_uuid=${stored?.messageUuid}`)
        }
        result = sendMailCommandAnswerFor(mailState)
        break
      }
      case 'sendTransactionReceivedEmail': {
        const emailResult = await sendTransactionReceivedEmail(emailParams)
        methodLogger.debug(`mailed: ${this.getEmailResult(emailResult)}`)
        result = SEND_MAIL_COMMAND_ANSWER.RECEIVED
        break
      }
      default:
        throw new Error(`Unknown mail type: ${this.sendEmailCommandParams.mailType}`)
    }

    try {
      // Example: const result = await emailService.sendEmail(this.params);
      return result
    } catch (error) {
      methodLogger.error('Error executing SendEmailCommand:', error)
      throw error
    }
  }

  /**
   * The picture of a chat message (P7b), checked as the sending server checked it
   * (acceptIncomingChatMessageImages): one at most, named by a uuid, a JPEG within the limits --
   * and the message named by a uuid as well (NO_MESSAGE_UUID). A picture is filed under the uuid
   * the sending server filed its own copy under; with one made up here the two copies would not
   * share it, and a second delivery of the command would file the message and its picture again
   * (coderabbit on #4003). A message without a picture keeps the old way, a uuid of its own.
   *
   * ⛔ A picture refused here refuses the whole command -- nothing filed, nothing mailed. The
   * sending server checks the same before it sends, so a refusal is a bug or a forgery, and the
   * sender is to see "not delivered" rather than a message that lacks its picture over here
   * (E-034: the software says what happens).
   */
  private acceptedPictures(): ChatMessageImageToStore[] {
    const sentUuid = uuidv4Schema.safeParse(this.sendEmailCommandParams.messageUuid)
    const refuse = (reason: string): never => {
      createLogger(`acceptedPictures`).warn(
        `chat message picture refused: message_uuid=${sentUuid.success ? sentUuid.data : 'none'} (${reason})`,
      )
      throw new Error(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}`)
    }
    const accepted = acceptIncomingChatMessageImages(this.sendEmailCommandParams.images)
    if (!accepted.success) {
      return refuse(accepted.error)
    }
    if (accepted.value.length > 0 && !sentUuid.success) {
      return refuse('NO_MESSAGE_UUID')
    }
    return accepted.value
  }

  /**
   * The sender: the `users` row this server keeps for the member of another community the
   * command names by its pair.
   *
   * For a message (sendCustomEmail) a sender without a row is filed now (E-034). Until then only
   * a transfer filed one, and a message from somebody who had never sent Gradido here failed with
   * "Sender user not found". Filed the way the receiving side of a transfer files its sender
   * (federation's storeForeignUser): foreign, the pair, the alias where one came. An alias that
   * changed over there is brought up to date; one that did not come deletes nothing. What cannot
   * be filed leaves the sender unknown, and the command fails as it did before.
   *
   * Filed only for a pair of uuids whose community this server knows as a foreign one. A row
   * under this community's own uuid would take that alias away from this community's members
   * (`alias_key` is alias + community), and a lookup by alias here (findUserByIdentifier) would
   * find it.
   *
   * ⚠️ FÖD-14, accepted on purpose (Bernd, 25.09.2026): nothing here checks that
   * `senderComUuid` is the community that signed the command, so a server this one exchanged
   * keys with can file a row for a member of any community it names. Binding the sender to the
   * signer is Dario's fix, in the command frame, for every command at once.
   *
   * The mail about received Gradido files nobody: the transfer it is about filed its sender.
   */
  private async findSender(): Promise<DbUser | null> {
    const methodLogger = createLogger(`findSender`)
    const { mailType, senderComUuid, senderGradidoId, senderAlias } = this.sendEmailCommandParams
    const sender = await findUserByUuids(senderComUuid, senderGradidoId, true)
    if (mailType !== 'sendCustomEmail') {
      return sender
    }
    // An alias the column can hold, as the command gave it. The transfer does not check the
    // alias either; this keeps a value from another server out that would fail the write.
    const alias =
      typeof senderAlias === 'string' &&
      senderAlias.length > 0 &&
      senderAlias.length <= ALIAS_MAX_CHARS
        ? senderAlias
        : null
    try {
      if (sender) {
        if (alias !== null && sender.alias !== alias) {
          const updated = await dbUpdateForeignUserAlias(sender.id, alias)
          if (updated.success) {
            // The mail below names the sender by it.
            sender.alias = alias
          } else {
            methodLogger.warn(
              `sender's alias not updated: users.id=${sender.id} (${updated.error.name})`,
            )
          }
        }
        return sender
      }
      if (
        !uuidv4Schema.safeParse(senderComUuid).success ||
        !uuidv4Schema.safeParse(senderGradidoId).success ||
        (await getCommunityByUuid(senderComUuid))?.foreign !== true
      ) {
        return null
      }
      const filed = await dbInsertForeignUser({
        communityUuid: senderComUuid,
        gradidoId: senderGradidoId,
      })
      if (!filed.success) {
        methodLogger.warn(`sender not filed (${filed.error.name})`)
        return null
      }
      if (alias !== null) {
        const aliased = await dbUpdateForeignUserAlias(filed.value, alias)
        if (!aliased.success) {
          methodLogger.warn(
            `sender filed without alias: users.id=${filed.value} (${aliased.error.name})`,
          )
        }
      }
      methodLogger.info(`sender filed as a member of another community: users.id=${filed.value}`)
      return await findUserByUuids(senderComUuid, senderGradidoId, true)
    } catch (error) {
      methodLogger.error(`sender not filed or not updated (${databaseErrorCode(error)})`)
      return sender
    }
  }

  private getEmailResult(result: Record<string, unknown> | boolean | null | Error): string {
    const methodLogger = createLogger(`getEmailResult`)
    if (methodLogger.isDebugEnabled()) {
      methodLogger.debug(`result=${JSON.stringify(result)}`)
    }
    let emailResult: string
    if (result === null) {
      emailResult = `result is null`
    } else if (typeof result === 'boolean') {
      emailResult = `result is ${result}`
    } else if (result instanceof Error) {
      emailResult = `error-message is ${result.message}`
    } else if (typeof result === 'object') {
      // {"accepted":["stage5@gradido.net"],"rejected":[],"ehlo":["PIPELINING","SIZE 25600000","ETRN","AUTH DIGEST-MD5 CRAM-MD5 PLAIN LOGIN","ENHANCEDSTATUSCODES","8BITMIME","DSN","CHUNKING"],"envelopeTime":23,"messageTime":135,"messageSize":37478,"response":"250 2.0.0 Ok: queued as C45C2100BD7","envelope":{"from":"stage5@gradido.net","to":["stage5@gradido.net"]},"messageId":"<d269161f-f3d2-2c96-49c0-58154366271b@gradido.net>"
      const accepted = (result as Record<string, unknown>).accepted
      const messageSize = (result as Record<string, unknown>).messageSize
      const response = (result as Record<string, unknown>).response
      const envelope = JSON.stringify((result as Record<string, unknown>).envelope)
      emailResult = `accepted=${accepted}, messageSize=${messageSize}, response=${response}, envelope=${envelope}`
    } else {
      emailResult = `result is unknown type`
    }

    return emailResult
  }
}
