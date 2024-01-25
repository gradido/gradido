import { LogError } from '@/server/LogError'

import { InterruptiveSleep } from '../utils/InterruptiveSleep'

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class InterruptiveSleepManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: InterruptiveSleepManager
  private interruptiveSleep: Map<string, InterruptiveSleep> = new Map<string, InterruptiveSleep>()
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
  public static getInstance(): InterruptiveSleepManager {
    if (!InterruptiveSleepManager.instance) {
      InterruptiveSleepManager.instance = new InterruptiveSleepManager()
    }
    return InterruptiveSleepManager.instance
  }

  /**
   * only for new created InterruptiveSleepManager Entries!
   * @param step size in ms in which new! InterruptiveSleepManager check if they where triggered
   */
  public setStepSize(ms: number) {
    this.stepSizeMilliseconds = ms
  }

  public interrupt(key: string): void {
    const interruptiveSleep = this.interruptiveSleep.get(key)
    if (interruptiveSleep) {
      interruptiveSleep.interrupt()
    }
  }

  public sleep(key: string, ms: number): Promise<void> {
    if (!this.interruptiveSleep.has(key)) {
      this.interruptiveSleep.set(key, new InterruptiveSleep(this.stepSizeMilliseconds))
    }
    const interruptiveSleep = this.interruptiveSleep.get(key)
    if (!interruptiveSleep) {
      throw new LogError('map entry not exist after setting it')
    }
    return interruptiveSleep.sleep(ms)
  }
}
