/**
 * @DCI-Context
 * Context for process confirmed transactions from node server
 *  - complete transactions in db
 *  - add missing transactions in db
 *  - add missing user in db
 *  - add missing accounts in db
 *  - update account balances
 *  - update transaction balances
 *  - trigger backend for verify
 */

import { TransactionRepository } from '@/data/Transaction.repository'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { logger } from '@/server/logger'
import { TransactionRecipeRole } from './TransactionRecipe.role'
import { LogError } from '@/server/LogError'
import { BackendClient } from '@/client/BackendClient'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionRecipe } from '@entity/TransactionRecipe'

export class ConfirmTransactionsContext {
  // confirmed transactions put into map with message id (hex) as key for faster work access
  private transactionsByMessageId: Map<string, ConfirmedTransaction>

  public constructor(private transactions: ConfirmedTransaction[], private iotaTopic: string) {
    // create map with message ids as key
    this.transactionsByMessageId = transactions.reduce((messageIdMap, transaction) => {
      return messageIdMap.set(Buffer.from(transaction.messageId).toString('hex'), transaction)
    }, new Map<string, ConfirmedTransaction>())
  }

  /**
   * load already existing transactions from db and filter out message ids from not loaded transactions
   * @param messageIdsHex
   * @returns {existingTransactionRoles: TransactionRecipeRole[], missingMessageIdsHex: string[]}
   */
  private async findExistingTransactionRecipeAndMissingMessageIds(
    messageIdsHex: string[],
  ): Promise<{
    existingTransaction: TransactionRecipeRole[]
    missingMessageIdsHex: string[]
  }> {
    logger.info('load transaction recipes for iota message ids:', messageIdsHex)
    const existingTransactions = await TransactionRepository.findExistingTransactions(messageIdsHex)
    const foundMessageIds = existingTransactions
      .map((transaction) => transaction.iotaMessageId?.toString('hex'))
      .filter((messageId) => !!messageId)
    // find message ids for which we don't already have a transaction recipe
    const missingMessageIdsHex = messageIdsHex.filter((id: string) => !foundMessageIds.includes(id))
    return {
      existingTransaction: existingTransactions.map(
        (transaction) => new TransactionRecipeRole(transaction),
      ),
      missingMessageIdsHex,
    }
  }

  private async createMissingTransactionRecipe(
    messageIdHex: string,
  ): Promise<TransactionRecipeRole> {
    const confirmedTransaction = this.transactionsByMessageId.get(messageIdHex)
    if (!confirmedTransaction) {
      throw new LogError('transaction for message id not longer exist')
    }
    const recipe = await TransactionRecipeRole.createFromGradidoTransaction(
      confirmedTransaction.transaction,
    )
    if (
      confirmedTransaction.transaction.parentMessageId &&
      confirmedTransaction.transaction.parentMessageId.length === 32
    ) {
      throw new LogError(
        'cross group paring transaction found, please add code for handling it properly!',
      )
    }
    recipe.setIotaMessageId(messageIdHex)
    return recipe
  }

  public async run(): Promise<void> {
    if (!this.transactions.length) {
      return
    }

    let { existingTransaction, missingMessageIdsHex } =
      await this.findExistingTransactionRecipeAndMissingMessageIds(
        Array.from(this.transactionsByMessageId.keys()),
      )
    const newTransactions = await Promise.all(
      missingMessageIdsHex.map(this.createMissingTransactionRecipe),
    )
    let allTransactionRecipe: TransactionRecipeRole[] = []
    try {
      // remove all confirmed transactions from array
      existingTransaction = existingTransaction.filter(
        (transaction: TransactionRecipeRole) => !transaction.isAlreadyConfirmed(),
      )
      // fuse arrays together
      allTransactionRecipe = existingTransaction.concat(newTransactions)

      const backend = BackendClient.getInstance()
      if (!backend) {
        throw new LogError('error instancing backend client')
      }
      const confirmedTransactionEntities = await Promise.all(
        allTransactionRecipe.map(async (transaction: TransactionRecipeRole) => {
          const confirmedTransaction = this.transactionsByMessageId.get(
            transaction.getIotaMessageIdHex(),
          )
          if (!confirmedTransaction) {
            throw new LogError('transaction for message id not longer exist')
          }
          // confirm backend
          const confirmedTransactionEntity = create(
            confirmedTransaction,
            new TransactionRecipe(recipe),
          )
          if (
            [
              TransactionType.GRADIDO_CREATION,
              TransactionType.GRADIDO_TRANSFER,
              TransactionType.GRADIDO_DEFERRED_TRANSFER,
            ].includes(recipe.type)
          ) {
            try {
              await backend.confirmTransaction(confirmedTransactionEntity)
            } catch (error) {
              logger.error(error)
            }
          }
          return confirmedTransactionEntity
        }),
      )
      await ConfirmedTransactionEntity.save(confirmedTransactionEntities)
      logger.info('saved confirmed transactions', confirmedTransactionEntities.length)
    } catch (error) {
      throw new LogError('Error saving new recipes or confirmed transactions', error)
    }
  }
}
