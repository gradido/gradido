import { BackendTransaction } from '@entity/BackendTransaction'

import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { getEnumValue } from '@/utils/typeConverter'

import { AbstractLoggingView } from './AbstractLogging.view'
import { TransactionLoggingView } from './TransactionLogging.view'

export class BackendTransactionLoggingView extends AbstractLoggingView {
  public constructor(private self: BackendTransaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(showTransaction = true): any {
    return {
      id: this.self.id,
      backendTransactionId: this.self.backendTransactionId,
      transaction:
        showTransaction && this.self.transaction
          ? new TransactionLoggingView(this.self.transaction).toJSON(false)
          : undefined,
      type: getEnumValue(InputTransactionType, this.self.typeId),
      balance: this.decimalToString(this.self.balance),
      createdAt: this.dateToString(this.self.createdAt),
      confirmedAt: this.dateToString(this.self.confirmedAt),
      verifiedOnBackend: this.self.verifiedOnBackend,
    }
  }
}
