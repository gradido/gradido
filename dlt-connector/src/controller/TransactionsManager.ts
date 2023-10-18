// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */

import { receiveAllMessagesForTopic } from '@/client/IotaClient'
import { findAll as findAllCommunities } from './Community'
import { getTransactions } from '@/client/GradidoNode'
import { confirmFromNodeServer } from './ConfirmedTransaction'
import { logger } from '@/server/logger'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TransactionsManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: TransactionsManager
  private topicsForListening: string[] = []
  private homeCommunityTopic: string

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
  public static getInstance(): TransactionsManager {
    if (!TransactionsManager.instance) {
      TransactionsManager.instance = new TransactionsManager()
    }
    return TransactionsManager.instance
  }

  public async init(): Promise<void[]> {
    return Promise.all(
      (await findAllCommunities({ iotaTopic: true, foreign: true })).map((community) => {
        if (community.foreign) {
          this.homeCommunityTopic = community.iotaTopic
        }
        return this.addTopic(community.iotaTopic)
      }),
    )
  }

  /**
   * add topic to list and warmup, load transaction from node server (he must already listen to this topic)
   * TODO: implement logic in node js rather than using GradidoNode
   * @param newTopic
   */
  public async addTopic(newTopic: string): Promise<void> {
    logger.info('add topic', newTopic)
    if (this.topicsForListening.includes(newTopic)) {
      throw new TransactionError(TransactionErrorType.ALREADY_EXIST, 'topic already exist')
    }
    this.topicsForListening.push(newTopic)
    let count = 0
    let cursor = 0
    do {
      try {
        const confirmedTransactions = await getTransactions(cursor, 100, newTopic)
        count = confirmedTransactions.length
        cursor += count
        await confirmFromNodeServer(confirmedTransactions, newTopic)
      } catch (error) {
        logger.error('cannot get transactions from node server')
        throw error
      }
    } while (count === 100)
  }

  public async isTopicIsEmpty(iotaTopic: Buffer): Promise<boolean> {
    const messageIds = await receiveAllMessagesForTopic(new Uint8Array(iotaTopic))
    return messageIds.length > 0
  }

  public isTopicExist(iotaTopic: string): boolean {
    return this.topicsForListening.indexOf(iotaTopic) !== -1
  }

  public getHomeCommunityTopic(): string {
    return this.homeCommunityTopic
  }
}
