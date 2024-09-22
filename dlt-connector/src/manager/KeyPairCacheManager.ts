import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class KeyPairCacheManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: KeyPairCacheManager
  private cache: Map<string, KeyPairEd25519> = new Map<string, KeyPairEd25519>()
  private homeCommunityUUID: string

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
  public static getInstance(): KeyPairCacheManager {
    if (!KeyPairCacheManager.instance) {
      KeyPairCacheManager.instance = new KeyPairCacheManager()
    }
    return KeyPairCacheManager.instance
  }

  public setHomeCommunityUUID(uuid: string): void {
    this.homeCommunityUUID = uuid
  }

  public getHomeCommunityUUID(): string {
    return this.homeCommunityUUID
  }

  public findKeyPair(input: UserIdentifier | string): KeyPairEd25519 | undefined {
    return this.cache.get(this.getKey(input))
  }

  public addKeyPair(input: UserIdentifier | string, keyPair: KeyPairEd25519): void {
    const key = this.getKey(input)
    if (this.cache.has(key)) {
      throw new LogError('key already exist, cannot add', key)
    }
    this.cache.set(key, keyPair)
  }

  protected getKey(input: UserIdentifier | string): string {
    if (input instanceof UserIdentifier) {
      return input.uuid
    } else {
      return input
    }
  }
}
