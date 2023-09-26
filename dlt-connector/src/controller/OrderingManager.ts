import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { Timestamp } from '@/proto/3_3/Timestamp'
import { TimestampSeconds } from '@/proto/3_3/TimestampSeconds'

type GradidoTransactionWithGroup = {
  transaction: GradidoTransaction
  iotaTopic: string
  messageId: Buffer
}

type MilestoneTransactions = {
  milestoneId: number
  milestoneTimestamp: TimestampSeconds
  entryCreationTime: Timestamp
  transactions: GradidoTransactionWithGroup[]
}

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export class OrderingManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: OrderingManager
  private milestonesWithTransactions: Map<number, MilestoneTransactions> = new Map<
    number,
    MilestoneTransactions
  >()

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
  public static getInstance(): OrderingManager {
    if (!OrderingManager.instance) {
      OrderingManager.instance = new OrderingManager()
    }
    return OrderingManager.instance
  }
}
