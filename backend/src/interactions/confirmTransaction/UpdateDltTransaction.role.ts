import { Transaction } from '@entity/Transaction'

import { ConfirmedTransactionInput } from '@/graphql/arg/ConfirmTransactionInput'
import { backendLogger as logger } from '@/server/logger'

export class UpdateDltTransactionRole {
  public constructor(private confirmedTransactionInput: ConfirmedTransactionInput) {}

  public async update(transaction: Transaction): Promise<void> {
    if (transaction.dltTransaction) {
      const dltTx = transaction.dltTransaction
      dltTx.verified = true
      dltTx.verifiedAt = new Date(this.confirmedTransactionInput.balanceDate)
      dltTx.messageId = this.confirmedTransactionInput.iotaMessageId
      await dltTx.save()
      logger.info('store messageId=%s in dltTx=%d', dltTx.messageId, dltTx.id)
    }
  }
}
