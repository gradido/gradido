import { Transaction } from '@entity/Transaction'

import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { LogError } from '@/server/LogError'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { AccountLoggingView } from './AccountLogging.view'
import { CommunityLoggingView } from './CommunityLogging.view'

export class TransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: Transaction) {
    super()
    if (this.self.community === undefined) {
      throw new LogError('sender community is zero')
    }
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
      type: getEnumValue(TransactionType, this.self.type),
      signature: this.self.signature.subarray(0, 31).toString(this.bufferStringFormat) + '..',
      community: new CommunityLoggingView(this.self.community).toJSON(),
      otherCommunity: this.self.otherCommunity
        ? new CommunityLoggingView(this.self.otherCommunity)
        : undefined,
      iotaMessageId: this.self.iotaMessageId
        ? this.self.iotaMessageId.toString(this.bufferStringFormat)
        : undefined,
      signingAccount: this.self.signingAccount
        ? new AccountLoggingView(this.self.signingAccount)
        : undefined,
      recipientAccount: this.self.recipientAccount
        ? new AccountLoggingView(this.self.recipientAccount)
        : undefined,
      amount: this.decimalToString(this.self.amount),
      accountBalanceOnCreation: this.decimalToString(this.self.accountBalanceOnCreation),
      accountBalanceOnConfirmation: this.decimalToString(this.self.accountBalanceOnConfirmation),
      runningHash: this.self.runningHash
        ? this.self.runningHash.toString(this.bufferStringFormat)
        : undefined,
      iotaMilestone: this.self.iotaMilestone,
    }
  }
}
