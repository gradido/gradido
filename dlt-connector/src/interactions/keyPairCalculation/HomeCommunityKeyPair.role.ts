import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'

import { AbstractKeyPairRole } from './AbstractKeyPair.role'

export class HomeCommunityKeyPairRole extends AbstractKeyPairRole {
  public generateKeyPair(): KeyPairEd25519 {
    if (!CONFIG.IOTA_HOME_COMMUNITY_SEED) {
      throw new LogError(
        'IOTA_HOME_COMMUNITY_SEED is missing either in config or as environment variable',
      )
    }
    const seed = MemoryBlock.fromHex(CONFIG.IOTA_HOME_COMMUNITY_SEED)
    const keyPair = KeyPairEd25519.create(seed)
    if (!keyPair) {
      throw new LogError("couldn't create keyPair from IOTA_HOME_COMMUNITY_SEED")
    }
    return keyPair
  }
}
