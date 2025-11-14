import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import { ParameterError } from '../../errors'
import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class LinkedTransactionKeyPairRole extends AbstractKeyPairRole {
  public constructor(private seed: string) {
    super()
  }

  public generateKeyPair(): KeyPairEd25519 {
    // seed is expected to be 24 bytes long, but we need 32
    // so hash the seed with blake2 and we have 32 Bytes
    const hash = new MemoryBlock(this.seed).calculateHash()
    const keyPair = KeyPairEd25519.create(hash)
    if (!keyPair) {
      throw new ParameterError(
        `error creating Ed25519 KeyPair from seed: ${this.seed.substring(0, 5)}...`,
      )
    }
    return keyPair
  }
}
