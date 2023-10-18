import { ConfirmedTransaction } from '@/proto/3_3/ConfirmedTransaction'
import { ConfirmedTransaction as ConfirmedTransactionEntity } from '@entity/ConfirmedTransaction'
import { TransactionRecipe as TransactionRecipeEntity } from '@entity/TransactionRecipe'
import {
  TransactionRecipe,
  findExistingTransactionRecipeAndMissingMessageIds,
  removeConfirmedTransactionRecipes,
} from './TransactionRecipe'
import { LogError } from '@/server/LogError'
import Decimal from 'decimal.js-light'
import { timestampSecondsToDate } from '@/utils/typeConverter'
import { logger } from '@/server/logger'
import { createFromProto } from '@controller/Account'
import { User } from '@entity/User'
import { Account } from '@entity/Account'
import { BackendClient } from '@/client/BackendClient'
import { TransactionType } from '@/graphql/enum/TransactionType'

export const create = (
  confirmedTransactionProto: ConfirmedTransaction,
  transactionRecipe: TransactionRecipe,
): ConfirmedTransactionEntity => {
  const confirmedTransaction = ConfirmedTransactionEntity.create()
  confirmedTransaction.transactionRecipe = transactionRecipe.getTransactionRecipeEntity()
  confirmedTransaction.nr = confirmedTransactionProto.id.toInt()
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

/**
 * if transactions are already in db, only set confirmedAt Dates for related tables
 * if not exist, create TransactionRecipes, ConfirmedTransactions, Accounts and Users in db
 * @param transactions
 * @param iotaTopic
 */
export const confirmFromNodeServer = async (
  transactions: ConfirmedTransaction[],
  iotaTopic: string,
): Promise<void> => {
  if (!transactions.length) {
    return
  }
  // create map with message ids as key
  const sortByMessageId = transactions.reduce((messageIdMap, transaction) => {
    return messageIdMap.set(Buffer.from(transaction.messageId).toString('hex'), transaction)
  }, new Map<string, ConfirmedTransaction>())
  const messageIDsHex: string[] = []
  for (const key of sortByMessageId.keys()) {
    messageIDsHex.push(key)
  }

  // load transactionRecipes for message ids
  logger.info('load transaction recipes for iota message ids:', messageIDsHex)
  let { existingTransactionRecipes, missingMessageIdsHex } =
    await findExistingTransactionRecipeAndMissingMessageIds(messageIDsHex)

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
      if (
        confirmedTransaction.transaction.parentMessageId &&
        confirmedTransaction.transaction.parentMessageId.length === 32
      ) {
        throw new LogError(
          'cross group paring transaction found, please add code for handling it properly!',
        )
      }
      recipeEntity.iotaMessageId = Buffer.from(messageIdHex, 'hex')
      return recipe
    }),
  )
  let allTransactionRecipe: TransactionRecipeEntity[] = []
  try {
    existingTransactionRecipes = await removeConfirmedTransactionRecipes(existingTransactionRecipes)
    // create confirmed transaction entities from receipts
    allTransactionRecipe = existingTransactionRecipes.concat(
      newRecipes.map((recipe: TransactionRecipe) => recipe.getTransactionRecipeEntity()),
    )
    const backend = BackendClient.getInstance()
    if (!backend) {
      throw new LogError('error instancing backend client')
    }
    const confirmedTransactionEntities = await Promise.all(
      allTransactionRecipe.map(async (recipe: TransactionRecipeEntity) => {
        if (!recipe.iotaMessageId) {
          throw new LogError('missing iota message id')
        }
        const confirmedTransaction = sortByMessageId.get(recipe.iotaMessageId.toString('hex'))
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

  const newUsers: User[] = []
  const newAccounts: Account[] = []

  for (const transactionRecipe of allTransactionRecipe.map(
    (transactionRecipeEntity) => new TransactionRecipe(transactionRecipeEntity),
  )) {
    const messageIdHex = transactionRecipe.getMessageIdHex()
    if (!messageIdHex) {
      throw new LogError('iota message id missing on transaction recipe')
    }
    const confirmedTransaction = sortByMessageId.get(messageIdHex)
    if (!confirmedTransaction) {
      throw new LogError('transaction for message id not longer exist')
    }

    const body = transactionRecipe.getBody()
    // confirm all connected tables
    if (
      !(await transactionRecipe.confirm(
        timestampSecondsToDate(confirmedTransaction.confirmedAt),
        iotaTopic,
        new Decimal(confirmedTransaction.accountBalance),
      ))
    ) {
      // if transaction came from blockchain, from another Community or backup we don't have account or user and must create them
      if (body.registerAddress) {
        const newEntity = await createFromProto(confirmedTransaction)
        if (newEntity instanceof User) {
          newUsers.push(newEntity)
        } else if (newEntity instanceof Account) {
          newAccounts.push(newEntity)
        } else {
          throw new LogError('not implemented yet')
        }
      } else if (body.creation || body.transfer || body.deferredTransfer) {
        throw new LogError('error by updating account balance')
      }
    }
  }
  // store new entities in db
  if (newUsers.length > 0) {
    await User.save(newUsers)
  }
  if (newAccounts.length > 0) {
    await Account.save(newAccounts)
  }
}
