// https://www.npmjs.com/package/bip32-ed25519?activeTab=code
import { Community } from '@entity/Community'
import { toPublic } from 'bip32-ed25519'

import { LogError } from '@/server/LogError'

export class KeyPair {
  /**
   * @param input: Buffer = extended private key, returned from bip32-ed25519 generateFromSeed
   * @param input: Community = community entity with keys loaded from db
   *
   */
  public constructor(input: Buffer | Community) {
    if (input instanceof Buffer) {
      this.privateKey = input.subarray(0, 64)
      this.chainCode = input.subarray(64, 96)
      this.publicKey = toPublic(input).subarray(0, 32)
    } else if (input instanceof Community) {
      if (!input.rootPrivkey || !input.rootChaincode || !input.rootPubkey) {
        throw new LogError('missing private key or chaincode or public key in commmunity entity')
      }
      this.privateKey = input.rootPrivkey
      this.publicKey = input.rootPubkey
      this.chainCode = input.rootChaincode
    }
  }

  public getExtendPrivateKey(): Buffer {
    return Buffer.concat([this.privateKey, this.chainCode])
  }

  public getExtendPublicKey(): Buffer {
    return Buffer.concat([this.publicKey, this.chainCode])
  }

  publicKey: Buffer
  chainCode: Buffer
  privateKey: Buffer
}