import { InvalidTransaction } from '@entity/InvalidTransaction'
import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { findByMessageId } from '@/controller/TransactionRecipe'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionRepository } from '@/data/Transaction.repository'
import { CreateTransactionRecipeContext } from '@/interactions/backendToDb/transaction/CreateTransationRecipe.context'
import { ConfirmTransactionsContext } from '@/interactions/gradidoNodeToDb/ConfirmTransactions.context'
import { logger } from '@/logging/logger'
import { TransactionDraftLoggingView } from '@/logging/TransactionDraftLogging.view'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { TransactionsManager } from '@/manager/TransactionsManager'

import { TransactionErrorType } from '../enum/TransactionErrorType'
import { ConfirmedTransactionInput } from '../input/ConfirmedTransactionInput'
import { InvalidTransactionInput } from '../input/InvalidTransactionInput'
import { TransactionError } from '../model/TransactionError'
import { TransactionRecipe } from '../model/TransactionRecipe'
import { TransactionResult } from '../model/TransactionResult'

@Resolver()
export class TransactionResolver {
  @Mutation(() => TransactionResult)
  async sendTransaction(
    @Arg('data')
    transactionDraft: TransactionDraft,
  ): Promise<TransactionResult> {
    logger.debug('sendTransaction', new TransactionDraftLoggingView(transactionDraft))
    const createTransactionRecipeContext = new CreateTransactionRecipeContext(transactionDraft)
    try {
      await createTransactionRecipeContext.run()
      const transactionRecipe = createTransactionRecipeContext.getTransactionRecipe()
      await transactionRecipe.save()
      return new TransactionResult(new TransactionRecipe(transactionRecipe))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('error with transaction from backend', error)
      if (error.code === 'ER_DUP_ENTRY') {
        const existingRecipe = await TransactionRepository.findBySignature(
          createTransactionRecipeContext.getTransactionRecipe().signature,
        )
        if (!existingRecipe) {
          throw new TransactionError(
            TransactionErrorType.LOGIC_ERROR,
            "recipe cannot be added because signature exist but couldn't load this existing receipt",
          )
        }
        return new TransactionResult(new TransactionRecipe(existingRecipe))
      }
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }

  // called from gradido node after a new block was confirmed
  @Mutation(() => TransactionResult)
  async newGradidoBlock(
    @Arg('data') { transactionBase64, iotaTopic }: ConfirmedTransactionInput,
  ): Promise<TransactionResult> {
    const transactionsManager = TransactionsManager.getInstance()
    if (!transactionsManager.isTopicExist(iotaTopic)) {
      return new TransactionResult(
        new TransactionError(TransactionErrorType.NOT_FOUND, 'topic not found'),
      )
    }
    try {
      logger.debug('transaction in base64', transactionBase64)
      const confirmedTransaction = ConfirmedTransaction.fromBase64(transactionBase64)
      logger.debug('confirmed Transaction from NodeServer', confirmedTransaction.toJSON())
      if (!transactionsManager.lockTopic(iotaTopic)) {
        transactionsManager.addPendingConfirmedTransaction(iotaTopic, confirmedTransaction)
        return new TransactionResult()
      } else {
        await new ConfirmTransactionsContext([confirmedTransaction], iotaTopic).run()
        transactionsManager.unlockTopic(iotaTopic)
      }
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      }
      logger.error('error on call newGradidoBlock', error)
      return new TransactionResult(
        new TransactionError(
          TransactionErrorType.LOGIC_ERROR,
          'not expected error, see dlt-connector log for further details',
        ),
      )
    } finally {
      transactionsManager.unlockTopic(iotaTopic)
    }
    return new TransactionResult()
  }

  @Mutation(() => TransactionResult)
  async failedGradidoBlock(
    @Arg('data') { iotaMessageId, errorMessage }: InvalidTransactionInput,
  ): Promise<TransactionResult> {
    const transactionReceipt = await findByMessageId(iotaMessageId)
    if (transactionReceipt) {
      logger.error(
        'invalid transaction',
        errorMessage,
        new TransactionLoggingView(transactionReceipt),
      )
    } else {
      logger.info("invalid transaction (but we haven't create it)", errorMessage, iotaMessageId)
    }
    const invalidTransaction = InvalidTransaction.create()
    invalidTransaction.iotaMessageId = Buffer.from(iotaMessageId, 'hex')
    invalidTransaction.errorMessage = errorMessage
    try {
      invalidTransaction.save()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code !== 'ER_DUP_ENTRY') {
        return new TransactionResult(
          new TransactionError(
            TransactionErrorType.DB_ERROR,
            'error by save invalidTransaction: ' + error,
          ),
        )
      }
    }
    return new TransactionResult()
  }
}
