// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG } from 'core'
import {
  AppDatabase,
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  User as DbUser,
  dbUpsertForeignMemberAvatarDates,
  foreignMemberAvatarDatesTable,
} from 'database'
import { GraphQLClient } from 'graphql-request'
import {
  createKeyPair,
  encryptAndSign,
  MemberAvatarPayload,
  MemberAvatarsJwtPayloadType,
  MemberAvatarsResponseJwtPayloadType,
  verifyAndDecrypt,
} from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { MEMBER_AVATARS_MAX_REFS } from '@/data/MemberAvatars.logic'
import { refreshForeignMemberAvatarDates } from './refreshForeignMemberAvatarDates'

/**
 * The run is called directly: no loop, no fake timers (drizzle is on the path, and jest's fake
 * timers would hang it -- AGENTS.md). The other community is a stub on `rawRequest` that opens
 * the question with its own key and seals a real answer for ours, so the envelope, the
 * tokentype and the checks of the answer (core xcomMemberAvatars) all run as they do between
 * two servers.
 */

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.refreshForeignMemberAvatarDates`)

const PICTURE = '2026-09-14T16:58:37.124Z'
const NEWER = '2026-09-15T08:01:02.345Z'
const LONG_AGO = new Date('2026-09-01T00:00:00.000Z')

let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}
let homeKeys: { publicKey: string; privateKey: string }
let peerKeys: { publicKey: string; privateKey: string }
let peer: DbCommunity
let peerUuid: string
let questions: MemberAvatarsJwtPayloadType[] = []
let rawRequest: jest.SpyInstance | undefined

/** A `users` row the way the federation stores the counterparty of a transfer. */
const storedMember = async (communityUuid: string): Promise<string> => {
  const row = DbUser.create()
  row.foreign = true
  row.communityUuid = communityUuid
  row.gradidoID = uuidv4()
  await row.save()
  return row.gradidoID
}

const pair = (communityUuid: string, gradidoId: string) => `${communityUuid}/${gradidoId}`

/** Everything the table holds, as plain values. */
const storedDates = async () => {
  const rows = await AppDatabase.getInstance()
    .getDrizzleDataSource()
    .select()
    .from(foreignMemberAvatarDatesTable)
  return Object.fromEntries(
    rows.map((row) => [
      pair(row.communityUuid, row.gradidoId),
      {
        avatarUpdatedAt: row.avatarUpdatedAt === null ? null : row.avatarUpdatedAt.toISOString(),
        checkedAt: row.checkedAt.toISOString(),
      },
    ]),
  )
}

const clearDates = async () => {
  await AppDatabase.getInstance().getDrizzleDataSource().delete(foreignMemberAvatarDatesTable)
}

/** The other community: opens the question with its key, answers sealed for ours. */
const peerAnswers = (answer: (question: MemberAvatarsJwtPayloadType) => MemberAvatarPayload[]) => {
  rawRequest = jest
    .spyOn(GraphQLClient.prototype, 'rawRequest')
    .mockImplementation((async (options: {
      variables: { args: { handshakeID: string; jwt: string } }
    }) => {
      const { args } = options.variables
      const question = (await verifyAndDecrypt(
        args.handshakeID,
        args.jwt,
        peerKeys.privateKey,
        homeKeys.publicKey,
      )) as MemberAvatarsJwtPayloadType | null
      if (!question) {
        throw new Error('the question does not verify with the key of the community asked')
      }
      questions.push(question)
      const token = await encryptAndSign(
        new MemberAvatarsResponseJwtPayloadType(args.handshakeID, answer(question)),
        peerKeys.privateKey,
        homeKeys.publicKey,
      )
      return { data: { memberAvatars: token }, status: 200 }
    }) as any)
}

const peerDoesNotAnswer = () => {
  rawRequest = jest
    .spyOn(GraphQLClient.prototype, 'rawRequest')
    .mockRejectedValue(new Error('connect ECONNREFUSED 192.0.2.1:443'))
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  await cleanDB()
  homeKeys = await createKeyPair()
  peerKeys = await createKeyPair()
  await DbCommunity.create({
    foreign: false,
    url: 'http://home.invalid/api/',
    publicKey: randomBytes(32),
    communityUuid: uuidv4(),
    name: 'Home community',
    description: 'this side of the border',
    creationDate: new Date(),
    publicJwtKey: homeKeys.publicKey,
    privateJwtKey: homeKeys.privateKey,
  }).save()
  peerUuid = uuidv4()
  peer = await DbCommunity.create({
    foreign: true,
    url: 'http://peer.invalid/api/',
    publicKey: randomBytes(32),
    communityUuid: peerUuid,
    authenticatedAt: new Date(),
    name: 'Peer community',
    description: 'the other side of the border',
    creationDate: new Date(),
    publicJwtKey: peerKeys.publicKey,
  }).save()
  await DbFederatedCommunity.create({
    foreign: true,
    publicKey: peer.publicKey,
    apiVersion: CORE_CONFIG.FEDERATION_BACKEND_SEND_ON_API,
    endPoint: 'http://peer.invalid/api/',
  }).save()
})

beforeEach(() => {
  questions = []
  jest.clearAllMocks()
})

afterEach(() => {
  rawRequest?.mockRestore()
  rawRequest = undefined
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
})

describe('refreshForeignMemberAvatarDates', () => {
  describe('a community with two stored members', () => {
    let anna: string
    let otto: string

    beforeEach(async () => {
      await clearDates()
      await DbUser.delete({ foreign: true })
      anna = await storedMember(peerUuid)
      otto = await storedMember(peerUuid)
    })

    it('stores the date the other community names, and null for the member it does not name', async () => {
      peerAnswers(() => [{ gradidoID: anna, avatarUpdatedAt: PICTURE, avatar: null }])

      await refreshForeignMemberAvatarDates()

      // Asked for the dates only, and about exactly the members stored for that community.
      expect(questions).toEqual([
        expect.objectContaining({ kind: 'dates', gradidoIDs: [anna, otto] }),
      ])
      const stored = await storedDates()
      expect(Object.keys(stored).sort()).toEqual(
        [pair(peerUuid, anna), pair(peerUuid, otto)].sort(),
      )
      expect(stored[pair(peerUuid, anna)].avatarUpdatedAt).toBe(PICTURE)
      // ★ Not named: nothing to show there.
      expect(stored[pair(peerUuid, otto)].avatarUpdatedAt).toBeNull()
    })

    /**
     * ★ The reason AS-019 exists: what changes over there has to reach the lists here. A new
     * picture brings its date, and a withdrawn one -- the member is simply no longer named --
     * takes the stored date away, so every wallet here forgets the face.
     */
    it('brings a new picture and a withdrawal to what was stored', async () => {
      await dbUpsertForeignMemberAvatarDates([
        {
          communityUuid: peerUuid,
          gradidoId: anna,
          avatarUpdatedAt: new Date(PICTURE),
          checkedAt: LONG_AGO,
        },
        {
          communityUuid: peerUuid,
          gradidoId: otto,
          avatarUpdatedAt: new Date(PICTURE),
          checkedAt: LONG_AGO,
        },
      ])
      peerAnswers(() => [{ gradidoID: anna, avatarUpdatedAt: NEWER, avatar: null }])

      await refreshForeignMemberAvatarDates()

      const stored = await storedDates()
      expect(stored[pair(peerUuid, anna)].avatarUpdatedAt).toBe(NEWER)
      expect(stored[pair(peerUuid, otto)].avatarUpdatedAt).toBeNull()
      expect(new Date(stored[pair(peerUuid, anna)].checkedAt).getTime()).toBeGreaterThan(
        LONG_AGO.getTime(),
      )
    })

    /**
     * ⛔ A community that is away for a moment must not take all its faces off the lists: what
     * was stored stays, untouched, and nothing new is written.
     */
    it('keeps what it had when the other community does not answer, and writes nothing', async () => {
      await dbUpsertForeignMemberAvatarDates([
        {
          communityUuid: peerUuid,
          gradidoId: anna,
          avatarUpdatedAt: new Date(PICTURE),
          checkedAt: LONG_AGO,
        },
      ])
      peerDoesNotAnswer()

      await refreshForeignMemberAvatarDates()

      expect(await storedDates()).toEqual({
        [pair(peerUuid, anna)]: { avatarUpdatedAt: PICTURE, checkedAt: LONG_AGO.toISOString() },
      })
      // The one trace an admin has of a community that stays silent, naming it.
      expect(logger.warn).toHaveBeenCalledWith(
        'no picture dates from another community',
        expect.stringContaining(peerUuid),
      )
    })
  })

  describe('a community with more stored members than one request may name', () => {
    beforeAll(async () => {
      await DbUser.delete({ foreign: true })
      await DbUser.insert(
        Array.from({ length: MEMBER_AVATARS_MAX_REFS + 1 }, () => ({
          foreign: true,
          communityUuid: peerUuid,
          gradidoID: uuidv4(),
        })),
      )
    })

    beforeEach(async () => {
      await clearDates()
    })

    afterAll(async () => {
      await DbUser.delete({ foreign: true })
    })

    it('asks in blocks no larger than one request may be, and stores every answer', async () => {
      peerAnswers((question) =>
        question.gradidoIDs.map((gradidoID) => ({
          gradidoID,
          avatarUpdatedAt: PICTURE,
          avatar: null,
        })),
      )

      await refreshForeignMemberAvatarDates()

      expect(questions.map((question) => question.gradidoIDs.length)).toEqual([
        MEMBER_AVATARS_MAX_REFS,
        1,
      ])
      expect(Object.keys(await storedDates())).toHaveLength(MEMBER_AVATARS_MAX_REFS + 1)
    })

    // A community that does not answer the first block is not asked the next one in the same
    // run: each block would only wait out the time limit again.
    it('does not ask a failing community for its next block', async () => {
      peerDoesNotAnswer()

      await refreshForeignMemberAvatarDates()

      expect(rawRequest).toHaveBeenCalledTimes(1)
      expect(await storedDates()).toEqual({})
    })
  })

  describe('whom it does not ask', () => {
    let stranger: DbCommunity
    let strangerEntry: DbFederatedCommunity

    beforeAll(async () => {
      await clearDates()
      await DbUser.delete({ foreign: true })
      // Everything the question needs -- a key, a uuid, a federation entry, members stored of
      // it -- except the completed handshake. The other side would refuse; asking would only
      // cost the time limit. ⚠️ The entry and the key the stub opens questions with are part of
      // the fixture on purpose: without them a question to this community would fail before it
      // is sent, and the check below would hold even if the handshake were not asked about.
      stranger = await DbCommunity.create({
        foreign: true,
        url: 'http://stranger.invalid/api/',
        publicKey: randomBytes(32),
        communityUuid: uuidv4(),
        authenticatedAt: null,
        name: 'Stranger community',
        description: 'never shook hands',
        creationDate: new Date(),
        publicJwtKey: peerKeys.publicKey,
      }).save()
      strangerEntry = await DbFederatedCommunity.create({
        foreign: true,
        publicKey: stranger.publicKey,
        apiVersion: CORE_CONFIG.FEDERATION_BACKEND_SEND_ON_API,
        endPoint: 'http://stranger.invalid/api/',
      }).save()
      await storedMember(stranger.communityUuid as string)
    })

    afterAll(async () => {
      await DbUser.delete({ foreign: true })
      await DbFederatedCommunity.delete({ id: strangerEntry.id })
      await DbCommunity.delete({ id: stranger.id })
    })

    it('asks neither a community without stored members nor one without the handshake', async () => {
      peerAnswers(() => [])

      await refreshForeignMemberAvatarDates()

      expect(rawRequest).not.toHaveBeenCalled()
      expect(await storedDates()).toEqual({})
    })
  })
})
