import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { identifierKeyPairSchema } from '../../schemas/account.schema'
import { HieroId, hieroIdSchema } from '../../schemas/typeGuard.schema'
import { ResolveKeyPair } from './ResolveKeyPair.context'

mock.module('../../KeyPairCacheManager', () => {
  let homeCommunityTopicId: HieroId | undefined
  return {
    KeyPairCacheManager: {
      getInstance: () => ({
        setHomeCommunityTopicId: (topicId: HieroId) => {
          homeCommunityTopicId = topicId
        },
        getHomeCommunityTopicId: () => homeCommunityTopicId,
        getKeyPair: (key: string, create: () => KeyPairEd25519) => {
          return create()
        },
      }),
    },
  }
})

mock.module('../../config', () => ({
  CONFIG: {
    HOME_COMMUNITY_SEED: MemoryBlock.fromHex(
      '0102030401060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fe7',
    ),
  },
}))

const topicId = '0.0.21732'
const communityId = '1e88a0f4-d4fc-4cae-a7e8-a88e613ce324'
const userUuid = 'aa25cf6f-2879-4745-b2ea-6d3c37fb44b0'

afterAll(() => {
  mock.restore()
})

describe('KeyPairCalculation', () => {
  beforeAll(() => {
    KeyPairCacheManager.getInstance().setHomeCommunityTopicId(v.parse(hieroIdSchema, '0.0.21732'))
  })
  it('community key pair', async () => {
    const identifier = new KeyPairIdentifierLogic(
      v.parse(identifierKeyPairSchema, { communityId, communityTopicId: topicId }),
    )
    const keyPair = await ResolveKeyPair(identifier)
    expect(keyPair.getPublicKey()?.convertToHex()).toBe(
      '571ea784d90af7072b84ed6ff7246b54f101b39006dec5dd8532a6f0e2c6ba42',
    )
  })
  it('user key pair', async () => {
    const identifier = new KeyPairIdentifierLogic(
      v.parse(identifierKeyPairSchema, {
        communityId,
        communityTopicId: topicId,
        account: { userUuid },
      }),
    )
    expect(identifier.isAccountKeyPair()).toBe(false)
    expect(identifier.isUserKeyPair()).toBe(true)
    const keyPair = await ResolveKeyPair(identifier)
    expect(keyPair.getPublicKey()?.convertToHex()).toBe(
      '7cfaf45b6f87ca37ea7a566905497d6a8dde556ba773ed730c103158503f3c11',
    )
  })

  it('account key pair', async () => {
    const identifier = new KeyPairIdentifierLogic(
      v.parse(identifierKeyPairSchema, {
        communityId,
        communityTopicId: topicId,
        account: { userUuid, accountNr: 1 },
      }),
    )
    expect(identifier.isAccountKeyPair()).toBe(true)
    expect(identifier.isUserKeyPair()).toBe(false)
    const keyPair = await ResolveKeyPair(identifier)
    expect(keyPair.getPublicKey()?.convertToHex()).toBe(
      '1f4efb7fb7b00f8ba7031b6360732c404f1e357b0e786c1079eec72ca8b99e3f',
    )
  })
})
