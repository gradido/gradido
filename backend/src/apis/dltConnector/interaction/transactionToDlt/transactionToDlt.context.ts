import { Transaction, TransactionLink, User } from 'database'

import { DltConnectorClient } from '@/apis/dltConnector/DltConnectorClient'
import { TransactionResult } from '@/apis/dltConnector/model/TransactionResult'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'
import { TransactionLinkDeleteToDltRole } from './TransactionLinkDeleteToDlt.role'
import { TransactionLinkToDltRole } from './TransactionLinkToDlt.role'
import { TransactionToDltRole } from './TransactionToDlt.role'
import { UserToDltRole } from './UserToDlt.role'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

/**
 * @DCI-Context
 * Context for sending transactions to dlt connector, always the oldest not sended transaction first
 */
export async function transactionToDlt(dltConnector: DltConnectorClient): Promise<void> {
  async function findNextPendingTransaction(): Promise<
    AbstractTransactionToDltRole<Transaction | User | TransactionLink>
  > {
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}/apis/dltConnector/interaction/transactionToDlt`)
    // collect each oldest not sended entity from db and choose oldest
    const results = await Promise.all([
      new TransactionToDltRole(logger).initWithLast(),
      new UserToDltRole(logger).initWithLast(),
      new TransactionLinkToDltRole(logger).initWithLast(),
      new TransactionLinkDeleteToDltRole(logger).initWithLast(),
    ])

    // sort array to get oldest at first place
    results.sort((a, b) => {
      return a.getTimestamp() - b.getTimestamp()
    })
    return results[0]
  }
  while (true) {
    const pendingTransactionRole = await findNextPendingTransaction()
    const pendingTransaction = pendingTransactionRole.getEntity()
    if (!pendingTransaction) {
      break
    }
    let messageId = ''
    let error: string | null = null
    let result: TransactionResult | undefined
    try {
      result = await dltConnector.sendTransaction(pendingTransactionRole.convertToGraphqlInput())
    } catch (e) {
      if (e instanceof Error) {
        error = e.message
      } else if (typeof e === 'string') {
        error = e
      } else {
        throw e
      }
    }
    if (result?.succeed && result.recipe) {
      messageId = result.recipe.messageIdHex
    } else if (result?.error) {
      error = result.error.message
      logger.error('error from dlt-connector', result.error)
    }

    await pendingTransactionRole.saveTransactionResult(messageId, error)
  }
}
