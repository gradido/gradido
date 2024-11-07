import { DltTransaction } from '@entity/DltTransaction'
import { DltUser } from '@entity/DltUser'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'
// eslint-disable-next-line import/named, n/no-extraneous-import
import { FetchError } from 'node-fetch'

import { DltConnectorClient } from '@dltConnector/DltConnectorClient'

import { TransactionResult } from '@/apis/dltConnector/model/TransactionResult'
import { backendLogger as logger } from '@/server/logger'
import {
  InterruptiveSleepManager,
  TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
} from '@/util/InterruptiveSleepManager'

let isLoopRunning = true

export const stopSendTransactionsToDltConnector = (): void => {
  isLoopRunning = false
}

function logTransactionResult(
  type: 'dltUser' | 'dltTransaction',
  data: { id: number; messageId: string; error: string | null },
): void {
  if (data.error) {
    logger.error(`Store ${type} with error: id=${data.id}, error=${data.error}`)
  } else {
    logger.info(`Store ${type}: messageId=${data.messageId}, id=${data.id}`)
  }
}

async function saveTransactionResult(
  pendingTransaction: User | Transaction,
  messageId: string,
  error: string | null,
): Promise<void> {
  if (pendingTransaction instanceof User) {
    const dltUser = DltUser.create()
    dltUser.userId = pendingTransaction.id
    dltUser.messageId = messageId
    dltUser.error = error
    await DltUser.save(dltUser)
    logTransactionResult('dltUser', dltUser)
  } else if (pendingTransaction instanceof Transaction) {
    const dltTransaction = DltTransaction.create()
    dltTransaction.transactionId = pendingTransaction.id
    dltTransaction.messageId = messageId
    dltTransaction.error = error
    await DltTransaction.save(dltTransaction)
    logTransactionResult('dltTransaction', dltTransaction)
  }
}

async function findNextPendingTransaction(): Promise<Transaction | User | null> {
  const lastTransactionPromise: Promise<Transaction | null> = Transaction.createQueryBuilder()
    .leftJoin(DltTransaction, 'dltTransaction', 'Transaction.id = dltTransaction.transactionId')
    .where('dltTransaction.transaction_id IS NULL')
    // eslint-disable-next-line camelcase
    .orderBy({ balance_date: 'ASC', Transaction_id: 'ASC' })
    .limit(1)
    .getOne()

  const lastUserPromise: Promise<User | null> = User.createQueryBuilder()
    .leftJoin(DltUser, 'dltUser', 'User.id = dltUser.userId')
    .where('dltUser.user_id IS NULL')
    // eslint-disable-next-line camelcase
    .orderBy({ User_created_at: 'ASC', User_id: 'ASC' })
    .limit(1)
    .getOne()

  const results = await Promise.all([lastTransactionPromise, lastUserPromise])
  if (results[0] && results[1]) {
    return results[0].balanceDate < results[1].createdAt ? results[0] : results[1]
  } else if (results[0]) {
    return results[0]
  } else if (results[1]) {
    return results[1]
  }
  return null
}

async function processPendingTransactions(dltConnector: DltConnectorClient): Promise<void> {
  let pendingTransaction: Transaction | User | null = null
  while ((pendingTransaction = await findNextPendingTransaction())) {
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
  }
}

export async function sendTransactionsToDltConnector(): Promise<void> {
  const dltConnector = DltConnectorClient.getInstance()

  if (!dltConnector) {
    logger.info('Sending to DltConnector currently not configured...')
    isLoopRunning = false
    return
  }

  logger.info('Starting sendTransactionsToDltConnector task')

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
