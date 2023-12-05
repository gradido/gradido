import { LogError } from '@/server/LogError'

import { ConditionalSleep } from './ConditionalSleep'

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConditionalSleepManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: ConditionalSleepManager
  private conditionalSleeps: Map<string, ConditionalSleep> = new Map<string, ConditionalSleep>()
  private stepSizeMilliseconds = 10

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
  public static getInstance(): ConditionalSleepManager {
    if (!ConditionalSleepManager.instance) {
      ConditionalSleepManager.instance = new ConditionalSleepManager()
    }
    return ConditionalSleepManager.instance
  }

  /**
   * only for new created ConditionalSleep Entries!
   * @param step size in ms in which new! ConditionalSleep check if they where triggered
   */
  public setStepSize(ms: number) {
    this.stepSizeMilliseconds = ms
  }

  public signal(key: string): void {
    const cond = this.conditionalSleeps.get(key)
    if (cond) {
      cond.signal()
    }
  }

  public sleep(key: string, ms: number): Promise<void> {
    if (!this.conditionalSleeps.has(key)) {
      this.conditionalSleeps.set(key, new ConditionalSleep(this.stepSizeMilliseconds))
    }
    const cond = this.conditionalSleeps.get(key)
    if (!cond) {
      throw new LogError('map entry not exist after setting it')
    }
    return cond.sleep(ms)
  }
}
