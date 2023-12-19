import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { TransactionRepository } from '@/data/Transaction.repository'
import { CreateTransactionRecipeContext } from '@/interactions/backendToDb/transaction/CreateTransationRecipe.context'

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
      await createTransactionRecipeContext.run()
      const transactionRecipe = createTransactionRecipeContext.getTransactionRecipe()
      await transactionRecipe.save()
      return new TransactionResult(new TransactionRecipe(transactionRecipe))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
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
}
