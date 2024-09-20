import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY } from '@/data/const'
import { TransactionRepository } from '@/data/Transaction.repository'
import { CreateTransactionRecipeContext } from '@/interactions/backendToDb/transaction/CreateTransactionRecipe.context'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { InterruptiveSleepManager } from '@/manager/InterruptiveSleepManager'

import { TransactionErrorType } from '../enum/TransactionErrorType'
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
      const result = await createTransactionRecipeContext.run()
      if (!result) {
        return new TransactionResult(
          new TransactionError(
            TransactionErrorType.MISSING_PARAMETER,
            'cannot work with this parameters',
          ),
        )
      }
      const transactionRecipe = createTransactionRecipeContext.getTransactionRecipe()
      // check if a transaction with this signature already exist
      const existingRecipe = await TransactionRepository.findBySignature(
        transactionRecipe.signature,
      )
      if (existingRecipe) {
        return new TransactionResult(
          new TransactionError(
            TransactionErrorType.ALREADY_EXIST,
            'Transaction with same signature already exist',
          ),
        )
      } else {
        logger.debug('store transaction recipe', new TransactionLoggingView(transactionRecipe))
        // we store the transaction
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
