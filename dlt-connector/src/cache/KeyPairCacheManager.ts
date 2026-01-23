import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { getLogger, Logger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../config/const'
import { HieroId } from '../schemas/typeGuard.schema'

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
// TODO: TTL (time to live) based, maybe even optional use of redis
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export class KeyPairCacheManager {
  private static instance: KeyPairCacheManager
  private cache: Map<string, KeyPairEd25519> = new Map<string, KeyPairEd25519>()
  private homeCommunityTopicId: HieroId | undefined
  private logger: Logger

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.KeyPairCacheManager`)
  }

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

  public setHomeCommunityTopicId(topicId: HieroId): void {
    this.homeCommunityTopicId = topicId
  }

  public getHomeCommunityTopicId(): HieroId {
    if (!this.homeCommunityTopicId) {
      throw new Error('home community topic id is not set')
    }
    return this.homeCommunityTopicId
  }

  public findKeyPair(input: string): KeyPairEd25519 | undefined {
    return this.cache.get(input)
  }

  public addKeyPair(input: string, keyPair: KeyPairEd25519): void {
    if (this.cache.has(input)) {
      this.logger.warn('key already exist, cannot add', {
        key: input,
        publicKey: keyPair.getPublicKey()?.convertToHex(),
      })
      return
    }
    this.cache.set(input, keyPair)
  }

  public async getKeyPair(
    input: string,
    createKeyPair: () => Promise<KeyPairEd25519>,
  ): Promise<KeyPairEd25519> {
    const keyPair = this.cache.get(input)
    if (!keyPair) {
      const keyPair = await createKeyPair()
      this.cache.set(input, keyPair)
      return keyPair
    }
    return keyPair
  }

  public getKeyPairSync(
    input: string,
    createKeyPair: () => KeyPairEd25519,
  ): KeyPairEd25519 {
    const keyPair = this.cache.get(input)
    if (!keyPair) {
      const keyPair = createKeyPair()
      this.cache.set(input, keyPair)
      return keyPair
    }
    return keyPair
  }
}
