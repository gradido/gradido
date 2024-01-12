import { User } from '@entity/User'

import { LogError } from '@/server/LogError'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { uuid4ToBuffer } from '@/utils/typeConverter'

import { KeyPair } from './KeyPair'

export class UserLogic {
  // eslint-disable-next-line no-useless-constructor
  constructor(private user: User) {}

  /**
   *
   * @param parentKeys if undefined use home community key pair
   * @returns
   */

  calculateKeyPair = (parentKeys: KeyPair): KeyPair => {
    if (!this.user.gradidoID) {
      throw new LogError('missing GradidoID for user.', { id: this.user.id })
    }
    // example gradido id: 03857ac1-9cc2-483e-8a91-e5b10f5b8d16 =>
    // wholeHex: '03857ac19cc2483e8a91e5b10f5b8d16']
    const wholeHex = uuid4ToBuffer(this.user.gradidoID)
    const parts = []
    for (let i = 0; i < 4; i++) {
      parts[i] = hardenDerivationIndex(wholeHex.subarray(i * 4, (i + 1) * 4).readUInt32BE())
    }
    // parts: [2206563009, 2629978174, 2324817329, 2405141782]
    const keyPair = parentKeys.derive(parts)
    if (this.user.derive1Pubkey && this.user.derive1Pubkey.compare(keyPair.publicKey) !== 0) {
      throw new LogError(
        'The freshly derived public key does not correspond to the stored public key',
      )
    }
    if (!this.user.derive1Pubkey) {
      this.user.derive1Pubkey = keyPair.publicKey
    }
    return keyPair
  }
}
