import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { CONFIG } from '../../config'
import { ParameterError } from '../../errors'
import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class HomeCommunityKeyPairRole extends AbstractKeyPairRole {
  public generateKeyPair(): KeyPairEd25519 {
    const keyPair = KeyPairEd25519.create(CONFIG.HOME_COMMUNITY_SEED)
    if (!keyPair) {
      throw new ParameterError("couldn't create keyPair from HOME_COMMUNITY_SEED")
    }
    return keyPair
  }
}
