import { InvalidTransaction } from '@entity/InvalidTransaction'
import { TransactionDraft } from '@input/TransactionDraft'
import { Resolver, Arg, Mutation } from 'type-graphql'

import { findByMessageId } from '@/controller/TransactionRecipe'
import { BackendTransactionRepository } from '@/data/BackendTransaction.repository'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionLogic } from '@/data/Transaction.logic'
import { TransactionRepository } from '@/data/Transaction.repository'
import { CreateTransactionRecipeContext } from '@/interactions/backendToDb/transaction/CreateTransationRecipe.context'
import { ConfirmTransactionsContext } from '@/interactions/gradidoNodeToDb/ConfirmTransactions.context'
import { BackendTransactionLoggingView } from '@/logging/BackendTransactionLogging.view'
import { ConfirmedTransactionLoggingView } from '@/logging/ConfirmedTransactionLogging.view'
import { logger } from '@/logging/logger'
import { TransactionDraftLoggingView } from '@/logging/TransactionDraftLogging.view'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { TransactionsManager } from '@/manager/TransactionsManager'
import { LogError } from '@/server/LogError'

import { TransactionErrorType } from '../enum/TransactionErrorType'
import { ConfirmedTransactionInput } from '../input/ConfirmedTransactionInput'
import { InvalidTransactionInput } from '../input/InvalidTransactionInput'
import { ConfirmBackendTransaction } from '../model/ConfirmBackendTransaction'
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
    let transactionRecipeOutput: TransactionRecipe | undefined
    // check if backend transaction id was already stored in db
    const existingBackendTransaction = await BackendTransactionRepository.getByBackendTransactionId(
      transactionDraft.backendTransactionId,
      {
        transaction: {
          signingAccount: { user: true },
          recipientAccount: { user: true },
        },
      },
    )
    if (existingBackendTransaction) {
      // transaction was already confirmed, so we can tell backend the confirmation information's directly
      logger.debug(
        'transaction was already sended',
        new BackendTransactionLoggingView(existingBackendTransaction).toJSON(),
      )
      if (new TransactionLogic(existingBackendTransaction.transaction).isConfirmed()) {
        return new TransactionResult(
          new ConfirmBackendTransaction(
            existingBackendTransaction.transaction,
            existingBackendTransaction,
          ),
        )
      } else {
        return new TransactionResult(new TransactionRecipe(existingBackendTransaction.transaction))
      }
    }
    try {
      await createTransactionRecipeContext.run()
      const transactionRecipe = createTransactionRecipeContext.getTransactionRecipe()
      // check if a transaction with this signature already exist
      const existingRecipe = await TransactionRepository.findBySignature(
        transactionRecipe.signature,
      )
      if (existingRecipe) {
        // transaction recipe with this signature already exist, we need only to store the backendTransaction
        if (transactionRecipe.backendTransactions.length !== 1) {
          throw new LogError('unexpected backend transaction count', {
            count: transactionRecipe.backendTransactions.length,
            transactionId: transactionRecipe.id,
          })
        }
        const backendTransaction = transactionRecipe.backendTransactions[0]
        backendTransaction.transactionId = existingRecipe.id
        await backendTransaction.save()
        transactionRecipeOutput = new TransactionRecipe(existingRecipe)
      } else {
        // we can store the transaction and with that automatic the backend transaction
        await transactionRecipe.save()
        transactionRecipeOutput = new TransactionRecipe(transactionRecipe)
      }
      return new TransactionResult(transactionRecipeOutput)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
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
      logger.debug(
        'confirmed Transaction from NodeServer',
        new ConfirmedTransactionLoggingView(confirmedTransaction).toJSON(),
      )
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
    const iotaMessageIdBuffer = Buffer.from(iotaMessageId, 'hex')
    const existingInvalidTransaction = await InvalidTransaction.findBy({
      iotaMessageId: iotaMessageIdBuffer,
    })
    if (existingInvalidTransaction) {
      logger.info('invalid transaction already exist', iotaMessageId)
      return new TransactionResult()
    }
    const transactionReceipt = await TransactionRepository.findByMessageId(iotaMessageId)
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
