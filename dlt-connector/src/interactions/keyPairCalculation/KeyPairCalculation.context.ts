import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { KeyPairCacheManager } from '@/manager/KeyPairCacheManager'

import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'
import { AccountKeyPairRole } from './AccountKeyPair.role'
import { ForeignCommunityKeyPairRole } from './ForeignCommunityKeyPair.role'
import { HomeCommunityKeyPairRole } from './HomeCommunityKeyPair.role'
import { RemoteAccountKeyPairRole } from './RemoteAccountKeyPair.role'
import { UserKeyPairRole } from './UserKeyPair.role'

/**
 * @DCI-Context
 * Context for calculating key pair for signing transactions 
 */
export async function KeyPairCalculation(input: UserIdentifier | string): Promise<KeyPairEd25519> {
  const cache = KeyPairCacheManager.getInstance()
  const keyPair = cache.findKeyPair(input)
  if (keyPair) {
    return keyPair
  }
  let communityUUID: string
  if (input instanceof UserIdentifier) {
    communityUUID = input.communityUuid
  } else {
    communityUUID = input
  }

  if (cache.getHomeCommunityUUID() !== communityUUID) {
    // it isn't home community so we can only retrieve public keys
    let role: AbstractRemoteKeyPairRole
    if (input instanceof UserIdentifier) {
      role = new RemoteAccountKeyPairRole(input)
    } else {
      role = new ForeignCommunityKeyPairRole(input)
    }
    const keyPair = await role.retrieveKeyPair()
    cache.addKeyPair(input, keyPair)
    return keyPair
  }

  let communityKeyPair = cache.findKeyPair(communityUUID)
  if (!communityKeyPair) {
    communityKeyPair = new HomeCommunityKeyPairRole().generateKeyPair()
    cache.addKeyPair(communityUUID, communityKeyPair)
  }
  if (input instanceof UserIdentifier) {
    const userKeyPair = new UserKeyPairRole(input, communityKeyPair).generateKeyPair()
    const accountNr = input.accountNr ?? 1
    const accountKeyPair = new AccountKeyPairRole(accountNr, userKeyPair).generateKeyPair()
    cache.addKeyPair(input, accountKeyPair)
    return accountKeyPair
  }
  return communityKeyPair
}
