import { Transaction } from '@entity/Transaction'
import { TransactionLink } from '@entity/TransactionLink'
import { User } from '@entity/User'
// eslint-disable-next-line import/named, n/no-extraneous-import
import { FetchError } from 'node-fetch'

import { DltConnectorClient } from '@/apis/dltConnector/DltConnectorClient'
import { TransactionResult } from '@/apis/dltConnector/model/TransactionResult'

import { AbstractTransactionToDltRole } from './AbstractTransactionToDlt.role'
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
    let result: TransactionResult | undefined
    let messageId = ''
    let error: string | null = null

    try {
      result = await dltConnector.transmitTransaction(
        pendingTransactionRole.convertToGraphqlInput(),
      )
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

    await pendingTransactionRole.saveTransactionResult(messageId, error)
  }
}
