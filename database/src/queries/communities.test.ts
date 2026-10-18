import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import {
  createEncryptionKeyPair,
  createKeyPair,
  Ed25519PublicKey,
  MissingHomeCommunityError,
} from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { Community as DbCommunity } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { CommunityUniqueKey } from '../enum'
import { DBUniqueKeyViolation } from '../errorTypes'
import { CommunitiesInsert, communitiesTable } from '../schemas'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import {
  dbFindForeignCommunitiesByUuid,
  dbInsertForeignCommunity,
  dbInsertHomeCommunity,
  dbIsMatchingKeyingActive,
  dbSelectAuthenticatedForeignCommunities,
  dbSelectHomeCommunity,
  dbUpdateForeignCommunity,
  dbUpdateHomeCommunity,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
  getHomeCommunityDrizzle,
  getHomeCommunityWithFederatedCommunityOrFail,
  getReachableCommunities,
  HOME_COMMUNITY_CHANGED_CHANNEL,
} from './communities'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('community.queries', () => {
  // clean db for every test case
  beforeEach(async () => {
    await dbDeleteAllRowsExceptMigrations()
    AppDatabase.getInstance().publish(HOME_COMMUNITY_CHANGED_CHANNEL)
  })
  describe('getHomeCommunity', () => {
    it('should return null if no home community exists', async () => {
      await createCommunity(true)
      expect(await getHomeCommunity()).toBeNull()
    })
    it('should return the home community', async () => {
      const homeCom = await createCommunity(false)
      const community = await getHomeCommunity()
      expect(community).toBeDefined()
      expect(community?.name).toBe(homeCom.name)
      expect(community?.description).toBe(homeCom.description)
      expect(community?.url).toBe(homeCom.url)
      expect(community?.creationDate).toStrictEqual(homeCom.creationDate)
      expect(community?.communityUuid).toBe(homeCom.communityUuid)
      expect(community?.authenticatedAt).toStrictEqual(homeCom.authenticatedAt)
      expect(community?.foreign).toBe(homeCom.foreign)
      expect(community?.publicKey).toStrictEqual(homeCom.publicKey)
      expect(community?.privateKey).toStrictEqual(homeCom.privateKey)
    })
  })
  describe('dbSelectHomeCommunity', () => {
    it('returns null if no home community exists', async () => {
      await createCommunity(true)
      expect(await dbSelectHomeCommunity()).toBeNull()
    })
    it('returns the home community', async () => {
      const homeCom = await createCommunity(false)
      expect(await dbSelectHomeCommunity()).toMatchObject({
        id: homeCom.id,
        foreign: false,
        communityUuid: homeCom.communityUuid,
        publicKey: homeCom.publicKey,
        privateKey: homeCom.privateKey,
      })
    })
  })
  describe('dbInsertHomeCommunity', () => {
    const homeCommunityInput = async () => {
      const jwtKeyPair = await createKeyPair()
      const encryptionKeyPair = createEncryptionKeyPair()
      return {
        publicKey: randomBytes(32),
        privateKey: randomBytes(64),
        communityUuid: uuidv4(),
        url: 'http://localhost/api/',
        name: 'HomeCommunity-name',
        description: 'HomeCommunity-description',
        creationDate: new Date('2026-01-01T12:00:00.000Z'),
        publicJwtKey: jwtKeyPair.publicKey,
        privateJwtKey: jwtKeyPair.privateKey,
        publicEncryptionKey: encryptionKeyPair.publicKey,
        privateEncryptionKey: encryptionKeyPair.privateKey,
      }
    }

    it('inserts the home community as not foreign', async () => {
      const input = await homeCommunityInput()
      await dbInsertHomeCommunity(input)
      // Drizzle: the TypeORM entity does not know the encryption keys
      const rows = await drizzleDb().select().from(communitiesTable)
      expect(rows).toEqual([
        expect.objectContaining({
          ...input,
          id: expect.any(Number),
          foreign: false,
          createdAt: expect.any(Date),
          updatedAt: null,
        }),
      ])
    })
    it('throws on invalid input and inserts nothing', async () => {
      const input = await homeCommunityInput()
      await expect(
        dbInsertHomeCommunity({ ...input, publicKey: randomBytes(16) }),
      ).rejects.toThrow()
      expect(await DbCommunity.count()).toBe(0)
    })
    it('is visible through the cached getter afterwards', async () => {
      // "no home community" is not cached, the next call reads again
      await expect(getHomeCommunityDrizzle()).rejects.toBeInstanceOf(MissingHomeCommunityError)
      const input = await homeCommunityInput()
      await dbInsertHomeCommunity(input)
      expect(await getHomeCommunityDrizzle()).toMatchObject({
        communityUuid: input.communityUuid,
      })
    })
  })
  describe('dbUpdateHomeCommunity', () => {
    it('updates only the given fields and sets updatedAt', async () => {
      const homeCom = await createCommunity(false)
      await dbUpdateHomeCommunity({ name: 'new name', url: 'http://new/api/' })
      const updated = await DbCommunity.findOneByOrFail({ id: homeCom.id })
      expect(updated).toEqual({
        ...homeCom,
        name: 'new name',
        url: 'http://new/api/',
        updatedAt: expect.any(Date),
      })
    })
    it('does not write the keys', async () => {
      const homeCom = await createCommunity(false)
      // as plain JS would hand them in, past the type
      const values = { name: 'new name', publicKey: randomBytes(32), privateKey: randomBytes(64) }
      await dbUpdateHomeCommunity(values)
      const updated = await DbCommunity.findOneByOrFail({ id: homeCom.id })
      expect(updated).toEqual({ ...homeCom, name: 'new name', updatedAt: expect.any(Date) })
    })
    it('leaves other communities alone', async () => {
      const foreign = await createCommunity(true)
      await createCommunity(false)
      await dbUpdateHomeCommunity({ name: 'new name' })
      expect(await DbCommunity.findOneByOrFail({ id: foreign.id })).toEqual(foreign)
    })
    it('throws MissingHomeCommunityError without a home community', async () => {
      await createCommunity(true)
      await expect(dbUpdateHomeCommunity({ name: 'new name' })).rejects.toBeInstanceOf(
        MissingHomeCommunityError,
      )
    })
    it('writes a location and reads it back as GeoJSON point', async () => {
      await createCommunity(false)
      await dbUpdateHomeCommunity({ location: { type: 'Point', coordinates: [13.4, 52.5] } })
      expect((await dbSelectHomeCommunity())?.location).toEqual({
        type: 'Point',
        coordinates: [13.4, 52.5],
      })
    })
    it('invalidates the cached home community in other processes too', async () => {
      // Another process changes the row and publishes the change. Simulated: the row is
      // written past dbUpdateHomeCommunity, then the message is published on Redis by hand.
      const homeCom = await createCommunity(false)
      expect((await getHomeCommunityDrizzle()).name).toBe('HomeCommunity-name')
      // the cache keeps the row only once Redis has confirmed the subscription
      await AppDatabase.getInstance().subscribe(HOME_COMMUNITY_CHANGED_CHANNEL, () => undefined)
      expect((await getHomeCommunityDrizzle()).name).toBe('HomeCommunity-name')
      await drizzleDb()
        .update(communitiesTable)
        .set({ name: 'changed elsewhere' })
        .where(eq(communitiesTable.id, homeCom.id))
      expect((await getHomeCommunityDrizzle()).name).toBe('HomeCommunity-name')

      await AppDatabase.getInstance().getRedisClient().publish(HOME_COMMUNITY_CHANGED_CHANNEL, '')
      // the message of another process arrives asynchronously
      for (let attempt = 0; attempt < 50; attempt++) {
        if ((await getHomeCommunityDrizzle()).name === 'changed elsewhere') {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      expect((await getHomeCommunityDrizzle()).name).toBe('changed elsewhere')
    })
    it('invalidates the cached home community', async () => {
      await createCommunity(false)
      expect((await getHomeCommunityDrizzle())?.name).toBe('HomeCommunity-name')
      await dbUpdateHomeCommunity({ name: 'new name' })
      expect((await getHomeCommunityDrizzle())?.name).toBe('new name')
    })
  })
  describe('dbIsMatchingKeyingActive', () => {
    it('is off for a community that was never switched on', async () => {
      // The state every existing row is in after migration 0127, and the reason the
      // column exists: the first keying run works through the whole backlog and pays
      // per entry, so somebody has to say when that starts.
      await createCommunity(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('is turned on and off again through dbUpdateHomeCommunity', async () => {
      // The write the admin panel uses. It clears the cached home community, which
      // dbIsMatchingKeyingActive reads through.
      await createCommunity(false)
      expect(await dbIsMatchingKeyingActive()).toBe(false)

      await dbUpdateHomeCommunity({ matchingKeyingActive: true })
      expect(await dbIsMatchingKeyingActive()).toBe(true)

      await dbUpdateHomeCommunity({ matchingKeyingActive: false })
      expect(await dbIsMatchingKeyingActive()).toBe(false)
    })

    it('leaves a foreign community alone', async () => {
      // ⛔ Scoped to the home community, like the read. A foreign row is another
      // community's, and what they pay for is not ours to set.
      const foreign = await createCommunity(true)
      await createCommunity(false)

      await dbUpdateHomeCommunity({ matchingKeyingActive: true })

      const [row] = await drizzleDb()
        .select({ active: communitiesTable.matchingKeyingActive })
        .from(communitiesTable)
        .where(eq(communitiesTable.id, foreign.id))
      expect(row.active).toBe(false)
    })

    it('throws MissingHomeCommunityError when there is no home community at all', async () => {
      // Not answered as "off": without a home community the backend does not start
      // (backend/src/index.ts), so this is not a state the keying run meets.
      await createCommunity(true)
      await expect(dbIsMatchingKeyingActive()).rejects.toBeInstanceOf(MissingHomeCommunityError)
    })
  })
  describe('dbSelectAuthenticatedForeignCommunities', () => {
    const withJwtKey = async (community: DbCommunity): Promise<DbCommunity> => {
      community.publicJwtKey = 'a public jwt key'
      return await community.save()
    }

    // a community without uuid cannot exist any more: community_uuid is NOT NULL since 0162
    it('finds the foreign communities through the handshake with a key, and no other', async () => {
      // `createCommunity(true)` is already authenticated and has a uuid; each of the others
      // lacks exactly one part.
      const first = await withJwtKey(await createCommunity(true))
      await createCommunity(true) // no JWT key: nothing to seal a question with
      const notAuthenticated = await createCommunity(true)
      notAuthenticated.authenticatedAt = null
      await withJwtKey(notAuthenticated)
      const home = await createCommunity(false)
      home.authenticatedAt = new Date()
      await withJwtKey(home)
      const second = await withJwtKey(await createCommunity(true))

      const found = await dbSelectAuthenticatedForeignCommunities()

      expect(found.map((community) => community.id)).toEqual([first.id, second.id])
      // The entity itself, with what the question needs.
      expect(found[0].publicJwtKey).toBe('a public jwt key')
      expect(found[0].communityUuid).toBe(first.communityUuid)
    })

    it('finds none without such a community', async () => {
      await createCommunity(false)
      expect(await dbSelectAuthenticatedForeignCommunities()).toEqual([])
    })
  })

  describe('getHomeCommunityWithFederatedCommunityOrFail', () => {
    it('should return the home community with federated communities', async () => {
      const homeCom = await createCommunity(false)
      await createVerifiedFederatedCommunity('1_0', 100, homeCom)
      const community = await getHomeCommunityWithFederatedCommunityOrFail('1_0')
      expect(community).toBeDefined()
      expect(community?.federatedCommunities).toHaveLength(1)
    })

    it('should throw if no home community exists', async () => {
      expect(getHomeCommunityWithFederatedCommunityOrFail('1_0')).rejects.toThrow()
    })

    it('should throw if no federated community exists', async () => {
      await createCommunity(false)
      expect(getHomeCommunityWithFederatedCommunityOrFail('1_0')).rejects.toThrow()
    })

    it('load community by public key returned from getHomeCommunityWithFederatedCommunityOrFail', async () => {
      const homeCom = await createCommunity(false)
      await createVerifiedFederatedCommunity('1_0', 100, homeCom)
      const community = await getHomeCommunityWithFederatedCommunityOrFail('1_0')
      expect(community).toBeDefined()
      expect(community?.federatedCommunities).toHaveLength(1)
      const ed25519PublicKey = new Ed25519PublicKey(community.federatedCommunities![0].publicKey)
      const communityByPublicKey = await getCommunityByPublicKeyOrFail(ed25519PublicKey)
      expect(communityByPublicKey).toBeDefined()
      expect(communityByPublicKey?.communityUuid).toBe(homeCom.communityUuid)
    })
  })
  describe('getReachableCommunities', () => {
    it('home community counts also to reachable communities', async () => {
      await createCommunity(false)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign communities authenticated within chosen range', async () => {
      const com1 = await createCommunity(true)
      const com2 = await createCommunity(true)
      const com3 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      await createVerifiedFederatedCommunity('1_0', 500, com2)
      // outside of range
      await createVerifiedFederatedCommunity('1_0', 1200, com3)

      const communities = await getReachableCommunities(1000)
      expect(communities).toHaveLength(2)
      expect(communities[0].communityUuid).toBe(com1.communityUuid)
      expect(communities[1].communityUuid).toBe(com2.communityUuid)
    })
    it('multiple federated community api version, result in one community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      await createVerifiedFederatedCommunity('1_1', 100, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('multiple federated community api version one outside of range, result in one community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 100, com1)
      // outside of range
      await createVerifiedFederatedCommunity('1_1', 1200, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign and home community', async () => {
      // home community
      await createCommunity(false)
      const com1 = await createCommunity(true)
      const com2 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 400, com1)
      await createVerifiedFederatedCommunity('1_0', 1200, com2)
      expect(await getReachableCommunities(1000)).toHaveLength(2)
    })
    it('not verified inside time frame federated community', async () => {
      const com1 = await createCommunity(true)
      await createVerifiedFederatedCommunity('1_0', 1200, com1)
      expect(await getReachableCommunities(1000)).toHaveLength(0)
    })
  })

  // a foreign community as the validation writes it from the answer of its community info
  const answerOf = (publicKey: Buffer, url: string): CommunitiesInsert => ({
    foreign: true,
    url,
    publicKey,
    communityUuid: uuidv4(),
    name: 'Answered-name',
    description: 'Answered-description',
    creationDate: new Date('2024-05-06T07:08:09.123Z'),
    publicJwtKey: 'answered-public-jwt-key',
    publicEncryptionKey: randomBytes(32),
    hieroTopicId: '0.0.2',
    authenticatedAt: new Date('2026-01-02T03:04:05.678Z'),
    updatedAt: new Date('2026-01-02T03:04:05.678Z'),
  })
  const communitiesOf = (publicKey: Buffer) =>
    drizzleDb().select().from(communitiesTable).where(eq(communitiesTable.publicKey, publicKey))

  describe('dbInsertForeignCommunity', () => {
    it('inserts a community not known yet', async () => {
      const publicKey = randomBytes(32)
      const answer = answerOf(publicKey, 'http://foreign.example/api/')

      expect(await dbInsertForeignCommunity(answer)).toEqual({ success: true })

      const communities = await communitiesOf(publicKey)
      expect(communities).toHaveLength(1)
      expect(communities[0]).toMatchObject(answer)
    })

    // the unique keys of communities, migration 0162 restored the one on the public key
    describe('names the unique key that refused it', () => {
      const refusedBy = async (community: CommunitiesInsert, uniqueKey: CommunityUniqueKey) => {
        const result = await dbInsertForeignCommunity(community)
        expect(result.success).toBe(false)
        const error = !result.success ? result.error : null
        expect(error).toBeInstanceOf(DBUniqueKeyViolation)
        expect((error as DBUniqueKeyViolation<CommunityUniqueKey>).uniqueKey).toBe(uniqueKey)
      }

      it('a uuid in use', async () => {
        const stored = await createCommunity(true)
        await refusedBy(
          {
            ...answerOf(randomBytes(32), 'http://new.example/api/'),
            communityUuid: stored.communityUuid,
          },
          CommunityUniqueKey.COMMUNITY_UUID,
        )
      })

      it('a public key in use', async () => {
        const stored = await createCommunity(true)
        await refusedBy(
          answerOf(stored.publicKey, 'http://moved.example/api/'),
          CommunityUniqueKey.PUBLIC_KEY,
        )
        expect(await communitiesOf(stored.publicKey)).toHaveLength(1)
      })

      it('a url in use', async () => {
        const stored = await createCommunity(true)
        await refusedBy(answerOf(randomBytes(32), stored.url), CommunityUniqueKey.URL)
      })
    })

    it('leaves the transaction going on after a refusal', async () => {
      const stored = await createCommunity(true)
      const next = randomBytes(32)

      await drizzleDb().transaction(async (tx) => {
        const refused = await dbInsertForeignCommunity(
          answerOf(stored.publicKey, 'http://moved.example/api/'),
          tx,
        )
        expect(refused.success).toBe(false)
        expect(
          await dbInsertForeignCommunity(answerOf(next, 'http://next.example/api/'), tx),
        ).toEqual({ success: true })
      })

      expect(await communitiesOf(next)).toHaveLength(1)
    })
  })

  describe('dbUpdateForeignCommunity', () => {
    it('changes what it is given and keeps the rest', async () => {
      const community = await createCommunity(true)
      community.publicJwtKey = 'stored-public-jwt-key'
      await community.save()

      expect(
        await dbUpdateForeignCommunity(community.id, {
          name: 'Answered-name',
          description: 'Answered-description',
          hieroTopicId: '0.0.2',
        }),
      ).toBe(true)

      const [stored] = await communitiesOf(community.publicKey)
      expect(stored).toMatchObject({
        name: 'Answered-name',
        description: 'Answered-description',
        hieroTopicId: '0.0.2',
        url: community.url,
        communityUuid: community.communityUuid,
        publicJwtKey: 'stored-public-jwt-key',
        creationDate: community.creationDate,
        authenticatedAt: community.authenticatedAt,
      })
    })

    it('leaves the home community alone', async () => {
      const home = await createCommunity(false)

      expect(await dbUpdateForeignCommunity(home.id, { name: 'Answered-name' })).toBe(false)

      const [stored] = await communitiesOf(home.publicKey)
      expect(stored.name).toBe(home.name)
    })
  })

  describe('dbFindForeignCommunitiesByUuid', () => {
    it('hands out the foreign communities with these uuids, by their uuid', async () => {
      const first = await createCommunity(true)
      const second = await createCommunity(true)

      const found = await dbFindForeignCommunitiesByUuid([
        first.communityUuid!,
        second.communityUuid!,
      ])

      expect([...found.keys()].sort()).toEqual([first.communityUuid, second.communityUuid].sort())
      expect(found.get(first.communityUuid!)).toMatchObject({
        id: first.id,
        url: first.url,
        publicKey: first.publicKey,
      })
    })

    it('skips other uuids and the home community', async () => {
      const home = await createCommunity(false)
      await createCommunity(true)

      const found = await dbFindForeignCommunitiesByUuid([home.communityUuid!, uuidv4()])

      expect(found.size).toBe(0)
    })

    it('hands out nothing for no uuids', async () => {
      await createCommunity(true)

      expect((await dbFindForeignCommunitiesByUuid([])).size).toBe(0)
    })
  })
})
