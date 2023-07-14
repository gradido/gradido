import { Transaction as DbTransaction } from '@entity/Transaction'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { backendLogger as logger } from '@/server/logger'
import { LogError } from '@/server/LogError'

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
const writeDltMessageId = async (
  dltMessageIdHex: string,
  transactionId: number,
): Promise<boolean> => {
  try {
    const transaction = await DbTransaction.findOne({ where: { id: transactionId } })
    if (transaction) {
      const dltMessageId = Buffer.from(dltMessageIdHex, 'hex')
      if (dltMessageId.length !== 32) {
        logger.error(
          'Error dlt message id is invalid: %s, should by 32 Bytes long in binary after converting from hex',
          dltMessageIdHex,
        )
        return false
      }
      transaction.dltTransactionId = dltMessageId
      await transaction.save()
      logger.info(
        'transmit transaction over dlt connector, store message id: %s in db',
        dltMessageIdHex,
      )
      return true
    } else {
      logger.error('transaction with id: %d not found', transactionId)
      return false
    }
  } catch (e) {
    logger.error('exception by finding transaction in db: %s', e)
    return false
  }
}

// from ChatGPT
function getTransactionTypeString(id: TransactionTypeId): string {
  const key = Object.keys(TransactionTypeId).find(
    (key) => TransactionTypeId[key as keyof typeof TransactionTypeId] === id,
  )
  if (key === undefined) {
    throw new LogError('invalid transaction type id: ' + id.toString())
  }
  return key
}

/**
 * transmit transaction via dlt-connector to iota
 * and update dltTransactionId of transaction in db with iota message id
 */
export const transmitTransaction = async (transaction: DbTransaction): Promise<boolean> => {
  if (CONFIG.DLT_CONNECTOR) {
    const client = new GraphQLClient(CONFIG.DLT_CONNECTOR_URL)
    const typeString = getTransactionTypeString(transaction.typeId)
    const secondsSinceEpoch = transaction.balanceDate.getTime() / 1000
    const amountString = transaction.amount.toString()
    try {
      const result: { sendTransaction: string } = await client.request(mutation, {
        input: {
          type: typeString,
          amount: amountString,
          created: secondsSinceEpoch,
        },
      })
      const writeResult = await writeDltMessageId(result.sendTransaction, transaction.id)
      return writeResult
    } catch (e) {
      logger.error('Error send sending transaction to dlt-connector: %o', e)
      return false
    }
  } else {
    return true
  }
}
