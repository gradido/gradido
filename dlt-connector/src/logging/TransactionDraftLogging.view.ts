import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { UserIdentifierLoggingView } from './UserIdentifierLogging.view'

export class TransactionDraftLoggingView extends AbstractLoggingView {
  public constructor(private self: TransactionDraft) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      user: new UserIdentifierLoggingView(this.self.user).toJSON(),
      linkedUser: new UserIdentifierLoggingView(this.self.linkedUser).toJSON(),
      backendTransactionId: this.self.backendTransactionId,
      amount: Number(this.self.amount),
      type: getEnumValue(InputTransactionType, this.self.type),
      createdAt: this.self.createdAt,
      targetDate: this.self.targetDate,
    }
  }
}
