import { randomUUID } from 'node:crypto'
import { findUserByUuids } from 'database'
import { getLogger } from 'log4js'
import { GradidoUnit, publicAlias, uuidv4Schema } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendCustomEmail, sendTransactionReceivedEmail } from '../../emails/sendEmailVariants'
import {
  chatMailWanted,
  parseChatMessageNotify,
  readChatMemberMutedAt,
  storeChatMessage,
} from '../../logic/ChatMessage.logic'
import { BaseCommand } from '../BaseCommand'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.commands.SendEmailCommand.${method}`)

/**
 * What the command answers for a message, whether a mail went out or not.
 *
 * ⛔ The answer travels back: the sending server's command client asks for `data`, and it is
 * what execute() returns. So it must not depend on the mail. The transport's result would tell
 * the sending server whether the recipient muted the conversation (E-024: the sender learns
 * nothing about it), and more about the mail than is its business.
 */
export const CHAT_MESSAGE_RECEIVED = 'chat message received'

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
  // The sender's wish for a message (E-024): 'none' when they asked for no mail. Only that value
  // is sent; servers from before the chat send nothing, nor does the form "send an e-mail" --
  // and nothing means a mail (parseChatMessageNotify).
  notify?: string
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
    methodLogger.debug(`constructor() params=${JSON.stringify(params)}`)
    super(params)
    this.sendEmailCommandParams = JSON.parse(params[0]) as SendEmailCommandParams
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
    methodLogger.debug(
      `execute() sendEmailCommandParams=${JSON.stringify(this.sendEmailCommandParams)}`,
    )
    let result: string
    if (!this.validate()) {
      throw new Error('Invalid command parameters')
    }
    // find sender user
    methodLogger.debug(
      `find sender user: ${this.sendEmailCommandParams.senderComUuid} ${this.sendEmailCommandParams.senderGradidoId}`,
    )
    const senderUser = await findUserByUuids(
      this.sendEmailCommandParams.senderComUuid,
      this.sendEmailCommandParams.senderGradidoId,
      true,
    )
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
        const notify = parseChatMessageNotify(this.sendEmailCommandParams.notify)
        const recipient = {
          communityUuid: recipientUser.communityUuid,
          gradidoId: recipientUser.gradidoID,
        }
        const stored = await storeChatMessage(
          {
            messageUuid: sentUuid.success ? sentUuid.data : randomUUID(),
            sender: { communityUuid: senderUser.communityUuid, gradidoId: senderUser.gradidoID },
            recipient,
            subject: this.sendEmailCommandParams.subject || null,
            body: this.sendEmailCommandParams.memo || '',
            notify,
            deliveryState: 'delivered',
          },
          'incoming',
        )
        // Mailed when the sender asked for it and the recipient has not muted the conversation
        // (E-024), read here, on the recipient's own server. A message that could not be filed
        // is mailed as before the chat: the mail is then all the recipient gets of it, and
        // without the conversation there is no mute mark to read.
        const mutedAt = stored
          ? await readChatMemberMutedAt(stored.conversationId, recipient)
          : null
        if (!stored || chatMailWanted(notify, mutedAt)) {
          const emailResult = await sendCustomEmail(emailParams)
          methodLogger.debug(`mailed: ${this.getEmailResult(emailResult)}`)
        } else {
          methodLogger.debug(`not mailed: message_uuid=${stored.messageUuid}`)
        }
        result = CHAT_MESSAGE_RECEIVED
        break
      }
      case 'sendTransactionReceivedEmail': {
        const emailResult = await sendTransactionReceivedEmail(emailParams)
        result = this.getEmailResult(emailResult)
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
