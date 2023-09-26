import { ConfirmedTransaction } from '@/proto/3_3/ConfirmedTransaction'
import { In } from '@dbTools/typeorm'
import { ConfirmedTransaction as ConfirmedTransactionEntity } from '@entity/ConfirmedTransaction'
import { TransactionRecipe as TransactionRecipeEntity } from '@entity/TransactionRecipe'
import { TransactionRecipe } from './TransactionRecipe'
import { LogError } from '@/server/LogError'
import Decimal from 'decimal.js-light'
import { timestampSecondsToDate } from '@/utils/typeConverter'

export const create = (
  confirmedTransactionProto: ConfirmedTransaction,
  transactionRecipe: TransactionRecipe,
): ConfirmedTransactionEntity => {
  const confirmedTransaction = ConfirmedTransactionEntity.create()
  confirmedTransaction.transactionRecipe = transactionRecipe.getTransactionRecipeEntity()
  confirmedTransaction.nr = confirmedTransactionProto.id
  confirmedTransaction.runningHash = confirmedTransactionProto.runningHash
  const balanceAccount = transactionRecipe.getBalanceAccount()
  if (balanceAccount === undefined) {
    throw new LogError('something went wrong with balance account')
  }
  if (balanceAccount) {
    confirmedTransaction.account = balanceAccount
    confirmedTransaction.accountBalance = new Decimal(confirmedTransactionProto.accountBalance)
  }
  confirmedTransaction.confirmedAt = timestampSecondsToDate(confirmedTransactionProto.confirmedAt)
  return confirmedTransaction
}

export const confirmFromNodeServer = async (
  transactions: ConfirmedTransaction[],
): Promise<void> => {
  // create map with message ids as key
  const sortByMessageId = transactions.reduce((messageIdMap, transaction) => {
    return messageIdMap.set(transaction.messageId, transaction)
  }, new Map<Buffer, ConfirmedTransaction>())
  const messageIDs = Array.from(sortByMessageId.keys())
  // load transactionRecipes for message ids
  const transactionRecipes = await TransactionRecipeEntity.find({
    where: { iotaMessageId: In(messageIDs) },
  })
  const foundMessageIds = transactionRecipes
    .map((recipe) => recipe.iotaMessageId)
    .filter((messageId) => !!messageId)
  // find message ids for which we don't already have a transaction recipe
  const missingMessageIds = messageIDs.filter((id) => !foundMessageIds.includes(id))
  const newRecipes = missingMessageIds.map((messageId: Buffer) => {
    const confirmedTransaction = sortByMessageId.get(messageId)
    if (!confirmedTransaction) {
      throw new LogError('transaction for message id not longer exist')
    }
    const recipe = TransactionRecipe.create(confirmedTransaction.transaction)
    const recipeEntity = recipe.getTransactionRecipeEntity()
    if (confirmedTransaction.transaction.parentMessageId) {
      throw new LogError(
        'cross group paring transaction found, please add code for handling it properly!',
      )
    }
    recipeEntity.iotaMessageId = messageId
    return recipe
  })
  // save new transaction recipes
  const storedRecipes = await TransactionRecipeEntity.save(
    newRecipes.map((recipe: TransactionRecipe) => recipe.getTransactionRecipeEntity()),
  )
  // create new confirmed transaction entities from new recipes
  const newConfirmedTransactions = storedRecipes.map((recipe: TransactionRecipeEntity) => {
    if (!recipe.iotaMessageId) {
      throw new LogError('missing iota message id')
    }
    const confirmedTransaction = sortByMessageId.get(recipe.iotaMessageId)
    if (!confirmedTransaction) {
      throw new LogError('transaction for message id not longer exist')
    }
    return create(confirmedTransaction, new TransactionRecipe(recipe))
  })
  await ConfirmedTransactionEntity.save(newConfirmedTransactions)

  // ConfirmedTransactionEntity.find({ where: { } })
}
