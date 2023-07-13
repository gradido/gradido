import { Transaction as DbTransaction } from '@entity/Transaction'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { backendLogger as logger } from '@/server/logger'

const mutation = gql`
  mutation ($input: TransactionInput!) {
    sendTransaction(data: $input)
  }
`

/**
 * write message id into db to transaction
 * @param dltMessageId message id of dlt message
 * @param transactionId typeorm transaction id
 */
async function writeDltMessageId(dltMessageId: string, transactionId: number) {
  const transaction = await DbTransaction.findOne({ where: { id: transactionId } })
  if (transaction) {
    transaction.dltTransactionId = Buffer.from(dltMessageId, 'hex')
    transaction
      .save()
      .then(() => {
        logger.info('saved dlt message id for transaction: %d', transactionId)
        return true
      })
      .catch(() => {
        logger.error(
          'Error writing dltMessagId: %s into transaction with id: %d',
          dltMessageId,
          transactionId,
        )
      })
  }
}

// from ChatGPT
function getTransactionTypeString(id: TransactionTypeId): string {
  const key = Object.keys(TransactionTypeId).find(
    (key) => TransactionTypeId[key as keyof typeof TransactionTypeId] === id,
  )
  return key ?? ''
}

/**
 * transmit transaction via dlt-connector to iota
 * and update dltTransactionId of transaction in db with iota message id
 * @param type transaction type
 * @param amount amount as decimal string
 * @param createdAt creation date of transaction
 * @param transactionId id of transaction stored in db
 */
export function transmitTransaction(transaction: DbTransaction) {
  if (CONFIG.DLT_CONNECTOR) {
    const client = new GraphQLClient(CONFIG.DLT_CONNECTOR_URL)
    switch (transaction.typeId) {
      case TransactionTypeId.SEND:
    }
    const typeString = getTransactionTypeString(transaction.typeId)
    const secondsSinceEpoch = transaction.balanceDate.getTime() / 1000
    const amountString = transaction.amount.toString()
    client
      .request(mutation, {
        input: {
          type: typeString,
          amount: amountString,
          created: secondsSinceEpoch,
        },
      })
      .then(async (result: { sendTransaction: string }) => {
        await writeDltMessageId(result.sendTransaction, transaction.id)
        return true
      })
      .catch((e) => {
        logger.error('Error send sending transaction to dlt-connector: %o', e)
      })
  }
}
