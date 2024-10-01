import { Transaction as DbTransaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { AccountType } from './enum/AccountType'
import { TransactionResult } from './model/TransactionResult'
import { UserAccountDraft } from './model/UserAccountDraft'
import { UserIdentifier } from './model/UserIdentifier'

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
  public async transmitTransaction(
    transaction: DbTransaction,
  ): Promise<TransactionResult | undefined> {
    // we don't need the receive transactions, there contain basically the same data as the send transactions
    if ((transaction.typeId as TransactionTypeId) === TransactionTypeId.RECEIVE) {
      return
    }
    const typeString = getTransactionTypeString(transaction.typeId)
    // no negative values in dlt connector, gradido concept don't use negative values so the code don't use it too
    const amountString = transaction.amount.abs().toString()
    const params = {
      input: {
        user: {
          uuid: transaction.userGradidoID,
          communityUuid: transaction.userCommunityUuid,
        } as UserIdentifier,
        linkedUser: {
          uuid: transaction.linkedUserGradidoID,
          communityUuid: transaction.linkedUserCommunityUuid,
        } as UserIdentifier,
        amount: amountString,
        type: typeString,
        createdAt: transaction.balanceDate.toISOString(),
        targetDate: transaction.creationDate?.toISOString(),
      },
    }
    try {
      // TODO: add account nr for user after they have also more than one account in backend
      logger.debug('transmit transaction to dlt connector', params)
      const {
        data: { sendTransaction: result },
      } = await this.client.rawRequest<{ sendTransaction: TransactionResult }>(
        sendTransaction,
        params,
      )
      if (result.error) {
        throw new Error(result.error.message)
      }
      console.log(result)
      return result
    } catch (e) {
      if (e instanceof Error) {
        throw new LogError(`from dlt-connector: ${e.message}`)
      } else {
        throw new LogError('Exception sending transfer transaction to dlt-connector', e)
      }
    }
  }

  public async registerAddress(dbUser: User): Promise<TransactionResult | undefined> {
    const params = {
      input: {
        user: {
          uuid: dbUser.gradidoID,
          communityUuid: dbUser.communityUuid,
          accountNr: 1,
        } as UserIdentifier,
        createdAt: dbUser.createdAt.toISOString(),
        accountType: AccountType.COMMUNITY_HUMAN,
      } as UserAccountDraft,
    }
    try {
      const {
        data: { registerAddress: result },
      } = await this.client.rawRequest<{ registerAddress: TransactionResult }>(
        registerAddress,
        params,
      )
      logger.info('send register address transaction to dlt-connector', {
        params,
        result,
      })
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result
    } catch (e) {
      if (e instanceof Error) {
        throw new LogError(`from dlt-connector: ${e.message}`)
      } else {
        throw new LogError('Exception sending register address transaction to dlt-connector', e)
      }
    }
  }
}
