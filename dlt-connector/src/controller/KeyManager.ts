// eslint-disable-next-line camelcase
import { randombytes_buf } from 'sodium-native'
import { CONFIG } from '../config'
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'
// https://www.npmjs.com/package/bip32-ed25519?activeTab=code
import { generateFromSeed, toPublic, derivePrivate } from 'bip32-ed25519'
import { logger } from '@/server/logger'
import { Community } from '@entity/Community'
import { loadHomeCommunityKeyPair } from './Community'
// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */

export class KeyPair {
  public constructor(extendPrivateKey: Buffer) {
    this.privateKey = extendPrivateKey.subarray(0, 64)
    this.chainCode = extendPrivateKey.subarray(64, 96)
    this.publicKey = toPublic(extendPrivateKey).subarray(0, 32)
  }

  public getExtendPrivateKey(): Buffer {
    return Buffer.concat([this.privateKey, this.chainCode])
  }

  publicKey: Buffer
  chainCode: Buffer
  privateKey: Buffer
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class KeyManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: KeyManager
  private homeCommunityRootKeys: KeyPair | null = null

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
  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager()
    }
    return KeyManager.instance
  }

  public generateKeysForCommunity(community: Community): void {
    if (community.foreign) {
      throw new Error('generateKeysForCommunity only allowed for home community!')
    }
    const mnemonic = KeyManager.generateMnemonic(CONFIG.IOTA_HOME_COMMUNITY_SEED ?? undefined)
    logger.info('passphrase for home community key pair: ' + mnemonic)
    const seed = mnemonicToSeedSync(mnemonic)
    const { publicKey, privateKey, chainCode } = new KeyPair(generateFromSeed(seed))
    community.rootPubkey = publicKey
    community.rootPrivkey = privateKey
    community.rootChaincode = chainCode
  }

  public async derive(path: number[]): Promise<KeyPair> {
    const rootKeys = await this.getHomeCommunityRootKeyPair()
    return new KeyPair(
      path.reduce(
        (extendPrivateKey: Buffer, node: number) => derivePrivate(extendPrivateKey, node),
        rootKeys.getExtendPrivateKey(),
      ),
    )
  }

  static generateMnemonic(seed?: Buffer | string): string {
    if (seed) {
      return entropyToMnemonic(seed)
    }
    const entropy = Buffer.alloc(256)
    randombytes_buf(entropy)
    return entropyToMnemonic(entropy)
  }

  private async getHomeCommunityRootKeyPair(): Promise<KeyPair> {
    if (!this.homeCommunityRootKeys) {
      this.homeCommunityRootKeys = await loadHomeCommunityKeyPair()
    }
    return this.homeCommunityRootKeys
  }
}
