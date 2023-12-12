/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Transaction } from '@entity/Transaction'
import { gql, GraphQLClient } from 'graphql-request'

import { CONFIG } from '@/config'
import { TransactionLogic } from '@/data/Transaction.logic'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { LogError } from '@/server/LogError'
import { logger } from '@/logging/logger'

const confirmTransaction = gql`
  mutation ($input: ConfirmedTransactionInput!) {
    confirmTransaction(data: $input)
  }
`

const communityByForeign = gql`
  query ($foreign: Boolean) {
    community(foreign: $foreign) {
      uuid
      foreign
      creationDate
    }
  }
`
interface Community {
  community: {
    uuid: string
    foreign: boolean
    creationDate: string
  }
}
// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BackendClient {
  // eslint-disable-next-line no-use-before-define
  private static instance: BackendClient
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
  public static getInstance(): BackendClient | undefined {
    if (!BackendClient.instance) {
      BackendClient.instance = new BackendClient()
    }
    if (!BackendClient.instance.client) {
      try {
        BackendClient.instance.client = new GraphQLClient(CONFIG.BACKEND_SERVER_URL, {
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
        logger.error("couldn't connect to backend: ", e)
        return
      }
    }
    return BackendClient.instance
  }

  public async confirmTransaction(confirmedTransaction: Transaction): Promise<void> {
    // TODO: use view or logging print class
    logger.info('confirmTransaction to backend', confirmedTransaction)
    // force parse to int, typeorm return id as string even it is typed as numeric
    let transactionId = confirmedTransaction.backendTransactionId
    if (typeof confirmedTransaction.backendTransactionId === 'string') {
      transactionId = parseInt(confirmedTransaction.backendTransactionId)
    }
    if (
      (!transactionId || transactionId <= 0) &&
      (!confirmedTransaction.iotaMessageId || confirmedTransaction.iotaMessageId.length !== 32)
    ) {
      throw new LogError(
        'need at least iota message id or backend transaction id for matching transaction in backend',
      )
    }
    const transactionLogic = new TransactionLogic(confirmedTransaction)
    const balanceAccount = transactionLogic.getBalanceAccount()
    const input = {
      transactionId,
      iotaMessageId: confirmedTransaction.iotaMessageId?.toString('hex'),
      gradidoId: balanceAccount?.user?.gradidoID,
      balance: confirmedTransaction.accountBalanceCreatedAt,
      balanceDate: confirmedTransaction.confirmedAt?.toString(),
    }
    logger.debug('call confirmTransaction with parameter', input)
    const { errors } = await this.client.rawRequest<boolean>(confirmTransaction, { input })
    if (errors) {
      throw new LogError('error confirm transaction with: %s, details: %s', errors)
    }
  }

  public async homeCommunityUUid(): Promise<CommunityDraft> {
    logger.info('check home community on backend')
    const { data, errors } = await this.client.rawRequest<Community>(communityByForeign, {
      foreign: false,
    })
    if (errors) {
      throw new LogError('error getting home community from backend', errors)
    }
    const communityDraft = new CommunityDraft()
    communityDraft.uuid = data.community.uuid
    communityDraft.foreign = data.community.foreign
    communityDraft.createdAt = data.community.creationDate
    return communityDraft
  }
}
