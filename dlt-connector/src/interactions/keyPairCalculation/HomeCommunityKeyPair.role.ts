import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'

import { CONFIG } from '../../config'
import { ParameterError } from '../../errors'
import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class HomeCommunityKeyPairRole extends AbstractKeyPairRole {
  public generateKeyPair(): KeyPairEd25519 {
    // TODO: prevent this check with valibot test on config
    if (!CONFIG.IOTA_HOME_COMMUNITY_SEED) {
      throw new Error(
        'IOTA_HOME_COMMUNITY_SEED is missing either in config or as environment variable',
      )
    }
    const seed = MemoryBlock.fromHex(CONFIG.IOTA_HOME_COMMUNITY_SEED)
    const keyPair = KeyPairEd25519.create(seed)
    if (!keyPair) {
      throw new ParameterError("couldn't create keyPair from IOTA_HOME_COMMUNITY_SEED")
    }
    return keyPair
  }
}
