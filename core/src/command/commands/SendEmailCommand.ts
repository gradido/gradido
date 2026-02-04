import { BaseCommand } from '../BaseCommand';
import { sendTransactionReceivedEmail } from '../../emails/sendEmailVariants';
import { findForeignUserByUuids, findUserByIdentifier } from 'database';
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const';
import { getLogger } from 'log4js';

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.CommandExecutor.${method}`)

export class SendEmailCommand extends BaseCommand<{ success: boolean }> {
  static readonly SEND_MAIL_COMMAND = 'SEND_MAIL_COMMAND';
  protected requiredFields: string[] = ['mailType', 'senderComUuid', 'senderGradidoId', 'receiverComUuid', 'receiverGradidoId'];

  constructor(params: { 
    mailType: string,
    senderComUuid: string,
    senderGradidoId: string,
    receiverComUuid: string,
    receiverGradidoId: string,
    memo?: string,
    amount?: number,
  }) {
    super(params);
  }

  validate(): boolean {
    const baseValid = super.validate();
    if (!baseValid) {
      return false;
    }
    return true;
  }

  async execute(): Promise<{ success: boolean }> {
    const methodLogger = createLogger(`execute`)
    if (!this.validate()) {
      throw new Error('Invalid command parameters');
    }
    // find sender user
    const senderUser = await findForeignUserByUuids(this.params.senderComUuid, this.params.senderGradidoId);
    if (!senderUser) {
      const errmsg = `Sender user not found: ${this.params.senderComUuid} ${this.params.senderGradidoId}`;
      methodLogger.error(errmsg);
      throw new Error(errmsg);
    }
    const recipientUser = await findUserByIdentifier(this.params.receiverGradidoId, this.params.receiverComUuid);
    if (!recipientUser) {
      const errmsg = `Recipient user not found: ${this.params.receiverComUuid} ${this.params.receiverGradidoId}`;
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
      senderEmail: senderUser.emailContact?.email,
      memo: this.params.memo || '',
      transactionAmount: this.params.amount || 0,
    };
    switch(this.params.mailType) {
      case 'sendTransactionReceivedEmail':
        await sendTransactionReceivedEmail(emailParams);
        break;
      default:
        throw new Error(`Unknown mail type: ${this.params.mailType}`);
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