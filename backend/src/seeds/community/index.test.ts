// AI-GENERATED — not an architecture reference
import { cleanDB, testEnvironment } from '@test/helpers'
import { dbSelectHomeCommunity, dbUpdateHomeCommunity } from 'database'
import { CONFIG } from '@/config'
import { writeHomeCommunityEntry } from './index'

let destroyDb: () => Promise<void>

beforeAll(async () => {
  const testEnv = await testEnvironment()
  destroyDb = () => testEnv.db.destroy()
})

afterAll(async () => {
  await cleanDB()
  await destroyDb()
})

beforeEach(async () => {
  await cleanDB()
})

describe('writeHomeCommunityEntry', () => {
  it('writes a complete home community where there is none, and hands it back', async () => {
    const written = await writeHomeCommunityEntry()

    expect(await dbSelectHomeCommunity()).toEqual(written)
    expect(written).toMatchObject({
      foreign: false,
      url: 'http://localhost/api/',
      name: CONFIG.COMMUNITY_NAME,
      description: CONFIG.COMMUNITY_DESCRIPTION,
    })
    expect(written.publicKey).toHaveLength(32)
    expect(written.privateKey).toHaveLength(64)
    expect(written.publicEncryptionKey).toHaveLength(32)
    expect(written.privateEncryptionKey).toHaveLength(32)
    expect(written.publicJwtKey).toBeTruthy()
    expect(written.privateJwtKey).toBeTruthy()
  })

  it('leaves an existing one its id, uuid and keys, and sets it to this configuration', async () => {
    const first = await writeHomeCommunityEntry()
    await dbUpdateHomeCommunity({
      url: 'http://elsewhere.example/api/',
      name: 'Somewhere else',
      description: 'A community somewhere else',
    })

    const second = await writeHomeCommunityEntry()

    expect(second).toMatchObject({
      id: first.id,
      communityUuid: first.communityUuid,
      publicKey: first.publicKey,
      privateKey: first.privateKey,
      publicJwtKey: first.publicJwtKey,
      url: 'http://localhost/api/',
      name: CONFIG.COMMUNITY_NAME,
      description: CONFIG.COMMUNITY_DESCRIPTION,
    })
  })

  it('writes nothing when the existing one already matches', async () => {
    const first = await writeHomeCommunityEntry()

    await writeHomeCommunityEntry()

    expect((await dbSelectHomeCommunity())?.updatedAt).toEqual(first.updatedAt)
  })
})
