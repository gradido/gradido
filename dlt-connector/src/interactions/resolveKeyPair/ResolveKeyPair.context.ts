import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { AccountKeyPairRole } from './AccountKeyPair.role'
import { ForeignCommunityKeyPairRole } from './ForeignCommunityKeyPair.role'
import { HomeCommunityKeyPairRole } from './HomeCommunityKeyPair.role'
import { LinkedTransactionKeyPairRole } from './LinkedTransactionKeyPair.role'
import { RemoteAccountKeyPairRole } from './RemoteAccountKeyPair.role'
import { UserKeyPairRole } from './UserKeyPair.role'

/**
 * @DCI-Context
 * Context for resolving the correct KeyPair for signing Gradido transactions.
 *
 * The context determines — based on the given {@link KeyPairIdentifierLogic} —
 * which kind of KeyPair is required (community, user, account, remote, etc.).
 *
 * It first attempts to retrieve the KeyPair from the global {@link KeyPairCacheManager}.
 * If no cached KeyPair exists, it dynamically generates or fetches it using the appropriate Role:
 *   - {@link LinkedTransactionKeyPairRole} for seed-based keys
 *   - {@link RemoteAccountKeyPairRole} or {@link ForeignCommunityKeyPairRole} for remote communities
 *   - {@link HomeCommunityKeyPairRole} for local community keys
 *   - {@link UserKeyPairRole} and {@link AccountKeyPairRole} for user and account levels
 *
 * Once generated, the KeyPair is stored in the cache for future reuse.
 *
 * @param input - Key pair identification logic containing all attributes
 *                (communityTopicId, userUuid, accountNr, seed, etc.)
 * @returns The resolved {@link KeyPairEd25519} for the given input.
 *
 * @throws Error if the required KeyPair cannot be generated or resolved.
 */
export async function ResolveKeyPair(input: KeyPairIdentifierLogic): Promise<KeyPairEd25519> {
  const cache = KeyPairCacheManager.getInstance()

  return await cache.getKeyPair(
    input.getKey(),
    // function is called from cache manager, if key isn't currently cached
    async () => {
      // Seed (from linked transactions)
      if (input.isSeedKeyPair()) {
        return new LinkedTransactionKeyPairRole(input.getSeed()).generateKeyPair()
      }
      // Remote community branch
      if (cache.getHomeCommunityTopicId() !== input.getCommunityTopicId()) {
        const role = input.isAccountKeyPair()
          ? new RemoteAccountKeyPairRole(input.identifier)
          : new ForeignCommunityKeyPairRole(input.getCommunityId())
        return await role.retrieveKeyPair()
      }
      // Community
      const communityKeyPair = await cache.getKeyPair(input.getCommunityKey(), async () => {
        return new HomeCommunityKeyPairRole().generateKeyPair()
      })
      if (!communityKeyPair) {
        throw new Error("couldn't generate community key pair")
      }
      if (input.isCommunityKeyPair()) {
        return communityKeyPair
      }
      // User
      const userKeyPair = await cache.getKeyPair(input.getCommunityUserKey(), async () => {
        return new UserKeyPairRole(input.getUserUuid(), communityKeyPair).generateKeyPair()
      })
      if (!userKeyPair) {
        throw new Error("couldn't generate user key pair")
      }
      if (input.isUserKeyPair()) {
        return userKeyPair
      }
      // Account
      const accountNr = input.getAccountNr()
      const accountKeyPair = new AccountKeyPairRole(accountNr, userKeyPair).generateKeyPair()
      if (input.isAccountKeyPair()) {
        return accountKeyPair
      }
      throw new Error("couldn't generate account key pair, unexpected type")
    },
  )
}
