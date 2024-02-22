import { Transaction } from '@entity/Transaction'

import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipe.role'

export class LocalTransactionRecipeRole extends AbstractTransactionRecipeRole {
  public async transmitToIota(): Promise<Transaction> {
    let transactionCrossGroupTypeName = 'LOCAL'
    if (this.transactionBody) {
      transactionCrossGroupTypeName = CrossGroupType[this.transactionBody.type]
    }
    logger.debug(
      `transmit ${transactionCrossGroupTypeName} transaction to iota`,
      new TransactionLoggingView(this.self),
    )
    this.self.iotaMessageId = await this.sendViaIota(
      this.getGradidoTransaction(),
      this.self.community.iotaTopic,
    )
    return this.self
  }
}
