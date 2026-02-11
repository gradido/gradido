import { BaseCommand } from '../BaseCommand';
import { sendTransactionReceivedEmail } from '../../emails/sendEmailVariants';
import { findForeignUserByUuids, findUserByIdentifier } from 'database';
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const';
import { getLogger } from 'log4js';
import Decimal from 'decimal.js-light';

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.commands.SendEmailCommand.${method}`)

export interface SendEmailCommandParams {
  mailType: string;
  senderComUuid: string;
  senderGradidoId: string;
  receiverComUuid: string;
  receiverGradidoId: string;
  memo?: string;
  amount?: string;
}
export class SendEmailCommand extends BaseCommand<{ success: boolean }> {
  static readonly SEND_MAIL_COMMAND = 'SEND_MAIL_COMMAND';
  protected requiredFields: string[] = ['mailType', 'senderComUuid', 'senderGradidoId', 'receiverComUuid', 'receiverGradidoId'];
  protected sendEmailCommandParams: SendEmailCommandParams;

  constructor(params: SendEmailCommandParams) {
    const methodLogger = createLogger(`constructor`)
    methodLogger.debug(`constructor() params=${JSON.stringify(params)}`)
    super(params);
    this.sendEmailCommandParams = params;
  }

  validate(): boolean {
    const baseValid = super.validate();
    if (!baseValid) {
      return false;
    }
    // Additional validations

    return true;
  }

  async execute(): Promise<{ success: boolean }> {
    const methodLogger = createLogger(`execute`)
    if (!this.validate()) {
      throw new Error('Invalid command parameters');
    }
    // find sender user
    methodLogger.debug(`find sender user: ${this.sendEmailCommandParams.senderComUuid} ${this.sendEmailCommandParams.senderGradidoId}`)
    const senderUser = await findForeignUserByUuids(this.sendEmailCommandParams.senderComUuid, this.sendEmailCommandParams.senderGradidoId);
    methodLogger.debug(`senderUser=${JSON.stringify(senderUser)}`)
    if (!senderUser) {
      const errmsg = `Sender user not found: ${this.sendEmailCommandParams.senderComUuid} ${this.sendEmailCommandParams.senderGradidoId}`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);
    }
    
    methodLogger.debug(`find recipient user: ${this.sendEmailCommandParams.receiverComUuid} ${this.sendEmailCommandParams.receiverGradidoId}`)
    const recipientUser = await findUserByIdentifier(this.sendEmailCommandParams.receiverGradidoId, this.sendEmailCommandParams.receiverComUuid);
    methodLogger.debug(`recipientUser=${JSON.stringify(recipientUser)}`)
    if (!recipientUser) {
      const errmsg = `Recipient user not found: ${this.sendEmailCommandParams.receiverComUuid} ${this.sendEmailCommandParams.receiverGradidoId}`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);
    }
    
    const emailParams = {
      firstName: recipientUser.firstName,
      lastName: recipientUser.lastName,
      email: recipientUser.emailContact.email,
      language: recipientUser.language,
      senderFirstName: senderUser.firstName,
      senderLastName: senderUser.lastName,
      senderEmail: 'transactionReceivedNoSender',
      memo: this.sendEmailCommandParams.memo || '',
      transactionAmount: new Decimal(this.sendEmailCommandParams.amount || 0),
    };
    switch(this.sendEmailCommandParams.mailType) {
      case 'sendTransactionReceivedEmail':
        await sendTransactionReceivedEmail(emailParams);
        break;
      default:
        throw new Error(`Unknown mail type: ${this.sendEmailCommandParams.mailType}`);
    }
    
    try {
      // Example: const result = await emailService.sendEmail(this.params);
      return { success: true };
    } catch (error) {
      methodLogger.error('Error executing SendEmailCommand:', error);
      throw error;
    }
  }
}