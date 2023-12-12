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
      await backend.confirmTransaction(this.confirmedTransactionRole.getTransaction())
    } catch (error) {
      logger.error(error)
    }
  }
}
