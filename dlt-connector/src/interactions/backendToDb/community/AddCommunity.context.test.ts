import 'reflect-metadata'
import { Community } from '@entity/Community'

import { TestDB } from '@test/TestDB'

import { CONFIG } from '@/config'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'

import { AddCommunityContext } from './AddCommunity.context'

CONFIG.IOTA_HOME_COMMUNITY_SEED = '034b0229a2ba4e98e1cc5e8767dca886279b484303ffa73546bd5f5bf0b71285'

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

describe('interactions/backendToDb/community/AddCommunity Context Test', () => {
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
  })

  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
  })

  const homeCommunityDraft = new CommunityDraft()
  homeCommunityDraft.uuid = 'a2fd0fee-f3ba-4bef-a62a-10a34b0e2754'
  homeCommunityDraft.foreign = false
  homeCommunityDraft.createdAt = '2024-01-25T13:09:55.339Z'
  // calculated from a2fd0fee-f3ba-4bef-a62a-10a34b0e2754 with iotaTopicFromCommunityUUID
  const iotaTopic = '7be2ad83f279a3aaf6d62371cb6be301e2e3c7a3efda9c89984e8f6a7865d9ce'

  const foreignCommunityDraft = new CommunityDraft()
  foreignCommunityDraft.uuid = '70df8de5-0fb7-4153-a124-4ff86965be9a'
  foreignCommunityDraft.foreign = true
  foreignCommunityDraft.createdAt = '2024-01-25T13:34:28.020Z'

  it('with home community, without iota topic', async () => {
    const context = new AddCommunityContext(homeCommunityDraft)
    await context.run()
    const homeCommunity = await Community.findOneOrFail({ where: { iotaTopic } })
    expect(homeCommunity).toMatchObject({
      id: 1,
      iotaTopic,
      foreign: 0,
      rootPubkey: Buffer.from(
        '07cbf56d4b6b7b188c5f6250c0f4a01d0e44e1d422db1935eb375319ad9f9af0',
        'hex',
      ),
      createdAt: new Date('2024-01-25T13:09:55.339Z'),
    })
  })

  it('with foreign community', async () => {
    const context = new AddCommunityContext(foreignCommunityDraft, 'randomTopic')
    await context.run()
    const foreignCommunity = await Community.findOneOrFail({ where: { foreign: true } })
    expect(foreignCommunity).toMatchObject({
      id: 2,
      iotaTopic: 'randomTopic',
      foreign: 1,
      createdAt: new Date('2024-01-25T13:34:28.020Z'),
    })
  })
})
