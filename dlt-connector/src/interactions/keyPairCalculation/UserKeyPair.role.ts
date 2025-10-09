import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { GradidoBlockchainCryptoError } from '../../errors'
import { hardenDerivationIndex } from '../../utils/derivationHelper'
import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class UserKeyPairRole extends AbstractKeyPairRole {
  public constructor(
    private userUuid: string,
    private communityKeys: KeyPairEd25519,
  ) {
    super()
  }

  public generateKeyPair(): KeyPairEd25519 {
    // example gradido id: 03857ac1-9cc2-483e-8a91-e5b10f5b8d16 =>
    // wholeHex: '03857ac19cc2483e8a91e5b10f5b8d16']

    const wholeHex = Buffer.from(this.userUuid.replace(/-/g, ''), 'hex')
    const parts = []
    for (let i = 0; i < 4; i++) {
      parts[i] = hardenDerivationIndex(wholeHex.subarray(i * 4, (i + 1) * 4).readUInt32BE())
    }
    // parts: [2206563009, 2629978174, 2324817329, 2405141782]
    return parts.reduce((keyPair: KeyPairEd25519, node: number) => {
      const localKeyPair = keyPair.deriveChild(node)
      if (!localKeyPair) {
        throw new GradidoBlockchainCryptoError(
          `KeyPairEd25519 child derivation failed, has private key: ${keyPair.hasPrivateKey()} for user: ${this.userUuid}`,
        )
      }
      return localKeyPair
    }, this.communityKeys)
  }
}
