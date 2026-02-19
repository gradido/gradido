import { findUserByUuids } from 'database'
import Decimal from 'decimal.js-light'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { sendTransactionReceivedEmail } from '../../emails/sendEmailVariants'
import { BaseCommand } from '../BaseCommand'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.commands.SendEmailCommand.${method}`)

export interface SendEmailCommandParams {
  mailType: string
  senderComUuid: string
  senderGradidoId: string
  receiverComUuid: string
  receiverGradidoId: string
  memo?: string
  amount?: string
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
      firstName: recipientUser.firstName,
      lastName: recipientUser.lastName,
      email: recipientUser.emailContact.email,
      language: recipientUser.language,
      senderFirstName: senderUser.firstName,
      senderLastName: senderUser.lastName,
      senderEmail: senderUser.emailId !== null ? senderUser.emailContact.email : null,
      memo: this.sendEmailCommandParams.memo || '',
      transactionAmount: new Decimal(this.sendEmailCommandParams.amount || 0).abs(),
    }
    methodLogger.debug(`emailParams=${JSON.stringify(emailParams)}`)
    switch (this.sendEmailCommandParams.mailType) {
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
