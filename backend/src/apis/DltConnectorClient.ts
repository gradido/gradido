import { Transaction as DbTransaction } from '@entity/Transaction'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

const sendTransaction = gql`
  mutation ($input: TransactionInput!) {
    sendTransaction(data: $input) {
      dltTransactionIdHex
    }
  }
`

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
  client: GraphQLClient
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
        DltConnectorClient.instance.client = new GraphQLClient(CONFIG.DLT_CONNECTOR_URL, {
          method: 'GET',
          jsonSerializer: {
            parse: JSON.parse,
            stringify: JSON.stringify,
          },
        })
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
  public async transmitTransaction(transaction?: DbTransaction | null): Promise<string> {
    if (transaction) {
      const typeString = getTransactionTypeString(transaction.typeId)
      const secondsSinceEpoch = Math.round(transaction.balanceDate.getTime() / 1000)
      const amountString = transaction.amount.toString()
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { data } = await this.client.rawRequest(sendTransaction, {
          input: {
            type: typeString,
            amount: amountString,
            createdAt: secondsSinceEpoch,
          },
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return data.sendTransaction.dltTransactionIdHex
      } catch (e) {
        throw new LogError('Error send sending transaction to dlt-connector: ', e)
      }
    } else {
      throw new LogError('parameter transaction not set...')
    }
  }
}
