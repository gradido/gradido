import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY } from '@/data/const'
import { TransactionRepository } from '@/data/Transaction.repository'
import { CreateTransactionRecipeContext } from '@/interactions/backendToDb/transaction/CreateTransactionRecipe.context'
import { BackendTransactionLoggingView } from '@/logging/BackendTransactionLogging.view'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { InterruptiveSleepManager } from '@/manager/InterruptiveSleepManager'
import { LogError } from '@/server/LogError'

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
    const createTransactionRecipeContext = new CreateTransactionRecipeContext(transactionDraft)
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
        backendTransaction.transactionId = transactionRecipe.id
        logger.debug(
          'store backendTransaction',
          new BackendTransactionLoggingView(backendTransaction),
        )
        await backendTransaction.save()
      } else {
        logger.debug('store transaction recipe', new TransactionLoggingView(transactionRecipe))
        // we can store the transaction and with that automatic the backend transaction
        await transactionRecipe.save()
      }
      InterruptiveSleepManager.getInstance().interrupt(TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY)
      return new TransactionResult(new TransactionRecipe(transactionRecipe))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }
}
