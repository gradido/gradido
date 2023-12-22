import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { TransactionRepository } from '@/data/Transaction.repository'
import { CreateTransactionRecipeContext } from '@/interactions/backendToDb/transaction/CreateTransationRecipe.context'
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
        await backendTransaction.save()
      } else {
        // we can store the transaction and with that automatic the backend transaction
        await transactionRecipe.save()
      }
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
