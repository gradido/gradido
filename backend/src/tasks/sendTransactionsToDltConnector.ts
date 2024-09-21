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
          const result = await dltConnector.registerAddress(pendingTransaction)
          if (result?.succeed && result.recipe) {
            const dltUser = DltUser.create()
            dltUser.userId = pendingTransaction.id
            dltUser.messageId = result.recipe.messageIdHex
            // wait until saved, necessary before next call to findNextPendingTransaction
            await DltUser.save(dltUser)
            logger.info('store dltUser: messageId=%s in dltTx=%d', dltUser.messageId, dltUser.id)
          }
        } else if (pendingTransaction instanceof Transaction) {
          const result = await dltConnector.transmitTransaction(pendingTransaction)
          if (result?.succeed && result.recipe) {
            const dltTransaction = DltTransaction.create()
            dltTransaction.transactionId = pendingTransaction.id
            dltTransaction.messageId = result.recipe.messageIdHex
            // wait until saved, necessary before next call to findNextPendingTransaction
            await DltTransaction.save(dltTransaction)
            logger.info(
              'store dltTransaction: messageId=%s in dltTx=%d',
              dltTransaction.messageId,
              dltTransaction.id,
            )
          }
        } else {
          // nothing to do, break inner loop and sleep until new work has arrived
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
  const lastTransactionPromise: Promise<Transaction | undefined> = Transaction.createQueryBuilder()
    .select()
    .leftJoin(DltTransaction, 'dltTransaction', 'transaction.id = dltTransaction.transactionId')
    .where('dltTransaction.transactionId IS NULL')
    // eslint-disable-next-line camelcase
    .orderBy({ balance_date: 'ASC', id: 'ASC' })
    .limit(1)
    .getRawOne()

  const lastUserPromise: Promise<User | undefined> = User.createQueryBuilder()
    .leftJoin(DltUser, 'dltUser', 'user.id = dltUser.userId')
    .where('dltUser.userId IS NULL')
    // eslint-disable-next-line camelcase
    .orderBy({ created_at: 'ASC', id: 'ASC' })
    .limit(1)
    .getRawOne()

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
