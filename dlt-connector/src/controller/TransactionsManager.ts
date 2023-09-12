// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */

import { receiveAllMessagesForTopic } from '@/client/IotaClient'
import { getAllTopics } from './Community'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TransactionsManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: TransactionsManager
  private topicsForListening: string[]

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
  public static async getInstance(): Promise<TransactionsManager | undefined> {
    if (!TransactionsManager.instance) {
      TransactionsManager.instance = new TransactionsManager()
      await TransactionsManager.instance.init()
    }
    return TransactionsManager.instance
  }

  public async init() {
    this.topicsForListening = await getAllTopics()
  }

  public async isTopicIsEmpty(iotaTopic: Buffer): Promise<boolean> {
    const messageIds = await receiveAllMessagesForTopic(new Uint8Array(iotaTopic))
    return messageIds.length > 0
  }
}
