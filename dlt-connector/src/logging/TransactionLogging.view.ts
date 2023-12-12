import { Transaction } from '@entity/Transaction'

import { getTransactionTypeEnumValue } from '@/graphql/enum/TransactionType'

import { AbstractLoggingView } from './AbstractLogging.view'
import { AccountLoggingView } from './AccountLogging.view'
import { CommunityLoggingView } from './CommunityLogging.view'

export class TransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: Transaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      id: this.self.id,
      nr: this.self.nr,
      backendTransactionId: this.self.backendTransactionId,
      bodyBytesLength: this.self.bodyBytes.length,
      createdAt: this.dateToString(this.self.createdAt),
      confirmedAt: this.dateToString(this.self.confirmedAt),
      protocolVersion: this.self.protocolVersion,
      type: getTransactionTypeEnumValue(this.self.type),
      signature:
        Buffer.from(this.self.signature).subarray(0, 31).toString(this.bufferStringFormat) + '..',
      community: new CommunityLoggingView(this.self.community).toJSON(),
      otherCommunity: this.self.otherCommunity
        ? new CommunityLoggingView(this.self.otherCommunity)
        : undefined,
      iotaMessageId: this.self.iotaMessageId
        ? Buffer.from(this.self.iotaMessageId).toString(this.bufferStringFormat)
        : undefined,
      signingAccount: this.self.signingAccount
        ? new AccountLoggingView(this.self.signingAccount)
        : undefined,
      recipientAccount: this.self.recipientAccount
        ? new AccountLoggingView(this.self.recipientAccount)
        : undefined,
      amount: this.decimalToString(this.self.amount),
      accountBalanceCreatedAt: this.decimalToString(this.self.accountBalanceCreatedAt),
      accountBalanceConfirmedAt: this.decimalToString(this.self.accountBalanceConfirmedAt),
      runningHash: this.self.runningHash
        ? Buffer.from(this.self.runningHash).toString(this.bufferStringFormat)
        : undefined,
      iotaMilestone: this.self.iotaMilestone,
    }
  }
}
