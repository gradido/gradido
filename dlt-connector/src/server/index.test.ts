import { appRoutes } from '.'
import { describe, it, expect, beforeAll, mock } from 'bun:test'
import { KeyPairCacheManager } from '../KeyPairCacheManager'
import { hieroIdSchema } from '../schemas/typeGuard.schema'
import { parse } from 'valibot'
import { HieroId } from '../schemas/typeGuard.schema'
import { GradidoTransaction, KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'

const userUuid = '408780b2-59b3-402a-94be-56a4f4f4e8ec'

mock.module('../KeyPairCacheManager', () => {
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

mock.module('../client/hiero/HieroClient', () => ({
  HieroClient: {
    getInstance: () => ({
      sendMessage: (topicId: HieroId, transaction: GradidoTransaction) => {
        return { receipt: { status: '0.0.21732' }, response: { transactionId: '0.0.6566984@1758029639.561157605' } }
      },
    }),
  },
}))

mock.module('../config', () => ({
  CONFIG: {
    HOME_COMMUNITY_SEED: MemoryBlock.fromHex('0102030401060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fe7'),
  },
}))

beforeAll(() => {
  KeyPairCacheManager.getInstance().setHomeCommunityTopicId(parse(hieroIdSchema, '0.0.21732'))
})

describe('Server', () => {
  it('send register address transaction', async () => {
    const transaction = {
      user: {
        communityTopicId: '0.0.21732',
        account: {
          userUuid,
          accountNr: 0,
        },
      },
      type: 'REGISTER_ADDRESS',
      accountType: 'COMMUNITY_HUMAN',
      createdAt: '2022-01-01T00:00:00.000Z',
    }
    const response = await appRoutes.handle(new Request('http://localhost/sendTransaction', {
      method: 'POST',
      body: JSON.stringify(transaction),
      headers: {
        'Content-Type': 'application/json',
      },
    }))
    if (response.status !== 200) {
      console.log(await response.text())
    }
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('0.0.6566984@1758029639.561157605')
  })
})
