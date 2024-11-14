import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { IdentifierSeed } from '@/graphql/input/IdentifierSeed'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { KeyPairCacheManager } from '@/manager/KeyPairCacheManager'

import { AccountKeyPairRole } from './AccountKeyPair.role'
import { ForeignCommunityKeyPairRole } from './ForeignCommunityKeyPair.role'
import { HomeCommunityKeyPairRole } from './HomeCommunityKeyPair.role'
import { LinkedTransactionKeyPairRole } from './LinkedTransactionKeyPair.role'
import { RemoteAccountKeyPairRole } from './RemoteAccountKeyPair.role'
import { UserKeyPairRole } from './UserKeyPair.role'

/**
 * @DCI-Context
 * Context for calculating key pair for signing transactions
 */
export async function KeyPairCalculation(input: UserIdentifier | string): Promise<KeyPairEd25519> {
  const cache = KeyPairCacheManager.getInstance()

  // Try cache lookup first
  let keyPair = cache.findKeyPair(input)
  if (keyPair) {
    return keyPair
  }

  const retrieveKeyPair = async (input: UserIdentifier | string): Promise<KeyPairEd25519> => {
    if (input instanceof UserIdentifier && input.seed) {
      return new LinkedTransactionKeyPairRole(input.seed.seed).generateKeyPair()
    }

    const communityUUID = input instanceof UserIdentifier ? input.communityUuid : input

    // If input does not belong to the home community, handle as remote key pair
    if (cache.getHomeCommunityUUID() !== communityUUID) {
      const role =
        input instanceof UserIdentifier
          ? new RemoteAccountKeyPairRole(input)
          : new ForeignCommunityKeyPairRole(input)
      return await role.retrieveKeyPair()
    }

    let communityKeyPair = cache.findKeyPair(communityUUID)
    if (!communityKeyPair) {
      communityKeyPair = new HomeCommunityKeyPairRole().generateKeyPair()
      cache.addKeyPair(communityUUID, communityKeyPair)
    }
    if (input instanceof UserIdentifier) {
      const userKeyPair = new UserKeyPairRole(input, communityKeyPair).generateKeyPair()
      const accountNr = input.communityUser?.accountNr ?? 1
      return new AccountKeyPairRole(accountNr, userKeyPair).generateKeyPair()
    }
    return communityKeyPair
  }

  keyPair = await retrieveKeyPair(input)
  cache.addKeyPair(input, keyPair)
  return keyPair
}
