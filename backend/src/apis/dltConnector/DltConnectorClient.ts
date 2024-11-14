import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { backendLogger as logger } from '@/server/logger'
// eslint-disable-next-line import/named, n/no-extraneous-import

import { TransactionDraft } from './model/TransactionDraft'
import { TransactionResult } from './model/TransactionResult'

const sendTransaction = gql`
  mutation ($input: TransactionDraft!) {
    sendTransaction(data: $input) {
      error {
        message
        name
      }
      succeed
      recipe {
        createdAt
        type
        messageIdHex
      }
    }
  }
`

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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
  public async sendTransaction(input: TransactionDraft): Promise<TransactionResult | undefined> {
    logger.debug('transmit transaction or user to dlt connector', input)
    const {
      data: { sendTransaction: result },
    } = await this.client.rawRequest<{ sendTransaction: TransactionResult }>(sendTransaction, {
      input,
    })
    return result
  }
}
