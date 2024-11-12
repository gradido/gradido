// eslint-disable-next-line import/no-extraneous-dependencies
import { backendLogger as logger } from '@/server/logger'
import { BaseEntity, EntityPropertyNotFoundError, EntityTarget, OrderByCondition, SelectQueryBuilder } from '@dbTools/typeorm'
import { DltTransaction } from '@entity/DltTransaction'
import { Transaction } from '@entity/Transaction'
import { TransactionLink } from '@entity/TransactionLink'
import { User } from '@entity/User'
// eslint-disable-next-line import/named, n/no-extraneous-import
import { FetchError } from 'node-fetch'

import { DltConnectorClient } from '@dltConnector/DltConnectorClient'

import { TransactionResult } from '@/apis/dltConnector/model/TransactionResult'
import {
  InterruptiveSleepManager,
  TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
} from '@/util/InterruptiveSleepManager'
import { LogError } from '@/server/LogError'

let isLoopRunning = true

export const stopSendTransactionsToDltConnector = (): void => {
  isLoopRunning = false
}

interface NextPendingTransactionQueries {
  lastTransactionQuery: SelectQueryBuilder<Transaction>
  lastUserQuery: SelectQueryBuilder<User>
  lastTransactionLinkQuery: SelectQueryBuilder<TransactionLink>
}

function logTransactionResult(data: { id: number; messageId: string; error: string | null }): void {
  if (data.error) {
    logger.error(`Store dltTransaction with error: id=${data.id}, error=${data.error}`)
  } else {
    logger.info(`Store dltTransaction: messageId=${data.messageId}, id=${data.id}`)
  }
}

async function saveTransactionResult(
  pendingTransaction: User | Transaction | TransactionLink,
  messageId: string,
  error: string | null,
): Promise<void> {
  const dltTransaction = DltTransaction.create()
  dltTransaction.messageId = messageId
  dltTransaction.error = error
  if (pendingTransaction instanceof User) {
    dltTransaction.userId = pendingTransaction.id
  } else if (pendingTransaction instanceof Transaction) {
    dltTransaction.transactionId = pendingTransaction.id
  } else if (pendingTransaction instanceof TransactionLink) {
    dltTransaction.transactionLinkId = pendingTransaction.id
  }
  await DltTransaction.save(dltTransaction)
  logTransactionResult(dltTransaction)
}

async function findNextPendingTransaction(): Promise<Transaction | User | TransactionLink | null> {
  // Helper function to avoid code repetition
  const createQueryForPendingItems = (
    qb: SelectQueryBuilder<Transaction | User | TransactionLink>,
    joinCondition: string,
    orderBy: OrderByCondition,
  ): Promise<Transaction | User | TransactionLink | null> => {
    return qb
      .leftJoin(DltTransaction, 'dltTransaction', joinCondition)
      .where('dltTransaction.user_id IS NULL')
      .andWhere('dltTransaction.transaction_id IS NULL')
      .andWhere('dltTransaction.transaction_link_Id IS NULL')
      .orderBy(orderBy)
      .limit(1)
      .getOne()
  }

  const lastTransactionPromise = createQueryForPendingItems(
    Transaction.createQueryBuilder(),
    'Transaction.id = dltTransaction.transactionId',
    // eslint-disable-next-line camelcase
    { balance_date: 'ASC', Transaction_id: 'ASC' },
  )

  const lastUserPromise = createQueryForPendingItems(
    User.createQueryBuilder(),
    'User.id = dltTransaction.userId',
    // eslint-disable-next-line camelcase
    { User_created_at: 'ASC', User_id: 'ASC' },
  )

  const lastTransactionLinkPromise = createQueryForPendingItems(
    TransactionLink.createQueryBuilder().leftJoinAndSelect('transactionLink.user', 'user'),
    'TransactionLink.id = dltTransaction.transactionLinkId',
    // eslint-disable-next-line camelcase
    { TransactionLinkId_created_at: 'ASC', User_id: 'ASC' },
  )

  const results = await Promise.all([
    lastTransactionPromise,
    lastUserPromise,
    lastTransactionLinkPromise,
  ])

  results.sort((a, b) => {
    const getTime = (input: Transaction | User | TransactionLink | null) => {
      if (!input) return Infinity
      if (input instanceof Transaction) {
        return input.balanceDate.getTime()
      } else if (input instanceof User || input instanceof TransactionLink) {
        return input.createdAt.getTime()
      }
      return Infinity
    }
    return getTime(a) - getTime(b)
  })
  return results[0] ?? null
}

async function processPendingTransactions(dltConnector: DltConnectorClient): Promise<void> {
  let pendingTransaction: Transaction | User | TransactionLink | null = null
  do {
    pendingTransaction = await findNextPendingTransaction()
    if (!pendingTransaction) {
      return
    }
    let result: TransactionResult | undefined
    let messageId = ''
    let error: string | null = null

    try {
      result = await dltConnector.transmitTransaction(pendingTransaction)
      if (result?.succeed && result.recipe) {
        messageId = result.recipe.messageIdHex
      } else {
        error = 'skipped'
      }
    } catch (e) {
      if (e instanceof FetchError) {
        throw e
      }
      error = e instanceof Error ? e.message : String(e)
    }

    await saveTransactionResult(pendingTransaction, messageId, error)
  } while (pendingTransaction)
}

export async function sendTransactionsToDltConnector(): Promise<void> {
  const dltConnector = DltConnectorClient.getInstance()

  if (!dltConnector) {
    logger.info('Sending to DltConnector currently not configured...')
    isLoopRunning = false
    return
  }
  logger.info('Starting sendTransactionsToDltConnector task')

  // define outside of loop for reuse and reducing gb collection
  // const queries = getFindNextPendingTransactionQueries()

  // eslint-disable-next-line no-unmodified-loop-condition
  while (isLoopRunning) {
    try {
      // return after no pending transactions are left
      await processPendingTransactions(dltConnector)
      await InterruptiveSleepManager.getInstance().sleep(
        TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
        1000,
      )
    } catch (e) {
      if (e instanceof EntityPropertyNotFoundError) {
        throw new LogError(e.message, e.stack)
      }
      // couldn't connect to dlt-connector? We wait
      if (e instanceof FetchError) {
        logger.error(`error connecting dlt-connector, wait 5 seconds before retry: ${String(e)}`)
        await InterruptiveSleepManager.getInstance().sleep(
          TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
          5000,
        )
      } else {
        logger.error(`Error while sending to DLT-connector or writing messageId`, e)
      }
    }
  }
}
