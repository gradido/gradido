import { Transaction } from '@entity/Transaction'

import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipe.role'

export class LocalTransactionRecipeRole extends AbstractTransactionRecipeRole {
  public getCrossGroupTypeName(): string {
    return 'LOCAL'
  }

  public async transmitToIota(): Promise<Transaction> {
    logger.debug(
      `transmit ${this.getCrossGroupTypeName()} transaction to iota`,
      new TransactionLoggingView(this.self),
    )
    this.self.iotaMessageId = await this.sendViaIota(
      this.validate(this.getGradidoTransactionBuilder()),
      this.self.community.iotaTopic,
    )
    return this.self
  }
}
