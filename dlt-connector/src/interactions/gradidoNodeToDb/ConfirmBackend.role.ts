import { BackendClient } from '@/client/BackendClient'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'

export class ConfirmBackendRole extends AbstractConfirm {
  public async confirm(): Promise<void> {
    const backend = BackendClient.getInstance()
    if (!backend) {
      throw new LogError('error instancing backend client')
    }
    try {
      const transaction = this.confirmedTransactionRole.getTransaction()
      if (transaction.backendTransactions.length === 0) {
        logger.info('missing backend transactions for confirming transaction at backend')
        return
      }
      for (const backendTransaction of transaction.backendTransactions) {
        await backend.confirmTransaction(transaction, backendTransaction)
      }
    } catch (error) {
      logger.error(error)
    }
  }
}
