import { DltTransaction } from '@entity/DltTransaction'
import { DltUser } from '@entity/DltUser'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'

import { DltConnectorClient } from '@dltConnector/DltConnectorClient'

import { backendLogger as logger } from '@/server/logger'
import {
  InterruptiveSleepManager,
  TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
} from '@/util/InterruptiveSleepManager'

let running = true

export const stopSendTransactionsToDltConnector = (): void => {
  running = false
}

export async function sendTransactionsToDltConnector(): Promise<void> {
  const dltConnector = DltConnectorClient.getInstance()
  if (!dltConnector) {
    logger.info('sending to DltConnector currently not configured...')
    running = false
    return
  }
  logger.info('start sendTransactionsToDltConnector task')

  // eslint-disable-next-line no-unmodified-loop-condition
  while (running) {
    try {
      // loop while work could be found
      while (true) {
        const pendingTransaction = await findNextPendingTransaction()
        if (pendingTransaction instanceof User) {
          const dltUser = DltUser.create()
          dltUser.userId = pendingTransaction.id
          try {
            const result = await dltConnector.registerAddress(pendingTransaction)
            if (result?.succeed && result.recipe) {
              dltUser.messageId = result.recipe.messageIdHex
            }
          } catch (e) {
            if (e instanceof Error) {
              dltUser.error = e.message
            } else if (typeof e === 'string') {
              dltUser.error = e
            }
          }
          // wait until saved, necessary before next call to findNextPendingTransaction
          await DltUser.save(dltUser)
          if (dltUser.messageId) {
            logger.info('store dltUser: messageId=%s, id=%d', dltUser.messageId, dltUser.id)
          } else {
            logger.error('store dltUser with error: id=%d, error=%s', dltUser.id, dltUser.error)
          }
        } else if (pendingTransaction instanceof Transaction) {
          const dltTransaction = DltTransaction.create()
          dltTransaction.transactionId = pendingTransaction.id
          try {
            const result = await dltConnector.transmitTransaction(pendingTransaction)
            if (result?.succeed && result.recipe) {
              dltTransaction.messageId = result.recipe.messageIdHex
            } else {
              dltTransaction.error = 'skipped'
            }
          } catch (e) {
            if (e instanceof Error) {
              dltTransaction.error = e.message
            } else if (typeof e === 'string') {
              dltTransaction.error = e
            }
          }
          // wait until saved, necessary before next call to findNextPendingTransaction
          await DltTransaction.save(dltTransaction)
          if (dltTransaction.messageId) {
            logger.info(
              'store dltTransaction: messageId=%s, id=%d',
              dltTransaction.messageId,
              dltTransaction.id,
            )
          } else {
            logger.error(
              'store dltTransaction with error: id=%d, error=%s',
              dltTransaction.id,
              dltTransaction.error,
            )
          }
        } else {
          break
        }
      }
      await InterruptiveSleepManager.getInstance().sleep(
        TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY,
        1000,
      )
    } catch (e) {
      logger.error(`error while sending to dlt-connector or writing messageId`, e)
    }
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
