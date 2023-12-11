import { Transaction } from '@entity/Transaction'

import { getTransactionTypeEnumValue } from '@/graphql/enum/TransactionType'

import { AbstractLoggingView } from './AbstractLogging.view'
import { AccountLoggingView } from './AccountLogging.view'
import { CommunityLoggingView } from './CommunityLogging.view'

export class TransactionLoggingView extends AbstractLoggingView {
  public constructor(private transaction: Transaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.transaction.id,
      nr: this.transaction.nr,
      backendTransactionId: this.transaction.backendTransactionId,
      bodyBytes: this.transaction.bodyBytes.length,
      createdAt: this.dateToString(this.transaction.createdAt),
      confirmedAt: this.dateToString(this.transaction.confirmedAt),
      protocolVersion: this.transaction.protocolVersion,
      type: getTransactionTypeEnumValue(this.transaction.type),
      signature: this.transaction.signature.toString(this.bufferStringFormat),
      community: new CommunityLoggingView(this.transaction.community).toJSON(),
      otherCommunity: this.transaction.otherCommunity 
        ? new CommunityLoggingView(this.transaction.otherCommunity)
        : null,
      iotaMessageId: this.transaction.iotaMessageId?.toString(this.bufferStringFormat),
      signingAccount: this.transaction.signingAccount
        ? new AccountLoggingView(this.transaction.signingAccount)
        : null,
      recipientAccount: this.transaction.recipientAccount
        ? new AccountLoggingView(this.transaction.recipientAccount)
        : null,
      amount: this.decimalToString(this.transaction.amount),
      accountBalanceCreatedAt: this.decimalToString(this.transaction.accountBalanceCreatedAt),
      accountBalanceConfirmedAt: this.decimalToString(this.transaction.accountBalanceConfirmedAt),
      runningHash: this.transaction.runningHash?.toString(this.bufferStringFormat),
      iotaMilestone: this.transaction.iotaMilestone,
    }
  }
}
