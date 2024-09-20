import { Transaction } from '@entity/Transaction'
import { MemoryBlock } from 'gradido-blockchain-js'

import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipe.role'

/**
 * Inbound Transaction on recipient community, mark the gradidos as received from another community
 * need to set gradido id from OUTBOUND transaction!
 */
export class InboundTransactionRecipeRole extends AbstractTransactionRecipeRole {
  public getCrossGroupTypeName(): string {
    return 'INBOUND'
  }

  public async transmitToIota(): Promise<Transaction> {
    logger.debug('transmit INBOUND transaction to iota', new TransactionLoggingView(this.self))
    const builder = this.getGradidoTransactionBuilder()
    const pairingTransaction = await new TransactionLogic(this.self).findPairTransaction()
    if (!pairingTransaction.iotaMessageId || pairingTransaction.iotaMessageId.length !== 32) {
      throw new LogError(
        'missing iota message id in pairing transaction, was it already send?',
        new TransactionLoggingView(pairingTransaction),
      )
    }
    builder.setParentMessageId(new MemoryBlock(pairingTransaction.iotaMessageId))
    this.self.pairingTransactionId = pairingTransaction.id
    this.self.pairingTransaction = pairingTransaction
    pairingTransaction.pairingTransactionId = this.self.id

    if (!this.self.otherCommunity) {
      throw new LogError('missing other community')
    }

    this.self.iotaMessageId = await this.sendViaIota(
      this.validate(builder),
      this.self.otherCommunity.iotaTopic,
    )
    return this.self
  }
}
