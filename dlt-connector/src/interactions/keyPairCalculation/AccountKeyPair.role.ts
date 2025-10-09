import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { GradidoBlockchainCryptoError } from '../../errors'
import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class AccountKeyPairRole extends AbstractKeyPairRole {
  public constructor(
    private accountNr: number,
    private userKeyPair: KeyPairEd25519,
  ) {
    super()
  }

  public generateKeyPair(): KeyPairEd25519 {
    const keyPair = this.userKeyPair.deriveChild(this.accountNr)
    if (!keyPair) {
      throw new GradidoBlockchainCryptoError(
        `KeyPairEd25519 child derivation failed, has private key: ${this.userKeyPair.hasPrivateKey()}, accountNr: ${this.accountNr}`,
      )
    }
    return keyPair
  }
}
