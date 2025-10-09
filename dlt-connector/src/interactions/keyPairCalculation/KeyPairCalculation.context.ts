import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { KeyPairCacheManager } from '../../KeyPairCacheManager'
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
export async function KeyPairCalculation(input: KeyPairIdentifierLogic): Promise<KeyPairEd25519> {
  const cache = KeyPairCacheManager.getInstance()
  return await cache.getKeyPair(input.getKey(), async () => {
    if (input.isSeedKeyPair()) {
      return new LinkedTransactionKeyPairRole(input.getSeed()).generateKeyPair()
    }
    // If input does not belong to the home community, handle as remote key pair
    if (cache.getHomeCommunityTopicId() !== input.getCommunityTopicId()) {
      const role = input.isAccountKeyPair()
        ? new RemoteAccountKeyPairRole(input.identifier)
        : new ForeignCommunityKeyPairRole(input.getCommunityTopicId())
      return await role.retrieveKeyPair()
    }
    const communityKeyPair = await cache.getKeyPair(input.getCommunityKey(), async () => {
      return new HomeCommunityKeyPairRole().generateKeyPair()
    })
    if (!communityKeyPair) {
      throw new Error("couldn't generate community key pair")
    }
    if (input.isCommunityKeyPair()) {
      return communityKeyPair
    }
    const userKeyPair = await cache.getKeyPair(input.getCommunityUserKey(), async () => {
      return new UserKeyPairRole(input.getUserUuid(), communityKeyPair).generateKeyPair()
    })
    if (!userKeyPair) {
      throw new Error("couldn't generate user key pair")
    }
    if (input.isUserKeyPair()) {
      return userKeyPair
    }
    const accountNr = input.getAccountNr()
    const accountKeyPair = new AccountKeyPairRole(accountNr, userKeyPair).generateKeyPair()
    if (input.isAccountKeyPair()) {
      return accountKeyPair
    }
    throw new Error("couldn't generate account key pair, unexpected type")
  })
}
