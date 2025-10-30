import { CommunityDb, UserDb } from './database'
import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { CONFIG } from '../../config'
import { HieroId } from '../../schemas/typeGuard.schema'
import { UserKeyPairRole } from '../../interactions/resolveKeyPair/UserKeyPair.role'
import { AccountKeyPairRole } from '../../interactions/resolveKeyPair/AccountKeyPair.role'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.keyPair`)

export function generateKeyPairCommunity(community: CommunityDb, cache: KeyPairCacheManager, topicId: HieroId): void {
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
  const communityKeyPairKey = new KeyPairIdentifierLogic({ communityTopicId: topicId }).getKey()
  cache.addKeyPair(communityKeyPairKey, keyPair)
  logger.info(`Community Key Pair added with key: ${communityKeyPairKey}`)
}

export function generateKeyPairUserAccount(user: UserDb, cache: KeyPairCacheManager, communityTopicId: HieroId): void {
  const communityKeyPair = cache.findKeyPair(communityTopicId)!
  const userKeyPair = new UserKeyPairRole(user.gradidoId, communityKeyPair).generateKeyPair()  
  const userKeyPairKey = new KeyPairIdentifierLogic({ 
    communityTopicId: communityTopicId, 
    account: {
      userUuid: user.gradidoId,
      accountNr: 0
    }
  }).getKey()
  cache.addKeyPair(userKeyPairKey, userKeyPair)

  const accountKeyPair = new AccountKeyPairRole(1, userKeyPair).generateKeyPair()  
  const accountKeyPairKey = new KeyPairIdentifierLogic({ 
    communityTopicId: communityTopicId, 
    account: {
      userUuid: user.gradidoId,
      accountNr: 1
    }
  }).getKey()
  cache.addKeyPair(accountKeyPairKey, accountKeyPair)
  logger.info(`Key Pairs for user and account added, user: ${userKeyPairKey}, account: ${accountKeyPairKey}`)
}