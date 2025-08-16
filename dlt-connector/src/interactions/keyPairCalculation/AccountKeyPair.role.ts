import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class AccountKeyPairRole extends AbstractKeyPairRole {
  public constructor(
    private accountNr: number,
    private userKeyPair: KeyPairEd25519,
  ) {
    super()
  }

  public generateKeyPair(): KeyPairEd25519 {
    return this.userKeyPair.deriveChild(this.accountNr)
  }
}
