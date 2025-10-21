import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import { parse } from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { KeyPairCacheManager } from '../../KeyPairCacheManager'
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
const userUuid = 'aa25cf6f-2879-4745-b2ea-6d3c37fb44b0'

afterAll(() => {
  mock.restore()
})

describe('KeyPairCalculation', () => {
  beforeAll(() => {
    KeyPairCacheManager.getInstance().setHomeCommunityTopicId(parse(hieroIdSchema, '0.0.21732'))
  })
  it('community key pair', async () => {
    const identifier = new KeyPairIdentifierLogic(
      parse(identifierKeyPairSchema, { communityTopicId: topicId }),
    )
    const keyPair = await ResolveKeyPair(identifier)
    expect(keyPair.getPublicKey()?.convertToHex()).toBe(
      '7bcb0d0ad26d3f7ba597716c38a570220cece49b959e57927ee0c39a5a9c3adf',
    )
  })
  it('user key pair', async () => {
    const identifier = new KeyPairIdentifierLogic(
      parse(identifierKeyPairSchema, {
        communityTopicId: topicId,
        account: { userUuid },
      }),
    )
    expect(identifier.isAccountKeyPair()).toBe(false)
    expect(identifier.isUserKeyPair()).toBe(true)
    const keyPair = await ResolveKeyPair(identifier)
    expect(keyPair.getPublicKey()?.convertToHex()).toBe(
      'd61ae86c262fc0b5d763a8f41a03098fae73a7649a62aac844378a0eb0055921',
    )
  })

  it('account key pair', async () => {
    const identifier = new KeyPairIdentifierLogic(
      parse(identifierKeyPairSchema, {
        communityTopicId: topicId,
        account: { userUuid, accountNr: 1 },
      }),
    )
    expect(identifier.isAccountKeyPair()).toBe(true)
    expect(identifier.isUserKeyPair()).toBe(false)
    const keyPair = await ResolveKeyPair(identifier)
    expect(keyPair.getPublicKey()?.convertToHex()).toBe(
      '6cffb0ee0b20dae828e46f2e003f78ac57b85e7268e587703932f06e1b2daee4',
    )
  })
})
