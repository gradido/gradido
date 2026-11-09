// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'
import { ApolloServerTestClient, cleanDB, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { ApiClient, MemberAvatarsQuestion } from 'core'
import {
  AppDatabase,
  Community as DbCommunity,
  User as DbUser,
  dbUpsertForeignMemberAvatarDates,
  foreignMemberAvatarDatesTable,
} from 'database'
import { MEMBER_AVATARS_MAX_REFS } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { refreshForeignMemberAvatarDates } from './refreshForeignMemberAvatarDates'

/**
 * The run is called directly: no loop, no fake timers (drizzle is on the path, and jest's fake
 * timers would hang it -- AGENTS.md). The other community is a stub on the client's request
 * (ApiClient.memberAvatarDates): what it answers goes through the checks of the answer (core
 * memberAvatars askingSide) as between two servers; the envelope is apiRoutes' own test.
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
let peerUuid: string
let questions: MemberAvatarsQuestion[] = []
let request: jest.SpyInstance | undefined

/** A `users` row the way the federation stores the counterparty of a transfer. */
const storedMember = async (communityUuid: string): Promise<string> => {
  const row = DbUser.create()
  row.foreign = true
  row.communityUuid = communityUuid
  row.gradidoID = uuidv4()
  row.alias = `far${row.gradidoID.slice(0, 8)}`
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

type DateAnswer = { gradidoId: string; avatarUpdatedAt: string }[] | null
// what Eden hands back for a community that does not answer: a fetch that failed
const NO_ANSWER = { data: null, error: { status: 503, value: 'connect ECONNREFUSED' } }

/** The other community: answers each question as `answer` says, null for no answer at all. */
const peerAnswers = (answer: (question: MemberAvatarsQuestion) => DateAnswer) => {
  request = jest.spyOn(ApiClient.prototype, 'memberAvatarDates').mockImplementation((async (
    question: MemberAvatarsQuestion,
  ) => {
    questions.push(question)
    const data = answer(question)
    return data ? { data, error: null } : NO_ANSWER
  }) as never)
}

const peerDoesNotAnswer = () => peerAnswers(() => null)

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  await cleanDB()
  await DbCommunity.create({
    foreign: false,
    url: 'http://home.invalid/api/',
    publicEncryptionKey: randomBytes(32),
    publicKey: randomBytes(32),
    communityUuid: uuidv4(),
    name: 'Home community',
    description: 'this side of the border',
    creationDate: new Date(),
  }).save()
  peerUuid = uuidv4()
  await DbCommunity.create({
    foreign: true,
    url: 'http://peer.invalid/api/',
    publicEncryptionKey: randomBytes(32),
    publicKey: randomBytes(32),
    communityUuid: peerUuid,
    authenticatedAt: new Date(),
    name: 'Peer community',
    description: 'the other side of the border',
    creationDate: new Date(),
  }).save()
})

beforeEach(() => {
  questions = []
  jest.clearAllMocks()
})

afterEach(() => {
  request?.mockRestore()
  request = undefined
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
      peerAnswers(() => [{ gradidoId: anna, avatarUpdatedAt: PICTURE }])

      await refreshForeignMemberAvatarDates()

      // Asked for the dates, about exactly the members stored for that community.
      expect(questions).toEqual([{ gradidoIds: [anna, otto] }])
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
      peerAnswers(() => [{ gradidoId: anna, avatarUpdatedAt: NEWER }])

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
        Array.from({ length: MEMBER_AVATARS_MAX_REFS + 1 }, (_, n) => ({
          foreign: true,
          communityUuid: peerUuid,
          gradidoID: uuidv4(),
          alias: `farMember${n}`,
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
        question.gradidoIds.map((gradidoId) => ({ gradidoId, avatarUpdatedAt: PICTURE })),
      )

      await refreshForeignMemberAvatarDates()

      expect(questions.map((question) => question.gradidoIds.length)).toEqual([
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

      expect(request).toHaveBeenCalledTimes(1)
      expect(await storedDates()).toEqual({})
    })

    /**
     * ★ A decision, not an accident (see the run's docblock): the blocks answered before a
     * failing one keep what they brought. Each row is true for its own member, and holding the
     * answers back until every block succeeds would hold back the withdrawals in them as well --
     * a community that failed somewhere on every run would never be refreshed.
     */
    it('keeps the answers of the blocks before a failing one, and the failing block as it was', async () => {
      const [lastStored] = await DbUser.find({
        where: { foreign: true, communityUuid: peerUuid },
        order: { id: 'DESC' },
        take: 1,
      })
      // The member asked about in the second block, with a date from an earlier run.
      await dbUpsertForeignMemberAvatarDates([
        {
          communityUuid: peerUuid,
          gradidoId: lastStored.gradidoID,
          avatarUpdatedAt: new Date(PICTURE),
          checkedAt: LONG_AGO,
        },
      ])
      let asked = 0
      peerAnswers((question) => {
        asked += 1
        return asked > 1
          ? null
          : question.gradidoIds.map((gradidoId) => ({ gradidoId, avatarUpdatedAt: NEWER }))
      })

      await refreshForeignMemberAvatarDates()

      expect(questions.map((question) => question.gradidoIds.length)).toEqual([
        MEMBER_AVATARS_MAX_REFS,
        1,
      ])
      const stored = await storedDates()
      expect(Object.keys(stored)).toHaveLength(MEMBER_AVATARS_MAX_REFS + 1)
      expect(Object.values(stored).filter((row) => row.avatarUpdatedAt === NEWER)).toHaveLength(
        MEMBER_AVATARS_MAX_REFS,
      )
      expect(stored[pair(peerUuid, lastStored.gradidoID)]).toEqual({
        avatarUpdatedAt: PICTURE,
        checkedAt: LONG_AGO.toISOString(),
      })
    })
  })

  describe('whom it does not ask', () => {
    let stranger: DbCommunity

    beforeAll(async () => {
      await clearDates()
      await DbUser.delete({ foreign: true })
      // Everything the question needs -- keys, a uuid, members stored of it -- except the
      // completed handshake. The other side would refuse; asking would only cost the time limit.
      stranger = await DbCommunity.create({
        foreign: true,
        url: 'http://stranger.invalid/api/',
        publicEncryptionKey: randomBytes(32),
        publicKey: randomBytes(32),
        communityUuid: uuidv4(),
        authenticatedAt: null,
        name: 'Stranger community',
        description: 'never shook hands',
        creationDate: new Date(),
      }).save()
      await storedMember(stranger.communityUuid as string)
    })

    afterAll(async () => {
      await DbUser.delete({ foreign: true })
      await DbCommunity.delete({ id: stranger.id })
    })

    it('asks neither a community without stored members nor one without the handshake', async () => {
      peerAnswers(() => [])

      await refreshForeignMemberAvatarDates()

      expect(request).not.toHaveBeenCalled()
      expect(await storedDates()).toEqual({})
    })
  })
})
