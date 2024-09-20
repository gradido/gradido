/* eslint-disable camelcase */
import { Transaction } from '@entity/Transaction'
import {
  CrossGroupType_INBOUND,
  CrossGroupType_LOCAL,
  CrossGroupType_OUTBOUND,
  InteractionDeserialize,
  MemoryBlock,
} from 'gradido-blockchain-js'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { LogError } from '@/server/LogError'
import { getDataSource } from '@/typeorm/DataSource'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipe.role'
import { InboundTransactionRecipeRole } from './InboundTransactionRecipe.role'
import { LocalTransactionRecipeRole } from './LocalTransactionRecipe.role'
import { OutboundTransactionRecipeRole } from './OutboundTransactionRecipeRole'

/**
 * @DCI-Context
 * Context for sending transaction recipe to iota
 * send every transaction only once to iota!
 */
export class TransmitToIotaContext {
  private transactionRecipeRole: AbstractTransactionRecipeRole

  public constructor(transaction: Transaction) {
    const deserializer = new InteractionDeserialize(new MemoryBlock(transaction.bodyBytes))
    deserializer.run()
    const transactionBody = deserializer.getTransactionBody()
    if (!transactionBody) {
      throw new TransactionError(
        TransactionErrorType.PROTO_DECODE_ERROR,
        'error decoding body bytes',
      )
    }
    switch (transactionBody.getType()) {
      case CrossGroupType_LOCAL:
        this.transactionRecipeRole = new LocalTransactionRecipeRole(transaction)
        break
      case CrossGroupType_INBOUND:
        this.transactionRecipeRole = new InboundTransactionRecipeRole(transaction)
        break
      case CrossGroupType_OUTBOUND:
        this.transactionRecipeRole = new OutboundTransactionRecipeRole(transaction)
        break
      default:
        throw new LogError('unknown cross group type', transactionBody.getType())
    }
  }

  public async run(): Promise<void> {
    const transaction = await this.transactionRecipeRole.transmitToIota()
    logger.debug('transaction sended via iota', new TransactionLoggingView(transaction))
    // store changes in db
    // prevent endless loop
    const pairingTransaction = transaction.pairingTransaction
    if (pairingTransaction) {
      transaction.pairingTransaction = undefined
      await getDataSource().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(transaction)
        await transactionalEntityManager.save(pairingTransaction)
      })
    } else {
      await transaction.save()
    }
    logger.info('sended transaction successfully updated in db')
  }
}
