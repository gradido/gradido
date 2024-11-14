import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { uuid4ToBuffer } from '@/utils/typeConverter'

import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class UserKeyPairRole extends AbstractKeyPairRole {
  public constructor(private user: UserIdentifier, private communityKeys: KeyPairEd25519) {
    super()
  }

  public generateKeyPair(): KeyPairEd25519 {
    // example gradido id: 03857ac1-9cc2-483e-8a91-e5b10f5b8d16 =>
    // wholeHex: '03857ac19cc2483e8a91e5b10f5b8d16']
    if (!this.user.communityUser) {
      throw new LogError('missing community user')
    }
    const wholeHex = uuid4ToBuffer(this.user.communityUser.uuid)
    const parts = []
    for (let i = 0; i < 4; i++) {
      parts[i] = hardenDerivationIndex(wholeHex.subarray(i * 4, (i + 1) * 4).readUInt32BE())
    }
    // parts: [2206563009, 2629978174, 2324817329, 2405141782]
    return parts.reduce(
      (keyPair: KeyPairEd25519, node: number) => keyPair.deriveChild(node),
      this.communityKeys,
    )
  }
}
