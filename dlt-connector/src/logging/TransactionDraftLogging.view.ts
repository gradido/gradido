import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { UserIdentifierLoggingView } from './UserIdentifierLogging.view'

export class TransactionDraftLoggingView extends AbstractLoggingView {
  public constructor(private self: TransactionDraft) {
    super()
  }

  public toJSON() {
    return {
      senderUser: new UserIdentifierLoggingView(this.self.senderUser).toJSON(),
      recipientUser: new UserIdentifierLoggingView(this.self.recipientUser).toJSON(),
      backendTransactionId: this.self.backendTransactionId,
      amount: this.decimalToString(this.self.amount),
      type: getEnumValue(InputTransactionType, this.self.type),
      createdAt: this.self.createdAt,
      targetDate: this.self.targetDate,
    }
  }
}
