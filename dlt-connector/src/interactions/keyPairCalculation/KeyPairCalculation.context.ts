import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { KeyPairIdentifier } from '@/data/KeyPairIdentifier'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { KeyPairCacheManager } from '@/manager/KeyPairCacheManager'
import { LogError } from '@/server/LogError'

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
export async function KeyPairCalculation(input: KeyPairIdentifier): Promise<KeyPairEd25519> {
  const cache = KeyPairCacheManager.getInstance()

  // Try cache lookup first
  let keyPair = cache.findKeyPair(input)
  if (keyPair) {
    return keyPair
  }

  const retrieveKeyPair = async (input: KeyPairIdentifier): Promise<KeyPairEd25519> => {
    if (input.isSeedKeyPair() && input.seed) {
      return new LinkedTransactionKeyPairRole(input.seed).generateKeyPair()
    }
    if (!input.communityUuid) {
      throw new LogError('missing community id')
    }
    // If input does not belong to the home community, handle as remote key pair
    if (cache.getHomeCommunityUUID() !== input.communityUuid) {
      const role =
        input instanceof UserIdentifier
          ? new RemoteAccountKeyPairRole(input)
          : new ForeignCommunityKeyPairRole(input.communityUuid)
      return await role.retrieveKeyPair()
    }

    let communityKeyPair = cache.findKeyPair(input)
    if (!communityKeyPair) {
      communityKeyPair = new HomeCommunityKeyPairRole().generateKeyPair()
    }
    if (input.isCommunityKeyPair()) {
      return communityKeyPair
    }
    const userKeyPairIdentifier = new KeyPairIdentifier()
    userKeyPairIdentifier.communityUuid = input.communityUuid
    userKeyPairIdentifier.userUuid = input.userUuid

    let userKeyPair = cache.findKeyPair(userKeyPairIdentifier)
    if (!userKeyPair && userKeyPairIdentifier.userUuid) {
      userKeyPair = new UserKeyPairRole(
        userKeyPairIdentifier.userUuid,
        communityKeyPair,
      ).generateKeyPair()
    }
    if (!userKeyPair) {
      throw new LogError("couldn't generate user key pair")
    }
    if (input.isUserKeyPair()) {
      return userKeyPair
    }

    const accountNr = input.accountNr ?? 1
    return new AccountKeyPairRole(accountNr, userKeyPair).generateKeyPair()
  }

  keyPair = await retrieveKeyPair(input)
  cache.addKeyPair(input, keyPair)
  return keyPair
}
