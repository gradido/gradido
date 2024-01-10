import { ConfirmBackendTransaction } from '@/graphql/model/ConfirmBackendTransaction'

import { AbstractLoggingView } from './AbstractLogging.view'

export class ConfirmBackendTransactionView extends AbstractLoggingView {
  public constructor(private self: ConfirmBackendTransaction) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      transactionId: this.self.transactionId,
      iotaMessageId: this.self.iotaMessageId,
      gradidoId: this.self.gradidoId,
      balance: this.decimalToString(this.self.balance),
      balanceDate: this.self.balanceDate,
    }
  }
}
