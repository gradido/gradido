/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CONFIG } from '@/config'
import { backendLogger as logger } from '@/server/logger'
import { Community } from '@entity/Community'
import { Contribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { User as DbUser } from '@entity/User'
import { gql, GraphQLClient } from 'graphql-request'

import { ConfirmedTransactionInput } from '@/graphql/arg/ConfirmTransactionInput'
import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'

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
enum TransactionType {
  GRADIDO_TRANSFER = 1,
  GRADIDO_CREATION = 2,
  GROUP_FRIENDS_UPDATE = 3,
  REGISTER_ADDRESS = 4,
  GRADIDO_DEFERRED_TRANSFER = 5,
  COMMUNITY_ROOT = 6,
}

enum TransactionErrorType {
  NOT_IMPLEMENTED_YET = 'Not Implemented yet',
  MISSING_PARAMETER = 'Missing parameter',
  ALREADY_EXIST = 'Already exist',
  DB_ERROR = 'DB Error',
  PROTO_DECODE_ERROR = 'Proto Decode Error',
  PROTO_ENCODE_ERROR = 'Proto Encode Error',
  INVALID_SIGNATURE = 'Invalid Signature',
  LOGIC_ERROR = 'Logic Error',
  NOT_FOUND = 'Not found',
}

interface TransactionError {
  type: TransactionErrorType
  message: string
  name: string
}

interface TransactionRecipe {
  id: number
  createdAt: string
  type: TransactionType
  topic: string
}

interface TransactionResult {
  error?: TransactionError
  recipe?: TransactionRecipe
  confirmed?: ConfirmedTransactionInput
  succeed: boolean
}

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

interface UserIdentifier {
  uuid: string
  communityUuid: string
  accountNr?: number
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

  protected async getCorrectUserUUID(
    transaction: DbTransaction,
    type: 'sender' | 'recipient',
  ): Promise<string> {
    let confirmingUserId: number | undefined
    logger.info('confirming user id', confirmingUserId)
    switch (transaction.typeId) {
      case TransactionTypeId.CREATION:
        confirmingUserId = (
          await Contribution.findOneOrFail({ where: { transactionId: transaction.id } })
        ).confirmedBy
        if (!confirmingUserId) {
          throw new LogError(
            "couldn't find id of confirming moderator for contribution transaction!",
          )
        }
        if (type === 'sender') {
          return (await DbUser.findOneOrFail({ where: { id: confirmingUserId } })).gradidoID
        } else if (type === 'recipient') {
          return transaction.userGradidoID
        }
        break
      case TransactionTypeId.SEND:
        if (type === 'sender') {
          return transaction.userGradidoID
        } else if (type === 'recipient') {
          if (!transaction.linkedUserGradidoID) {
            throw new LogError('missing linked user gradido id')
          }
          return transaction.linkedUserGradidoID
        }
        break
      case TransactionTypeId.RECEIVE:
        if (type === 'sender') {
          if (!transaction.linkedUserGradidoID) {
            throw new LogError('missing linked user gradido id')
          }
          return transaction.linkedUserGradidoID
        } else if (type === 'recipient') {
          return transaction.userGradidoID
        }
    }
    throw new LogError('unhandled case')
  }

  protected async getCorrectUserIdentifier(
    transaction: DbTransaction,
    senderCommunityUuid: string,
    type: 'sender' | 'recipient',
    recipientCommunityUuid?: string,
  ): Promise<UserIdentifier> {
    // sender and receiver user on creation transaction
    // sender user on send transaction (SEND and RECEIVE)
    if (type === 'sender' || transaction.typeId === TransactionTypeId.CREATION) {
      return {
        uuid: await this.getCorrectUserUUID(transaction, type),
        communityUuid: senderCommunityUuid,
      }
    }
    // recipient user on SEND and RECEIVE transactions
    return {
      uuid: await this.getCorrectUserUUID(transaction, type),
      communityUuid: recipientCommunityUuid ?? senderCommunityUuid,
    }
  }

  /**
   * transmit transaction via dlt-connector to iota
   * and update dltTransactionId of transaction in db with iota message id
   */
  public async transmitTransaction(
    transaction: DbTransaction,
    senderCommunityUuid: string,
    recipientCommunityUuid?: string,
  ): Promise<boolean | ConfirmedTransactionInput> {
    const typeString = getTransactionTypeString(transaction.typeId)
    // no negative values in dlt connector, gradido concept don't use negative values so the code don't use it too
    const amountString = transaction.amount.abs().toString()
    const params = {
      input: {
        senderUser: await this.getCorrectUserIdentifier(
          transaction,
          senderCommunityUuid,
          'sender',
          recipientCommunityUuid,
        ),
        recipientUser: await this.getCorrectUserIdentifier(
          transaction,
          senderCommunityUuid,
          'recipient',
          recipientCommunityUuid,
        ),
        amount: amountString,
        type: typeString,
        createdAt: transaction.balanceDate.toISOString(),
        backendTransactionId: transaction.id,
        targetDate: transaction.creationDate?.toISOString(),
      },
    }
    try {
      // TODO: add account nr for user after they have also more than one account in backend
      logger.debug('transmit transaction to dlt connector', params)
      const {
        data: {
          sendTransaction: { error, succeed, confirmed },
        },
      } = await this.client.rawRequest<{ sendTransaction: TransactionResult }>(
        sendTransaction,
        params,
      )
      if (error) {
        throw new Error(error.message)
      }
      // transaction was already confirmed so we can update it directly
      if (confirmed) {
        return confirmed
      }
      return succeed
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
