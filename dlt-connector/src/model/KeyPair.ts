// https://www.npmjs.com/package/bip32-ed25519?activeTab=code
import { toPublic } from 'bip32-ed25519'
import { Community } from '@entity/Community'
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
      if (!input.rootPrivkey || !input.rootChaincode) {
        throw new LogError('missing private key or chaincode in commmunity entity')
      }
      this.privateKey = input.rootPrivkey
      this.publicKey = input.rootPubkey
      this.chainCode = input.rootChaincode
    }
  }

  public getExtendPrivateKey(): Buffer {
    return Buffer.concat([this.privateKey, this.chainCode])
  }

  publicKey: Buffer
  chainCode: Buffer
  privateKey: Buffer
}
