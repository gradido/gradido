import { Transaction as DbTransaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { gql, GraphQLClient } from 'graphql-request'
// eslint-disable-next-line import/named, n/no-extraneous-import
import { FetchError } from 'node-fetch'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { TransactionDraft } from './model/TransactionDraft'
import { TransactionResult } from './model/TransactionResult'
import { UserAccountDraft } from './model/UserAccountDraft'

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

const registerAddress = gql`
  mutation ($input: UserAccountDraft!) {
    registerAddress(data: $input) {
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

  private getTransactionParams(input: DbTransaction | User): TransactionDraft | UserAccountDraft {
    if (input instanceof DbTransaction) {
      return new TransactionDraft(input)
    } else if (input instanceof User) {
      return new UserAccountDraft(input)
    }
    throw new LogError('transaction should be either Transaction or User Entity')
  }

  private handleTransactionResult(result: TransactionResult) {
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result
  }

  private async sendTransaction(input: TransactionDraft) {
    const {
      data: { sendTransaction: result },
    } = await this.client.rawRequest<{ sendTransaction: TransactionResult }>(sendTransaction, {
      input,
    })
    return this.handleTransactionResult(result)
  }

  private async registerAddress(input: UserAccountDraft) {
    const {
      data: { registerAddress: result },
    } = await this.client.rawRequest<{ registerAddress: TransactionResult }>(registerAddress, {
      input,
    })
    return this.handleTransactionResult(result)
  }

  /**
   * transmit transaction via dlt-connector to iota
   * and update dltTransactionId of transaction in db with iota message id
   */
  public async transmitTransaction(
    transaction: DbTransaction | User,
  ): Promise<TransactionResult | undefined> {
    // we don't need the receive transactions, there contain basically the same data as the send transactions
    if (
      transaction instanceof DbTransaction &&
      (transaction.typeId as TransactionTypeId) === TransactionTypeId.RECEIVE
    ) {
      return
    }

    const input = this.getTransactionParams(transaction)
    try {
      logger.debug('transmit transaction or user to dlt connector', input)
      if (input instanceof TransactionDraft) {
        return await this.sendTransaction(input)
      } else if (input instanceof UserAccountDraft) {
        return await this.registerAddress(input)
      } else {
        throw new LogError('unhandled branch reached')
      }
    } catch (e) {
      logger.error(e)
      if (e instanceof FetchError) {
        throw e
      } else if (e instanceof Error) {
        throw new LogError(`from dlt-connector: ${e.message}`)
      } else {
        throw new LogError('Exception sending transfer transaction to dlt-connector', e)
      }
    }
  }
}
