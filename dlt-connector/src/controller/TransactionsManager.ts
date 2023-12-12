// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */

import { Community } from '@entity/Community'

import { getLastTransaction, getTransactions } from '@/client/GradidoNode'
import { receiveAllMessagesForTopic } from '@/client/IotaClient'
import { CommunityRepository } from '@/data/Community.repository'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { ConfirmTransactionsContext } from '@/interactions/gradidoNodeToDb/ConfirmTransactions.context'
import { LogError } from '@/server/LogError'
import { logger } from '@/logging/logger'
import { Mutex } from '@/utils/Mutex'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TransactionsManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: TransactionsManager
  private topicsForListening: string[] = []
  private topicsLocked: Set<string> = new Set<string>()
  private lockTopicMutex = new Mutex()
  private pendingConfirmedTransactions: { [key: string]: ConfirmedTransaction[] } = {}
  private pendingConfirmedTransactionsMutex = new Mutex()
  private homeCommunity: Community

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
      (await CommunityRepository.findAll({ iotaTopic: true, foreign: true })).map((community) => {
        if (community.foreign) {
          this.homeCommunity = community
        }
        return this.addTopic(community.iotaTopic)
      }),
    )
  }

  public isTopicLocked(topic: string): boolean {
    return this.topicsLocked.has(topic)
  }

  /**
   *
   * @param topic
   * @returns true if lock was successful and false if already locked
   */
  public async lockTopic(topic: string): Promise<boolean> {
    await this.lockTopicMutex.lock()
    try {
      if (this.topicsLocked.has(topic)) {
        return false
      }
      this.topicsLocked.add(topic)
    } finally {
      this.lockTopicMutex.unlock()
    }
    return true
  }

  public unlockTopic(topic: string): void {
    this.topicsLocked.delete(topic)
  }

  public async addPendingConfirmedTransaction(
    topic: string,
    confirmedTransaction: ConfirmedTransaction,
  ): Promise<void> {
    await this.pendingConfirmedTransactionsMutex.lock()
    try {
      if (!this.pendingConfirmedTransactions[topic]) {
        this.pendingConfirmedTransactions[topic] = []
      }
      this.pendingConfirmedTransactions[topic].push(confirmedTransaction)
    } finally {
      this.pendingConfirmedTransactionsMutex.unlock()
    }
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
    // transactions must be processed in order so we make sure only one process is currently importing transactions for this topic
    // we cannot move this mechanisms into ConfirmTransactionsContext because between importing batch of transactions a future transaction
    // could be slip by
    this.lockTopic(newTopic)
    let count = 0
    let cursor = 0
    let lastStoredTransactionNr = 0
    let lastTransactionOnNodeNr = 0
    try {
      do {
        try {
          const confirmedTransactions = await getTransactions(cursor, 100, newTopic)
          count = confirmedTransactions.length
          cursor += count
          lastStoredTransactionNr = await new ConfirmTransactionsContext(
            confirmedTransactions,
            newTopic,
          ).run()
          const lastTransactionOnNode = await getLastTransaction(newTopic)
          if (lastTransactionOnNode) {
            lastTransactionOnNodeNr = lastTransactionOnNode.id.toNumber()
            // comp return 0 if identical
            if (lastTransactionOnNode.id.comp(lastTransactionOnNodeNr) !== 0) {
              throw new LogError('type overflow, number is not longer enough for transaction nr')
            }
          }
        } catch (error) {
          logger.error('cannot load or confirm transactions from node server')
          throw error
        }
      } while (count === 100 || lastTransactionOnNodeNr > lastStoredTransactionNr)
      // check and maybe proceed transaction which where added while we were busy importing transactions from node server
      let pendingConfirmedTransaction: ConfirmedTransaction | undefined
      await this.pendingConfirmedTransactionsMutex.lock()
      while (this.pendingConfirmedTransactions[newTopic].length) {
        try {
          pendingConfirmedTransaction = this.pendingConfirmedTransactions[newTopic].shift()
        } finally {
          this.pendingConfirmedTransactionsMutex.unlock()
        }
        if (!pendingConfirmedTransaction) {
          throw new LogError('empty confirmed transaction in pending array')
        }
        if (pendingConfirmedTransaction.id.toNumber() <= lastStoredTransactionNr) {
          continue
        }
        await new ConfirmTransactionsContext([pendingConfirmedTransaction], newTopic).run()
        await this.pendingConfirmedTransactionsMutex.lock()
      }
    } finally {
      this.unlockTopic(newTopic)
      this.pendingConfirmedTransactionsMutex.unlock()
    }
  }

  public async isTopicIsEmpty(iotaTopic: Buffer): Promise<boolean> {
    const messageIds = await receiveAllMessagesForTopic(new Uint8Array(iotaTopic))
    return messageIds.length > 0
  }

  public isTopicExist(iotaTopic: string): boolean {
    return this.topicsForListening.indexOf(iotaTopic) !== -1
  }

  public getHomeCommunityTopic(): string {
    return this.homeCommunity.iotaTopic
  }

  public getHomeCommunity(): Community {
    return this.homeCommunity
  }
}
