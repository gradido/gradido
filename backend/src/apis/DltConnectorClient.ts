import { Transaction as DbTransaction } from '@entity/Transaction'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

const mutation = gql`
  mutation ($input: TransactionInput!) {
    transmitTransaction(data: $input) {
      dltTransactionIdHex
    }
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

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DltConnectorClient {
  // eslint-disable-next-line no-use-before-define
  private static instance: DltConnectorClient
  private client: GraphQLClient
  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): DltConnectorClient | undefined {
    if (!CONFIG.DLT_CONNECTOR || !CONFIG.DLT_CONNECTOR_URL) {
      logger.info(`dlt-connector are disabled via config...`)
      return
    }
    if (!DltConnectorClient.instance) {
      DltConnectorClient.instance = new DltConnectorClient()
    }
    if (!DltConnectorClient.instance.client) {
      try {
        DltConnectorClient.instance.client = new GraphQLClient(CONFIG.DLT_CONNECTOR_URL)
      } catch (e) {
        logger.error("couldn't connect to dlt-connector: ", e)
        return
      }
    }
    return DltConnectorClient.instance
  }

  /**
   * transmit transaction via dlt-connector to iota
   * and update dltTransactionId of transaction in db with iota message id
   */
  public async transmitTransaction(transaction: DbTransaction): Promise<boolean> {
    const typeString = getTransactionTypeString(transaction.typeId)
    const secondsSinceEpoch = transaction.balanceDate.getTime() / 1000
    const amountString = transaction.amount.toString()
    try {
      const result: { transmitTransaction: { dltTransactionIdHex: string } } =
        await this.client.request(mutation, {
          input: {
            type: typeString,
            amount: amountString,
            created: secondsSinceEpoch,
          },
        })
      const writeResult = await writeDltMessageId(
        result.transmitTransaction.dltTransactionIdHex,
        transaction.id,
      )
      return writeResult
    } catch (e) {
      logger.error('Error send sending transaction to dlt-connector: %o', e)
      return false
    }
  }
}
