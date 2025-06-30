import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
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
      linkedUser:
        this.self.linkedUser instanceof UserIdentifier
          ? new UserIdentifierLoggingView(this.self.linkedUser).toJSON()
          : 'seed',
      amount: Number(this.self.amount),
      type: getEnumValue(InputTransactionType, this.self.type),
      createdAt: this.self.createdAt,
      targetDate: this.self.targetDate,
    }
  }
}
