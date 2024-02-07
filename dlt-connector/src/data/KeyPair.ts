import { Community } from '@entity/Community'

// https://www.npmjs.com/package/bip32-ed25519
import { LogError } from '@/server/LogError'

import { toPublic, derivePrivate, sign, verify, generateFromSeed } from 'bip32-ed25519'

import { Mnemonic } from './Mnemonic'

/**
 * Class Managing Key Pair and also generate, sign and verify signature with it
 */
export class KeyPair {
  private _publicKey: Buffer
  private _chainCode: Buffer
  private _privateKey: Buffer

  /**
   * @param input: Mnemonic = Mnemonic or Passphrase which work as seed for generating algorithms
   * @param input: Buffer = extended private key, returned from bip32-ed25519 generateFromSeed or from derivePrivate
   * @param input: Community = community entity with keys loaded from db
   *
   */
  public constructor(input: Mnemonic | Buffer | Community) {
    if (input instanceof Mnemonic) {
      this.loadFromExtendedPrivateKey(generateFromSeed(input.seed))
    } else if (input instanceof Buffer) {
      this.loadFromExtendedPrivateKey(input)
    } else if (input instanceof Community) {
      if (!input.rootPrivkey || !input.rootChaincode || !input.rootPubkey) {
        throw new LogError('missing private key or chaincode or public key in commmunity entity')
      }
      this._privateKey = input.rootPrivkey
      this._publicKey = input.rootPubkey
      this._chainCode = input.rootChaincode
    }
  }

  /**
   * copy keys to community entity
   * @param community
   */
  public fillInCommunityKeys(community: Community) {
    community.rootPubkey = this._publicKey
    community.rootPrivkey = this._privateKey
    community.rootChaincode = this._chainCode
  }

  private loadFromExtendedPrivateKey(extendedPrivateKey: Buffer) {
    if (extendedPrivateKey.length !== 96) {
      throw new LogError('invalid extended private key')
    }
    this._privateKey = extendedPrivateKey.subarray(0, 64)
    this._chainCode = extendedPrivateKey.subarray(64, 96)
    this._publicKey = toPublic(extendedPrivateKey).subarray(0, 32)
  }

  public getExtendPrivateKey(): Buffer {
    return Buffer.concat([this._privateKey, this._chainCode])
  }

  public getExtendPublicKey(): Buffer {
    return Buffer.concat([this._publicKey, this._chainCode])
  }

  public get publicKey(): Buffer {
    return this._publicKey
  }

  public derive(path: number[]): KeyPair {
    const extendedPrivateKey = this.getExtendPrivateKey()
    return new KeyPair(
      path.reduce(
        (extendPrivateKey: Buffer, node: number) => derivePrivate(extendPrivateKey, node),
        extendedPrivateKey,
      ),
    )
  }

  public sign(message: Buffer): Buffer {
    return sign(message, this.getExtendPrivateKey())
  }

  public verify(message: Buffer, signature: Buffer): boolean {
    return verify(message, signature, this.getExtendPublicKey())
  }
}
