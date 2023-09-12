// eslint-disable-next-line camelcase
import { randombytes_buf } from 'sodium-native'
import { CONFIG } from '../config'
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'
// https://www.npmjs.com/package/bip32-ed25519?activeTab=code
import { generateFromSeed, derivePrivate } from 'bip32-ed25519'
import { logger } from '@/server/logger'
import { Community } from '@entity/Community'
import { loadHomeCommunityKeyPair } from './Community'
import { LogError } from '@/server/LogError'
import { KeyPair } from '../model/KeyPair'

// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
// and ../federation/client/FederationClientFactory.ts
/**
 * A Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
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

  public async init(): Promise<boolean> {
    try {
      this.homeCommunityRootKeys = await loadHomeCommunityKeyPair()
      return true
    } catch (error) {
      logger.error('error by init key manager', error)
      return false
    }
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
    this.homeCommunityRootKeys = new KeyPair(community)
  }

  public derive(path: number[], parentKeys?: KeyPair): KeyPair {
    const extendedPrivateKey = parentKeys
      ? parentKeys.getExtendPrivateKey()
      : this.homeCommunityRootKeys?.getExtendPrivateKey()
    if (!extendedPrivateKey) {
      throw new LogError('missing parent or root key pair')
    }
    return new KeyPair(
      path.reduce(
        (extendPrivateKey: Buffer, node: number) => derivePrivate(extendPrivateKey, node),
        extendedPrivateKey,
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
}
