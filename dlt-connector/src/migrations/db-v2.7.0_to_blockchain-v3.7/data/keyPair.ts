import { KeyPairEd25519, MemoryBlock, MemoryBlockPtr } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { KeyPairCacheManager } from '../../../cache/KeyPairCacheManager'
import { CONFIG } from '../../../config'
import { LOG4JS_BASE_CATEGORY } from '../../../config/const'
import { KeyPairIdentifierLogic } from '../../../data/KeyPairIdentifier.logic'
import { AccountKeyPairRole } from '../../../interactions/resolveKeyPair/AccountKeyPair.role'
import { UserKeyPairRole } from '../../../interactions/resolveKeyPair/UserKeyPair.role'
import { HieroId } from '../../../schemas/typeGuard.schema'
import { CommunityDb, UserDb } from '../valibot.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.keyPair`)

export function generateKeyPairCommunity(
  community: CommunityDb,
  cache: KeyPairCacheManager,
  topicId: HieroId,
): void {
  let seed: MemoryBlock | null = null
  if (community.foreign) {
    const randomBuffer = Buffer.alloc(32)
    for (let i = 0; i < 32; i++) {
      randomBuffer[i] = Math.floor(Math.random() * 256)
    }
    seed = new MemoryBlock(randomBuffer)
  } else {
    seed = new MemoryBlock(CONFIG.HOME_COMMUNITY_SEED)
  }
  const keyPair = KeyPairEd25519.create(seed)
  if (!keyPair) {
    throw new Error(`Couldn't create key pair for community ${community.communityUuid}`)
  }
  const communityKeyPairKey = new KeyPairIdentifierLogic({
    communityTopicId: topicId,
    communityId: community.communityUuid,
  }).getKey()
  cache.addKeyPair(communityKeyPairKey, keyPair)
  logger.info(`Community Key Pair added with key: ${communityKeyPairKey}`)
}

export async function generateKeyPairUserAccount(
  user: UserDb,
  cache: KeyPairCacheManager,
  communityTopicId: HieroId,
): Promise<{ userKeyPair: MemoryBlockPtr; accountKeyPair: MemoryBlockPtr }> {
  const communityKeyPair = cache.findKeyPair(communityTopicId)!
  const userKeyPairRole = new UserKeyPairRole(user.gradidoId, communityKeyPair)
  const userKeyPairKey = new KeyPairIdentifierLogic({
    communityTopicId: communityTopicId,
    communityId: user.communityUuid,
    account: {
      userUuid: user.gradidoId,
      accountNr: 0,
    },
  }).getKey()
  const userKeyPair = await cache.getKeyPair(userKeyPairKey, () =>
    Promise.resolve(userKeyPairRole.generateKeyPair()),
  )

  const accountKeyPairRole = new AccountKeyPairRole(1, userKeyPair)
  const accountKeyPairKey = new KeyPairIdentifierLogic({
    communityTopicId: communityTopicId,
    communityId: user.communityUuid,
    account: {
      userUuid: user.gradidoId,
      accountNr: 1,
    },
  }).getKey()
  const accountKeyPair = await cache.getKeyPair(accountKeyPairKey, () =>
    Promise.resolve(accountKeyPairRole.generateKeyPair()),
  )
  //logger.info(`Key Pairs for user and account added, user: ${userKeyPairKey}, account: ${accountKeyPairKey}`)
  return {
    userKeyPair: userKeyPair.getPublicKey()!,
    accountKeyPair: accountKeyPair.getPublicKey()!,
  }
}
