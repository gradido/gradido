import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { createKeyPair, MissingHomeCommunityError } from 'shared'
import { X25519KeyPair } from 'shared-native'
import { v4 as uuidv4 } from 'uuid'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { CommunityUniqueKey } from '../enum'
import { DBUniqueKeyViolation } from '../errorTypes'
import { CommunitiesInsert, communitiesTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import {
  dbDeleteForeignCommunity,
  dbFindCommunityByUuid,
  dbFindForeignCommunityByPublicKey,
  dbFindForeignCommunityByUuid,
  dbInsertForeignCommunity,
  dbInsertHomeCommunity,
  dbIsMatchingKeyingActive,
  dbIsSupportTicketsActive,
  dbReplaceHomeCommunitySigningKeys,
  dbSelectAuthenticatedForeignCommunities,
  dbSelectAuthorizedCommunities,
  dbSelectCommunities,
  dbSelectHomeCommunity,
  dbSelectReachableCommunities,
  dbUpdateForeignCommunity,
  dbUpdateHomeCommunity,
  getHomeCommunityDrizzle,
  HOME_COMMUNITY_CHANGED_CHANNEL,
} from './communities'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

const verifiedBefore = (ms: number) => new Date(Date.now() - ms)

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
      const encryptionKeyPair = X25519KeyPair.generate()
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
        publicEncryptionKey: encryptionKeyPair.publicKeyToBuffer(),
        privateEncryptionKey: encryptionKeyPair.privateKeyToBuffer(),
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
      expect(await drizzleDb().select().from(communitiesTable)).toHaveLength(0)
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
      const updated = await dbFindCommunityByUuid(homeCom.communityUuid)
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
      const updated = await dbFindCommunityByUuid(homeCom.communityUuid)
      expect(updated).toEqual({ ...homeCom, name: 'new name', updatedAt: expect.any(Date) })
    })
    it('leaves other communities alone', async () => {
      const foreign = await createCommunity(true)
      await createCommunity(false)
      await dbUpdateHomeCommunity({ name: 'new name' })
      expect(await dbFindCommunityByUuid(foreign.communityUuid)).toEqual(foreign)
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

      await AppDatabase.getInstance()
        .getRedisClient()
        .publish(AppDatabase.getInstance().redisChannel(HOME_COMMUNITY_CHANGED_CHANNEL), '')
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
  describe('dbReplaceHomeCommunitySigningKeys', () => {
    it('replaces the signing keys and leaves the rest', async () => {
      const homeCom = await createCommunity(false)
      const publicKey = randomBytes(32)
      const privateKey = randomBytes(64)
      await dbReplaceHomeCommunitySigningKeys(publicKey, privateKey)
      expect(await dbFindCommunityByUuid(homeCom.communityUuid)).toEqual({
        ...homeCom,
        publicKey,
        privateKey,
        updatedAt: expect.any(Date),
      })
    })
    it('throws for keys of the wrong size', async () => {
      await createCommunity(false)
      await expect(
        dbReplaceHomeCommunitySigningKeys(randomBytes(32), randomBytes(32)),
      ).rejects.toThrow()
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
  describe('dbIsSupportTicketsActive', () => {
    it('is on for a community that was never switched (SUA-019, "ab Werk an")', async () => {
      await createCommunity(false)
      expect(await dbIsSupportTicketsActive()).toBe(true)
    })

    it('is turned off and on again through dbUpdateHomeCommunity, read through the cache', async () => {
      await createCommunity(false)
      expect(await dbIsSupportTicketsActive()).toBe(true)

      await dbUpdateHomeCommunity({ supportTicketsActive: false })
      expect(await dbIsSupportTicketsActive()).toBe(false)
      // the value in the database, not only what the cache answers (Falle 13: a field the
      // schema does not name would be dropped by the write without a word)
      const [row] = await drizzleDb()
        .select({ active: communitiesTable.supportTicketsActive })
        .from(communitiesTable)
        .where(eq(communitiesTable.foreign, false))
      expect(row.active).toBe(false)

      await dbUpdateHomeCommunity({ supportTicketsActive: true })
      expect(await dbIsSupportTicketsActive()).toBe(true)
    })

    it('leaves a foreign community alone', async () => {
      const foreign = await createCommunity(true)
      await createCommunity(false)

      await dbUpdateHomeCommunity({ supportTicketsActive: false })

      const [row] = await drizzleDb()
        .select({ active: communitiesTable.supportTicketsActive })
        .from(communitiesTable)
        .where(eq(communitiesTable.id, foreign.id))
      expect(row.active).toBe(true)
    })
  })
  describe('dbSelectAuthenticatedForeignCommunities', () => {
    it('finds the foreign communities through the handshake, and no other', async () => {
      // `createCommunity(true)` is already authenticated; each of the others lacks one part.
      const first = await createCommunity(true)
      await createCommunity(true, { authenticatedAt: null })
      await createCommunity(false, { authenticatedAt: new Date() })
      const second = await createCommunity(true)

      const found = await dbSelectAuthenticatedForeignCommunities()

      expect(found.map((community) => community.id)).toEqual([first.id, second.id])
      expect(found[0].communityUuid).toBe(first.communityUuid)
    })

    it('finds none without such a community', async () => {
      await createCommunity(false)
      expect(await dbSelectAuthenticatedForeignCommunities()).toEqual([])
    })
  })

  describe('dbSelectReachableCommunities', () => {
    it('home community counts also to reachable communities', async () => {
      await createCommunity(false)
      expect(await dbSelectReachableCommunities(1000)).toHaveLength(1)
    })
    it('foreign communities verified within chosen range', async () => {
      const com1 = await createCommunity(true, { verifiedAt: verifiedBefore(100) })
      const com2 = await createCommunity(true, { verifiedAt: verifiedBefore(500) })
      // outside of range
      await createCommunity(true, { verifiedAt: verifiedBefore(1200) })

      const communities = await dbSelectReachableCommunities(1000)
      // both carry the same name, so the order between them is open
      expect(communities.map((com) => com.communityUuid).sort()).toEqual(
        [com1.communityUuid, com2.communityUuid].sort(),
      )
    })
    it('foreign and home community', async () => {
      // home community
      await createCommunity(false)
      await createCommunity(true, { verifiedAt: verifiedBefore(400) })
      await createCommunity(true, { verifiedAt: verifiedBefore(1200) })
      expect(await dbSelectReachableCommunities(1000)).toHaveLength(2)
    })
    it('not verified inside time frame', async () => {
      await createCommunity(true, { verifiedAt: verifiedBefore(1200) })
      expect(await dbSelectReachableCommunities(1000)).toHaveLength(0)
    })
    it('never verified', async () => {
      await createCommunity(true)
      expect(await dbSelectReachableCommunities(1000)).toHaveLength(0)
    })
  })

  describe('dbSelectCommunities', () => {
    it('hands out the home community first, then the foreign ones, the newest first', async () => {
      const home = await createCommunity(false, { createdAt: new Date('2026-01-01T00:00:00Z') })
      const older = await createCommunity(true, { createdAt: new Date('2026-02-01T00:00:00Z') })
      const newer = await createCommunity(true, { createdAt: new Date('2026-03-01T00:00:00Z') })

      const { count, communities } = await dbSelectCommunities()

      expect(communities.map((com) => com.id)).toEqual([home.id, newer.id, older.id])
      expect(count).toBe(3)
    })

    it('hands out the page asked for', async () => {
      await createCommunity(false, { createdAt: new Date('2026-01-01T00:00:00Z') })
      const older = await createCommunity(true, { createdAt: new Date('2026-02-01T00:00:00Z') })
      await createCommunity(true, { createdAt: new Date('2026-03-01T00:00:00Z') })

      const { count, communities } = await dbSelectCommunities({ pageSize: 2, currentPage: 2 })

      expect(communities.map((com) => com.id)).toEqual([older.id])
      // all of them, not only those of the page
      expect(count).toBe(3)
    })

    it('pages through communities created at the same moment, each once, the last inserted first', async () => {
      const createdAt = new Date('2026-02-01T00:00:00Z')
      const home = await createCommunity(false, { createdAt })
      const ids = [
        (await createCommunity(true, { createdAt })).id,
        (await createCommunity(true, { createdAt })).id,
        (await createCommunity(true, { createdAt })).id,
      ]

      const paged: number[] = []
      for (let currentPage = 1; currentPage <= 4; currentPage++) {
        const { communities } = await dbSelectCommunities({ pageSize: 1, currentPage })
        paged.push(...communities.map((com) => com.id))
      }

      expect(paged).toEqual([home.id, ...ids.reverse()])
    })
  })

  describe('dbSelectAuthorizedCommunities', () => {
    it('hands out the home community first, then the foreign ones through the handshake', async () => {
      const foreign = await createCommunity(true)
      await createCommunity(true, { authenticatedAt: null })
      const home = await createCommunity(false)
      const communities = await dbSelectAuthorizedCommunities()
      expect(communities.map((com) => com.communityUuid)).toEqual([
        home.communityUuid,
        foreign.communityUuid,
      ])
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
      const community = await createCommunity(true, { publicJwtKey: 'stored-public-jwt-key' })

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

  describe('dbDeleteForeignCommunity', () => {
    it('deletes this community and leaves the others', async () => {
      const home = await createCommunity(false)
      const gone = await createCommunity(true)
      const kept = await createCommunity(true)
      await dbDeleteForeignCommunity(gone.id)
      const rows = await drizzleDb().select().from(communitiesTable).orderBy(communitiesTable.id)
      expect(rows.map((row) => row.id)).toEqual([home.id, kept.id])
    })

    it('leaves the home community alone', async () => {
      const home = await createCommunity(false)
      await dbDeleteForeignCommunity(home.id)
      expect(await dbSelectHomeCommunity()).toMatchObject({ id: home.id })
    })
  })

  describe('dbFindForeignCommunityByUuid', () => {
    it('hands out the foreign community with this uuid', async () => {
      await createCommunity(true)
      const foreign = await createCommunity(true)

      expect(await dbFindForeignCommunityByUuid(foreign.communityUuid)).toMatchObject({
        id: foreign.id,
        url: foreign.url,
        publicKey: foreign.publicKey,
      })
    })

    it('hands out nothing for another uuid or the home community', async () => {
      const home = await createCommunity(false)
      await createCommunity(true)

      expect(await dbFindForeignCommunityByUuid(home.communityUuid)).toBeNull()
      expect(await dbFindForeignCommunityByUuid(uuidv4())).toBeNull()
    })
  })

  describe('dbSelectForeignCommunityByPublicKey', () => {
    it('hands out the foreign community with this public key', async () => {
      await createCommunity(true)
      const foreign = await createCommunity(true)

      expect(await dbFindForeignCommunityByPublicKey(foreign.publicKey)).toMatchObject({
        id: foreign.id,
        communityUuid: foreign.communityUuid,
        publicEncryptionKey: foreign.publicEncryptionKey,
      })
    })

    it('hands out null for the home community and for an unknown key', async () => {
      const home = await createCommunity(false)
      await createCommunity(true)

      expect(await dbFindForeignCommunityByPublicKey(home.publicKey)).toBeNull()
      expect(await dbFindForeignCommunityByPublicKey(randomBytes(32))).toBeNull()
    })
  })
})
