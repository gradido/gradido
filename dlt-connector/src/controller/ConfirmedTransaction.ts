import { ConfirmedTransaction } from '@/proto/3_3/ConfirmedTransaction'
import { In } from '@dbTools/typeorm'
import { ConfirmedTransaction as ConfirmedTransactionEntity } from '@entity/ConfirmedTransaction'
import { TransactionRecipe as TransactionRecipeEntity } from '@entity/TransactionRecipe'
import { TransactionRecipe } from './TransactionRecipe'
import { LogError } from '@/server/LogError'
import Decimal from 'decimal.js-light'
import { timestampSecondsToDate } from '@/utils/typeConverter'
import { logger } from '@/server/logger'

export const create = (
  confirmedTransactionProto: ConfirmedTransaction,
  transactionRecipe: TransactionRecipe,
): ConfirmedTransactionEntity => {
  const confirmedTransaction = ConfirmedTransactionEntity.create()
  confirmedTransaction.transactionRecipe = transactionRecipe.getTransactionRecipeEntity()
  confirmedTransaction.nr = confirmedTransactionProto.id
  confirmedTransaction.runningHash = Buffer.from(confirmedTransactionProto.runningHash)
  const balanceAccount = transactionRecipe.getBalanceAccount()
  if (balanceAccount === undefined) {
    throw new LogError('something went wrong with balance account')
  }
  if (balanceAccount) {
    confirmedTransaction.account = balanceAccount
  }
  confirmedTransaction.accountBalance = new Decimal(confirmedTransactionProto.accountBalance)
  confirmedTransaction.confirmedAt = timestampSecondsToDate(confirmedTransactionProto.confirmedAt)
  return confirmedTransaction
}

export const confirmFromNodeServer = async (
  transactions: ConfirmedTransaction[],
): Promise<void> => {
  // create map with message ids as key
  const sortByMessageId = transactions.reduce((messageIdMap, transaction) => {
    return messageIdMap.set(Buffer.from(transaction.messageId).toString('hex'), transaction)
  }, new Map<string, ConfirmedTransaction>())
  const messageIDsHex: string[] = []
  for (let key of sortByMessageId.keys()) {
    messageIDsHex.push(key)
  }
  console.log('messageIDs: %o', messageIDsHex)
  // load transactionRecipes for message ids
  logger.info('load transaction recipes for iota message ids:', messageIDsHex)
  const transactionRecipes = await TransactionRecipeEntity
    .getRepository()
    .createQueryBuilder()
    .where('HEX(TransactionRecipe.iota_message_id) IN (:...messageIDs)', { messageIDs:messageIDsHex })
    .getMany()
  
  const foundMessageIds = transactionRecipes
    .map((recipe) => recipe.iotaMessageId?.toString('hex'))
    .filter((messageId) => !!messageId)
  // find message ids for which we don't already have a transaction recipe
  const missingMessageIdsHex = messageIDsHex.filter((id:string) => !foundMessageIds.includes(id))
  logger.info("create new recipes for iota message ids we haven't found", missingMessageIdsHex)
  const newRecipes = await Promise.all(
    missingMessageIdsHex.map(async (messageIdHex: string) => {
      const confirmedTransaction = sortByMessageId.get(messageIdHex)
      if (!confirmedTransaction) {
        throw new LogError('transaction for message id not longer exist')
      }
      const recipe = await TransactionRecipe.create({
        transaction: confirmedTransaction.transaction,
      })
      const recipeEntity = recipe.getTransactionRecipeEntity()
      if (confirmedTransaction.transaction.parentMessageId && confirmedTransaction.transaction.parentMessageId.length === 32) {
        throw new LogError(
          'cross group paring transaction found, please add code for handling it properly!',
        )
      }
      recipeEntity.iotaMessageId = Buffer.from(messageIdHex, 'hex')
      return recipe
    }),
  )
  // save new transaction recipes
  console.log('going to save new recipes: %s', JSON.stringify(newRecipes, null, 2))
  try {
    const storedRecipes = await TransactionRecipeEntity.save(
      newRecipes.map((recipe: TransactionRecipe) => recipe.getTransactionRecipeEntity()),
    )
    // create new confirmed transaction entities from new recipes
    const newConfirmedTransactions = storedRecipes.map((recipe: TransactionRecipeEntity) => {
      if (!recipe.iotaMessageId) {
        throw new LogError('missing iota message id')
      }
      const confirmedTransaction = sortByMessageId.get(recipe.iotaMessageId.toString('hex'))
      if (!confirmedTransaction) {
        throw new LogError('transaction for message id not longer exist')
      }
      return create(confirmedTransaction, new TransactionRecipe(recipe))
    })
    console.log('going to save new confirmed transactions: %o', newConfirmedTransactions)
    await ConfirmedTransactionEntity.save(newConfirmedTransactions)
    console.log('saved new confirmed transaction')
  } catch(error) {
    throw new LogError('Error saving new recipes or confirmed transactions', error)
  }
  console.log('stored recipes')
  const transactionRecipesToConfirm = newRecipes.concat(transactionRecipes.map((transactionRecipeEntity) => new TransactionRecipe(transactionRecipeEntity)))

  for(const transactionRecipe of transactionRecipesToConfirm) {
    transactionRecipe
  }
  
  // TODO: fill confirmedAt Dates in User, Account
}
