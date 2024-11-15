import { Transaction } from '@entity/Transaction'
import { TransactionLink } from '@entity/TransactionLink'
import { User } from '@entity/User'

import { DltConnectorClient } from '@/apis/dltConnector/DltConnectorClient'
import { backendLogger as logger } from '@/server/logger'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'
import { TransactionLinkDeleteToDltRole } from './TransactionLinkDeleteToDlt.role'
import { TransactionLinkToDltRole } from './TransactionLinkToDlt.role'
import { TransactionToDltRole } from './TransactionToDlt.role'
import { UserToDltRole } from './UserToDlt.role'

/**
 * @DCI-Context
 * Context for sending transactions to dlt connector, always the oldest not sended transaction first
 */
export async function transactionToDlt(dltConnector: DltConnectorClient): Promise<void> {
  async function findNextPendingTransaction(): Promise<
    AbstractTransactionToDltRole<Transaction | User | TransactionLink>
  > {
    // collect each oldest not sended entity from db and choose oldest
    const results = await Promise.all([
      new TransactionToDltRole().initWithLast(),
      new UserToDltRole().initWithLast(),
      new TransactionLinkToDltRole().initWithLast(),
      new TransactionLinkDeleteToDltRole().initWithLast(),
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

    const result = await dltConnector.sendTransaction(
      pendingTransactionRole.convertToGraphqlInput(),
    )
    if (result?.succeed && result.recipe) {
      messageId = result.recipe.messageIdHex
    } else if (result?.error) {
      error = result.error.message
      logger.error('error from dlt-connector', result.error)
    }

    await pendingTransactionRole.saveTransactionResult(messageId, error)
  }
}
