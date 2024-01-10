import { Transaction } from '@entity/Transaction'

import { DltTransactionRepository } from '@/data/DltTransaction.repository'
import { TransactionRepository } from '@/data/Transaction.repository'
import { ConfirmedTransactionInput } from '@/graphql/arg/ConfirmTransactionInput'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { CompareTransactionRole } from './CompareTransaction.role'
import { UpdateDltTransactionRole } from './UpdateDltTransaction.role'

export class ConfirmTransactionContext {
  public constructor(private confirmedTransactionInput: ConfirmedTransactionInput) {}

  public async run(): Promise<void> {
    logger.debug('confirmTransaction', this.confirmedTransactionInput)
    const transaction = await this.loadTransactionFromDb()
    // check
    // throw on error
    new CompareTransactionRole(this.confirmedTransactionInput).verify(transaction)
    // update, store updated entity in db
    await new UpdateDltTransactionRole(this.confirmedTransactionInput).update(transaction)
  }

  /**
   * load transaction by iota message id or transaction id
   */
  protected async loadTransactionFromDb(): Promise<Transaction> {
    let transaction: Transaction | null = null
    if (this.confirmedTransactionInput.transactionId) {
      transaction = await TransactionRepository.findOneByIdWithRelations(
        this.confirmedTransactionInput.transactionId,
        { dltTransaction: true },
      )
    } else if (this.confirmedTransactionInput.iotaMessageId) {
      const dltTransaction = await DltTransactionRepository.findOneByMessageIdWithRelations(
        this.confirmedTransactionInput.iotaMessageId,
        { transaction: true },
      )
      if (dltTransaction?.transaction) {
        transaction = dltTransaction.transaction
        transaction.dltTransaction = dltTransaction
        // prevent recursion
        transaction.dltTransaction.transaction = undefined
      }
    }
    if (!transaction) {
      throw new LogError('transaction not found', {
        id: this.confirmedTransactionInput.transactionId,
        messageId: this.confirmedTransactionInput.iotaMessageId,
      })
    }
    return transaction
  }
}
