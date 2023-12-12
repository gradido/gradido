/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Community } from '@entity/Community'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { User as DbUser } from '@entity/User'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

const sendTransaction = gql`
  mutation ($input: TransactionDraft!) {
    sendTransaction(data: $input) {
      succeed
      error {
        name
        message
      }
      recipe {
        id
      }
    }
  }
`
const isCommunityExist = gql`
  query ($uuid: String) {
    isCommunityExist(uuid: $uuid)
  }
`

const isAccountExist = gql`
  query ($input: UserIdentifier!) {
    isAccountExist(data: $input)
  }
`
const addCommunity = gql`
  mutation ($input: CommunityDraft!) {
    addCommunity(data: $input) {
      succeed
      error {
        name
        message
      }
    }
  }
`

const registerAddress = gql`
  mutation ($input: UserAccountDraft!) {
    registerAddress(data: $input) {
      succeed
      error {
        name
        message
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
          headers: {
            'content-type': 'application/json',
          },
          method: 'POST',
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
    senderCommunityUuid: string,
    recipientCommunityUuid?: string,
  ): Promise<string> {
    const typeString = getTransactionTypeString(transaction.typeId)
    const amountString = transaction.amount.toString()
    const params = {
      input: {
        senderUser: {
          uuid: transaction.userGradidoID,
          communityUuid: senderCommunityUuid,
        },
        recipientUser: {
          uuid: transaction.linkedUserGradidoID,
          communityUuid: recipientCommunityUuid,
        },
        amount: amountString,
        type: typeString,
        createdAt: transaction.balanceDate.toString(),
        backendTransactionId: transaction.id,
        targetDate: transaction.creationDate?.toString(),
      },
    }
    if (transaction.typeId === TransactionTypeId.CREATION) {
      const confirmingUserId = transaction.contribution?.confirmedBy
      logger.info('confirming user id', confirmingUserId)
      if (!confirmingUserId) {
        throw new LogError("couldn't find id of confirming moderator for contribution transaction!")
      }
      const confirmingUser = await DbUser.findOneOrFail({ where: { id: confirmingUserId } })
      params.input.senderUser = {
        uuid: confirmingUser.gradidoID,
        communityUuid: senderCommunityUuid,
      }
      params.input.recipientUser = {
        uuid: transaction.userGradidoID,
        communityUuid: senderCommunityUuid,
      }
    }
    try {
      // TODO: add account nr for user after they have also more than one account in backend
      const { data } = await this.client.rawRequest(sendTransaction, params)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (data.sendTransaction.succeed) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return data.sendTransaction.recipe.id.toString()
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        throw new Error(data.sendTransaction.error.message)
      }
    } catch (e) {
      throw new LogError('Error send sending transaction to dlt-connector: ', e)
    }
  }

  /**
   * check if our home community was already added to dlt connector
   * @return true if home community exist on dlt connector
   */
  public async checkHomeCommunity(communityUuid: string): Promise<boolean> {
    const { data } = await this.client.rawRequest(isCommunityExist, {
      uuid: communityUuid,
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data.isCommunityExist
  }

  /**
   * check if account was already added to dlt connector
   * @return true if account exist on dlt connector
   */
  public async checkAccount(user: DbUser, communityUuid: string): Promise<boolean> {
    const { data } = await this.client.rawRequest(isAccountExist, {
      input: {
        uuid: user.gradidoID,
        communityUuid,
        accountNr: 1,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data.isAccountExist
  }

  public async addCommunity(community: Community): Promise<void> {
    logger.info('add community to dlt-connector', community)
    const { data } = await this.client.rawRequest(addCommunity, {
      input: {
        uuid: community.communityUuid,
        foreign: community.foreign,
        createdAt: community.createdAt.toString(),
      },
    })
    if (data.error) {
      const { message, name } = data.error
      throw new LogError('error adding community with: %s, details: %s', name, message)
    }
  }

  /**
   * Add Community User to dlt and create his first account for contribution on dlt
   * @param user
   * @param communityUuid
   */
  public async addUser(user: DbUser, communityUuid: string): Promise<void> {
    logger.info('add user to dlt-connector', user)
    const { data } = await this.client.rawRequest(registerAddress, {
      input: {
        user: {
          uuid: user.gradidoID,
          communityUuid,
          accountNr: 1,
        },
        createdAt: user.createdAt.toString(),
        accountType: 'COMMUNITY_HUMAN',
      },
    })
    if (data.error) {
      const { message, name } = data.error
      throw new LogError('error adding user with: %s, details: %s', name, message)
    }
  }
}
