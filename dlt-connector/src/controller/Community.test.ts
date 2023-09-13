import 'reflect-metadata'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import {
  create as createCommunity,
  getAllTopics,
  iotaTopicFromCommunityUUID,
  isExist,
} from './Community'
import { TestDB } from '@test/TestDB'
import { getDataSource } from '@/typeorm/DataSource'

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: () => TestDB.instance.dbConnect,
}))

describe('controller/Community', () => {
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    // apolloTestServer = await createApolloTestServer()
  })

  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
  })

  describe('createCommunity', () => {
    it('valid community', async () => {
      const communityDraft = new CommunityDraft()
      communityDraft.foreign = false
      communityDraft.createdAt = '2022-05-01T17:00:12.128Z'
      communityDraft.uuid = '3d813cbb-47fb-32ba-91df-831e1593ac29'

      const iotaTopic = iotaTopicFromCommunityUUID(communityDraft.uuid)
      expect(iotaTopic).toEqual('204ef6aed15fbf0f9da5819e88f8eea8e3adbe1e2c2d43280780a4b8c2d32b56')

      const createdAtDate = new Date(communityDraft.createdAt)
      const communityEntity = createCommunity(communityDraft)
      expect(communityEntity).toMatchObject({
        iotaTopic,
        createdAt: createdAtDate,
        foreign: false,
      })
      await getDataSource().manager.save(communityEntity)
    })
  })

  describe('list communities', () => {
    it('get all topics', async () => {
      expect(await getAllTopics()).toMatchObject([
        '204ef6aed15fbf0f9da5819e88f8eea8e3adbe1e2c2d43280780a4b8c2d32b56',
      ])
    })

    it('isExist with communityDraft', async () => {
      const communityDraft = new CommunityDraft()
      communityDraft.foreign = false
      communityDraft.createdAt = '2022-05-01T17:00:12.128Z'
      communityDraft.uuid = '3d813cab-47fb-32ba-91df-831e1593ac29'
      expect(await isExist(communityDraft)).toBe(false)
    })
  })
})
