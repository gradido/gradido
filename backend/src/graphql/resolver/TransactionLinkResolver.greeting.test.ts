// AI-GENERATED — not an architecture reference
import {
  ApolloServerTestClient,
  cleanDB,
  resetToken,
  TEST_AVATAR_FULL_BASE64,
  TEST_AVATAR_SMALL_BASE64,
  testEnvironment,
} from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  creationFactory,
  DBInsertFailed,
  Event as DbEvent,
  TransactionLink as DbTransactionLink,
  DbUser,
  dbDeleteThankYouGreetingByLinkCode,
  dbFindMemberAvatarsSmall,
  dbInsertThankYouGreeting,
  dbSelectThankYouGreetingsByLinkCodes,
  EventType,
  thankYouGreetingsTable,
  User,
} from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { SENDER_AVATARS_MAX_PER_REQUEST } from '@/data/SenderAvatar.logic'
import { creations } from '@/seeds/creation/index'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import {
  createTransactionLink,
  deleteTransactionLink,
  login,
  redeemTransactionLink,
  removeUserAvatar,
  setUserAvatar,
  updateUserInfos,
} from '@/seeds/graphql/mutations'
import {
  listTransactionLinks,
  listTransactionLinksAdmin,
  queryThankYouGreeting,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * A thank-you greeting: a transaction link with a motif, a first line and a name
 * (createTransactionLink with `greeting`). What is held here is the order of the two writes --
 * the greeting's row sits on Drizzle, the link's on TypeORM, with no transaction around both --
 * and who gets to read a greeting.
 *
 * The three queries of the greeting's table are the real ones, wrapped so that a test can make
 * one of them fail once and count how often the list asks. So is the read of the face of the
 * member who made a link.
 */
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbInsertThankYouGreeting: jest.fn(original.dbInsertThankYouGreeting),
    dbSelectThankYouGreetingsByLinkCodes: jest.fn(original.dbSelectThankYouGreetingsByLinkCodes),
    dbDeleteThankYouGreetingByLinkCode: jest.fn(original.dbDeleteThankYouGreetingByLinkCode),
    dbFindMemberAvatarsSmall: jest.fn(original.dbFindMemberAvatarsSmall),
  }
})

const insertGreeting = dbInsertThankYouGreeting as jest.MockedFunction<
  typeof dbInsertThankYouGreeting
>
const selectGreetings = dbSelectThankYouGreetingsByLinkCodes as jest.MockedFunction<
  typeof dbSelectThankYouGreetingsByLinkCodes
>
const deleteGreeting = dbDeleteThankYouGreetingByLinkCode as jest.MockedFunction<
  typeof dbDeleteThankYouGreetingByLinkCode
>
const findFaces = dbFindMemberAvatarsSmall as jest.MockedFunction<typeof dbFindMemberAvatarsSmall>

CONFIG.DLT_ACTIVE = false

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
const removeLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionLinkResolver.removeThankYouGreeting`,
)
const queryLinkLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionLinkResolver.queryTransactionLink`,
)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let bibi: DbUser

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma'
// A name that stands nowhere else in this file's data: found in a log, it came from here.
const NAME = 'Sarah Wintergrün'
const GREETING = { motif: 'morning-light', line: LINE, recipientName: NAME }
const sarah = { amount: '20', memo: `${LINE}\n${WORDS}`, greeting: GREETING }

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

/** Every row of the greeting's table, read past the wrapped queries. */
const greetingRows = () =>
  AppDatabase.getInstance().getDrizzleDataSource().select().from(thankYouGreetingsTable)

const linksOfBibi = () => DbTransactionLink.count({ where: { userId: bibi.id }, withDeleted: true })
const createEvents = () => DbEvent.count({ where: { type: EventType.TRANSACTION_LINK_CREATE } })

/** Everything the two loggers a failing greeting can reach were handed, as one text. */
const errorLog = () =>
  JSON.stringify([...logErrorLogger.error.mock.calls, ...removeLogger.error.mock.calls])

const created = async (variables: Record<string, unknown>) => {
  const result = await mutate({ mutation: createTransactionLink, variables })
  expect(result.errors).toBeUndefined()
  return result.data.createTransactionLink as {
    id: number
    code: string
    greeting: typeof GREETING | null
  }
}

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  // The admin has to exist for creationFactory.
  await userFactoryDrizzle(peterLustig)
  bibi = await userFactoryDrizzle(bibiBloxberg)
  await creationFactory(creations.find((c) => c.email === 'bibi@bloxberg.de')!)
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

beforeEach(async () => {
  jest.clearAllMocks()
  await loginAs('bibi@bloxberg.de')
})

describe('createTransactionLink with a greeting', () => {
  it('answers with the greeting and files it under the code of the link', async () => {
    const link = await created(sarah)

    expect(link.greeting).toEqual(GREETING)
    const rows = await greetingRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      transactionLinkCode: link.code,
      motif: 'morning-light',
      line: LINE,
      recipientName: NAME,
    })
    // The link itself is the link it always was: the memo whole, the event written.
    const stored = await DbTransactionLink.findOneOrFail({ where: { id: link.id } })
    expect(stored.memo).toBe(`${LINE}\n${WORDS}`)
    expect(stored.code).toBe(link.code)
    await expect(DbEvent.find()).resolves.toContainEqual(
      expect.objectContaining({
        type: EventType.TRANSACTION_LINK_CREATE,
        involvedTransactionLinkId: link.id,
      }),
    )
  })

  it('files the greeting before the link is saved', async () => {
    const order: string[] = []
    insertGreeting.mockImplementationOnce(async (row) => {
      order.push('greeting')
      return jest.requireActual('database').dbInsertThankYouGreeting(row)
    })
    const realSave = DbTransactionLink.save.bind(DbTransactionLink) as (link: unknown) => unknown
    const save = jest.spyOn(DbTransactionLink, 'save').mockImplementationOnce(((link: unknown) => {
      order.push('link')
      return realSave(link)
    }) as never)

    await created({ ...sarah, memo: `${LINE}\nZweiter Gruß an Sarah` })
    save.mockRestore()

    expect(order).toEqual(['greeting', 'link'])
  })

  it('takes a greeting with a motif alone, and one whose memo is exactly the line', async () => {
    const before = (await greetingRows()).length

    const motifOnly = await created({
      amount: '5',
      memo: 'Danke fürs Zuhören gestern Abend',
      greeting: { motif: 'bouquet' },
    })
    expect(motifOnly.greeting).toEqual({ motif: 'bouquet', line: null, recipientName: null })

    const lineOnly = await created({
      amount: '5',
      memo: 'Danke für Deine Hilfe!',
      greeting: { motif: 'giving-hands', line: 'Danke für Deine Hilfe!' },
    })
    expect(lineOnly.greeting).toEqual({
      motif: 'giving-hands',
      line: 'Danke für Deine Hilfe!',
      recipientName: null,
    })
    expect(await greetingRows()).toHaveLength(before + 2)
  })

  it('stores the line and the name trimmed, and takes a blank one as not given', async () => {
    const link = await created({
      amount: '5',
      memo: 'Danke für das gute Gespräch.\nBis bald!',
      greeting: { motif: 'bouquet', line: '  Danke für das gute Gespräch. ', recipientName: '  ' },
    })

    expect(link.greeting).toEqual({
      motif: 'bouquet',
      line: 'Danke für das gute Gespräch.',
      recipientName: null,
    })
  })

  describe('refused before anything is written', () => {
    let links: number
    let rows: number
    let events: number

    beforeEach(async () => {
      links = await linksOfBibi()
      rows = (await greetingRows()).length
      events = await createEvents()
    })

    const expectNothingWritten = async () => {
      expect(await linksOfBibi()).toBe(links)
      expect(await greetingRows()).toHaveLength(rows)
      expect(await createEvents()).toBe(events)
      expect(insertGreeting).not.toHaveBeenCalled()
    }

    it('an unknown motif', async () => {
      await expect(
        mutate({
          mutation: createTransactionLink,
          variables: { ...sarah, greeting: { ...GREETING, motif: 'sunset' } },
        }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Thank-you greeting: unknown motif')],
      })
      await expectNothingWritten()
    })

    it('a greeting without a motif', async () => {
      const result = await mutate({
        mutation: createTransactionLink,
        variables: { ...sarah, greeting: { line: LINE } },
      })
      // A greeting carries a motif or a picture of the member's own, one of the two
      // (TransactionLinkResolver.greetingPicture.test.ts has the picture's side).
      expect(result.errors).toEqual([
        new GraphQLError('Thank-you greeting: a motif or a picture, one of the two'),
      ])
      await expectNothingWritten()
    })

    it('a memo that does not begin with the line', async () => {
      await expect(
        mutate({
          mutation: createTransactionLink,
          variables: { ...sarah, memo: `Liebe Sarah!\n${LINE}` },
        }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Thank-you greeting: the memo has to begin with the line')],
      })
      await expectNothingWritten()
    })

    it('a line that is too long, has two lines, or a name that is too long', async () => {
      const long = 'a'.repeat(81)
      for (const [variables, message] of [
        [
          { amount: '5', memo: long, greeting: { motif: 'bouquet', line: long } },
          'Thank-you greeting: the line is too long',
        ],
        [
          {
            amount: '5',
            memo: 'Danke\nfür alles',
            greeting: { motif: 'bouquet', line: 'Danke\nfür alles' },
          },
          'Thank-you greeting: the line has to be one line',
        ],
        [
          { ...sarah, greeting: { ...GREETING, recipientName: 'a'.repeat(41) } },
          'Thank-you greeting: the name is too long',
        ],
      ] as const) {
        await expect(mutate({ mutation: createTransactionLink, variables })).resolves.toMatchObject(
          { errors: [new GraphQLError(message)] },
        )
      }
      await expectNothingWritten()
    })

    // The memo keeps its own bounds, greeting or not.
    it('a memo under five characters, even where it is the line', async () => {
      const result = await mutate({
        mutation: createTransactionLink,
        variables: { amount: '5', memo: 'Hi!', greeting: { motif: 'bouquet', line: 'Hi!' } },
      })
      expect(result.errors).toHaveLength(1)
      await expectNothingWritten()
    })
  })

  describe('the greeting cannot be filed', () => {
    it('leaves no link, no event and no hold, and keeps the name out of the log', async () => {
      const links = await linksOfBibi()
      const rows = (await greetingRows()).length
      const events = await createEvents()
      insertGreeting.mockResolvedValueOnce({
        success: false,
        error: new DBInsertFailed('thank_you_greetings', { transactionLinkCode: 'x' }),
      })
      const save = jest.spyOn(DbTransactionLink, 'save')

      await expect(
        mutate({ mutation: createTransactionLink, variables: sarah }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Unable to save thank-you greeting')],
      })

      expect(save).not.toHaveBeenCalled()
      save.mockRestore()
      expect(await linksOfBibi()).toBe(links)
      expect(await greetingRows()).toHaveLength(rows)
      expect(await createEvents()).toBe(events)
      expect(logErrorLogger.error).toHaveBeenCalledWith(
        'Unable to save thank-you greeting',
        'DBInsertFailed',
      )
      expect(errorLog()).not.toContain('Wintergrün')
    })

    // Drizzle writes the parameters of a statement into the message of its error -- the name
    // among them. What reaches the log and the client is the driver's code.
    it('keeps the name out of the log where the database itself throws', async () => {
      const links = await linksOfBibi()
      insertGreeting.mockRejectedValueOnce(
        Object.assign(
          new Error(`Failed query: insert into thank_you_greetings ... params: x,${NAME}`),
          { cause: { code: 'ER_LOCK_WAIT_TIMEOUT' } },
        ),
      )

      const result = await mutate({ mutation: createTransactionLink, variables: sarah })

      expect(result.errors).toEqual([new GraphQLError('Unable to save thank-you greeting')])
      expect(JSON.stringify(result.errors)).not.toContain('Wintergrün')
      expect(logErrorLogger.error).toHaveBeenCalledWith(
        'Unable to save thank-you greeting',
        'ER_LOCK_WAIT_TIMEOUT',
      )
      expect(errorLog()).not.toContain('Wintergrün')
      expect(await linksOfBibi()).toBe(links)
    })
  })

  describe('the link cannot be saved', () => {
    it('takes the greeting back out and reports the failure as before', async () => {
      const links = await linksOfBibi()
      const rows = (await greetingRows()).length
      const events = await createEvents()
      const save = jest
        .spyOn(DbTransactionLink, 'save')
        .mockRejectedValueOnce(new Error('the link table is away'))

      await expect(
        mutate({ mutation: createTransactionLink, variables: sarah }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Unable to save transaction link')],
      })
      save.mockRestore()

      // It was filed first, and it is gone again.
      expect(insertGreeting).toHaveBeenCalledTimes(1)
      expect(deleteGreeting).toHaveBeenCalledTimes(1)
      expect(deleteGreeting).toHaveBeenCalledWith(
        insertGreeting.mock.calls[0][0].transactionLinkCode,
      )
      expect(await greetingRows()).toHaveLength(rows)
      expect(await linksOfBibi()).toBe(links)
      expect(await createEvents()).toBe(events)
      expect(logErrorLogger.error).toHaveBeenCalledWith(
        'Unable to save transaction link',
        expect.any(Error),
      )
    })

    it('still reports the link where the greeting cannot be taken back either', async () => {
      const save = jest
        .spyOn(DbTransactionLink, 'save')
        .mockRejectedValueOnce(new Error('the link table is away'))
      deleteGreeting.mockRejectedValueOnce(
        Object.assign(new Error('Failed query'), { cause: { code: 'ECONNRESET' } }),
      )

      await expect(
        mutate({ mutation: createTransactionLink, variables: sarah }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Unable to save transaction link')],
      })
      save.mockRestore()

      expect(removeLogger.error).toHaveBeenCalledWith(
        'thank-you greeting could not be removed',
        insertGreeting.mock.calls[0][0].transactionLinkCode,
        'ECONNRESET',
      )
      expect(errorLog()).not.toContain('Wintergrün')
      // The row nobody reaches: clean it up for the tests that count.
      await jest
        .requireActual('database')
        .dbDeleteThankYouGreetingByLinkCode(insertGreeting.mock.calls[0][0].transactionLinkCode)
    })

    it('touches no greeting where a plain link cannot be saved', async () => {
      const save = jest
        .spyOn(DbTransactionLink, 'save')
        .mockRejectedValueOnce(new Error('the link table is away'))

      await expect(
        mutate({
          mutation: createTransactionLink,
          variables: { amount: '5', memo: 'Ein schlichter Link' },
        }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Unable to save transaction link')],
      })
      save.mockRestore()

      expect(insertGreeting).not.toHaveBeenCalled()
      expect(deleteGreeting).not.toHaveBeenCalled()
    })
  })
})

describe('createTransactionLink without a greeting', () => {
  it('is the link it always was: no row, no greeting in the answer', async () => {
    const rows = (await greetingRows()).length

    const plain = await created({ amount: '5', memo: 'Ein schlichter Link' })
    const nulled = await created({ amount: '5', memo: 'Noch ein schlichter Link', greeting: null })

    expect(plain.greeting).toBeNull()
    expect(nulled.greeting).toBeNull()
    expect(insertGreeting).not.toHaveBeenCalled()
    expect(await greetingRows()).toHaveLength(rows)
  })
})

describe('queryTransactionLink', () => {
  let code: string
  let id: number

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    const link = await created({ ...sarah, memo: `${LINE}\nFür die Abfrage` })
    code = link.code
    id = link.id
  })

  it('hands the greeting to whoever holds the code, signed in or not', async () => {
    resetToken()

    await expect(
      query({ query: queryThankYouGreeting, variables: { code } }),
    ).resolves.toMatchObject({
      data: {
        queryTransactionLink: {
          id,
          memo: `${LINE}\nFür die Abfrage`,
          deletedAt: null,
          greeting: GREETING,
        },
      },
    })
  })

  it('answers null for a plain link', async () => {
    const plain = await created({ amount: '5', memo: 'Schlicht, für die Abfrage' })
    resetToken()

    const result = await query({ query: queryThankYouGreeting, variables: { code: plain.code } })

    expect(result.errors).toBeUndefined()
    expect(result.data.queryTransactionLink.greeting).toBeNull()
  })

  // The query finds deleted links too. Even with the row still there -- its removal failed --
  // a deleted link shows no greeting, and the table is not asked.
  it('never hands out the greeting of a deleted link', async () => {
    deleteGreeting.mockRejectedValueOnce(
      Object.assign(new Error('Failed query'), { cause: { code: 'ECONNRESET' } }),
    )
    await expect(
      mutate({ mutation: deleteTransactionLink, variables: { id } }),
    ).resolves.toMatchObject({ data: { deleteTransactionLink: true } })
    expect((await greetingRows()).map((row) => row.transactionLinkCode)).toContain(code)
    resetToken()
    jest.clearAllMocks()

    const result = await query({ query: queryThankYouGreeting, variables: { code } })

    expect(result.errors).toBeUndefined()
    expect(result.data.queryTransactionLink.deletedAt).not.toBeNull()
    expect(result.data.queryTransactionLink.greeting).toBeNull()
    expect(selectGreetings).not.toHaveBeenCalled()
  })
})

/**
 * The face of the member who made a link, on the page of that link (senderAvatar, ZE-038):
 * the small picture, for whoever holds the code of an OPEN link, where the member shows their
 * face to other members. The rule of the link's state has a test of every row of its own
 * (SenderAvatar.logic.test.ts); these hold that the query reads it, and the switch, at all.
 * Each case first sees the face, then makes the one change, so that a fixture which never
 * showed it cannot pass for a guard.
 */
describe('queryTransactionLink, the face of the member who made the link', () => {
  // The links of this block, made by Bibi: a greeting and a plain link, both open.
  let greetingLink: { id: number; code: string }
  let plainLink: { id: number; code: string }

  /** What the page of a link is handed of its sender's face, asked by whoever is signed in. */
  const faceOf = async (code: string): Promise<string | null> => {
    const result = await query({ query: queryThankYouGreeting, variables: { code } })
    expect(result.errors).toBeUndefined()
    return result.data.queryTransactionLink.senderAvatar
  }

  /** Bibi's switch "my picture for other members", set as she sets it. */
  const showFace = async (avatarVisibleToMembers: boolean) => {
    await loginAs('bibi@bloxberg.de')
    const switched = await mutate({
      mutation: updateUserInfos,
      variables: { avatarVisibleToMembers },
    })
    expect(switched.errors).toBeUndefined()
    // The fixture proves itself: a switch silently left as it was would make the case below
    // find no face for a reason that has nothing to do with the switch.
    expect((await User.findOneByOrFail({ id: bibi.id })).avatarVisibleToMembers).toBe(
      avatarVisibleToMembers,
    )
  }

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    greetingLink = await created({ ...sarah, memo: `${LINE}\nMit Gesicht` })
    plainLink = await created({ amount: '5', memo: 'Schlicht, mit Gesicht' })
  })

  it('is null while the member has no picture', async () => {
    resetToken()

    expect(await faceOf(greetingLink.code)).toBeNull()
    expect(await faceOf(plainLink.code)).toBeNull()
  })

  describe('with a picture of the member', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
      const set = await mutate({
        mutation: setUserAvatar,
        variables: { avatarSmall: TEST_AVATAR_SMALL_BASE64, avatarFull: TEST_AVATAR_FULL_BASE64 },
      })
      expect(set.errors).toBeUndefined()
    })

    // The rest of the file finds Bibi as it was: without a picture, the switch on.
    afterAll(async () => {
      await showFace(true)
      const removed = await mutate({ mutation: removeUserAvatar })
      expect(removed.errors).toBeUndefined()
    })

    it('hands the small picture to whoever holds the code of an open link, signed in or not', async () => {
      resetToken()
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)

      await loginAs('peter@lustig.de')
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)

      // …and to the member herself, on the page of her own link: what she sees there is what
      // the one she sends it to sees.
      await loginAs('bibi@bloxberg.de')
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })

    it('hands it with a plain link as with a greeting', async () => {
      resetToken()

      expect(await faceOf(plainLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })

    // A read of the face that fails takes nothing else with it: the link comes as it is,
    // without its face, as past the cap. Drizzle writes the statement and its parameters into
    // the message of its error -- the member's id among them --, and this answer goes to whoever
    // holds the code. What reaches the log is the driver's code.
    it('comes without the face where the face cannot be read, and logs the driver code only', async () => {
      resetToken()
      findFaces.mockRejectedValueOnce(
        Object.assign(
          new Error(`Failed query: select \`avatar_small\` ... params: ${bibi.gradidoId}`),
          { cause: { code: 'ECONNRESET' } },
        ),
      )

      const result = await query({
        query: queryThankYouGreeting,
        variables: { code: greetingLink.code },
      })

      expect(result.errors).toBeUndefined()
      expect(result.data.queryTransactionLink).toMatchObject({
        id: greetingLink.id,
        greeting: GREETING,
        senderAvatar: null,
      })
      expect(queryLinkLogger.error).toHaveBeenCalledWith(
        'sender avatar could not be read',
        'ECONNRESET',
      )
      const logged = JSON.stringify(queryLinkLogger.error.mock.calls)
      expect(logged).not.toContain('Failed query')
      expect(logged).not.toContain(bibi.gradidoId)
      // Once: the next request reads the face again.
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })

    it('is null where the member does not show her face to other members, and back once she does', async () => {
      await showFace(false)
      try {
        resetToken()
        expect(await faceOf(greetingLink.code)).toBeNull()
      } finally {
        await showFace(true)
      }

      resetToken()
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })

    it('is null once the link is accepted', async () => {
      const link = await created({ amount: '5', memo: 'Angenommen, mit Gesicht' })
      resetToken()
      expect(await faceOf(link.code)).toBe(TEST_AVATAR_SMALL_BASE64)

      await loginAs('peter@lustig.de')
      const redeemed = await mutate({
        mutation: redeemTransactionLink,
        variables: { code: link.code },
      })
      expect(redeemed.errors).toBeUndefined()
      expect(redeemed.data.redeemTransactionLink).toBe(true)

      expect(await faceOf(link.code)).toBeNull()
      resetToken()
      expect(await faceOf(link.code)).toBeNull()
    })

    it('is null once the link has run out', async () => {
      const link = await created({ amount: '5', memo: 'Abgelaufen, mit Gesicht' })
      resetToken()
      expect(await faceOf(link.code)).toBe(TEST_AVATAR_SMALL_BASE64)

      await DbTransactionLink.update({ id: link.id }, { validUntil: new Date(Date.now() - 60_000) })

      expect(await faceOf(link.code)).toBeNull()
    })

    it('is null for a deleted link', async () => {
      const link = await created({ amount: '5', memo: 'Gelöscht, mit Gesicht' })
      resetToken()
      expect(await faceOf(link.code)).toBe(TEST_AVATAR_SMALL_BASE64)

      await loginAs('bibi@bloxberg.de')
      await expect(
        mutate({ mutation: deleteTransactionLink, variables: { id: link.id } }),
      ).resolves.toMatchObject({ data: { deleteTransactionLink: true } })
      resetToken()

      const result = await query({ query: queryThankYouGreeting, variables: { code: link.code } })
      expect(result.errors).toBeUndefined()
      expect(result.data.queryTransactionLink.deletedAt).not.toBeNull()
      expect(result.data.queryTransactionLink.senderAvatar).toBeNull()
    })

    // ⛔ The page of a link of a member whose account is deleted opens no more: the query reads
    // the member without the deleted ones and answers with an error -- and the face does not
    // ride along with it.
    it('hands no face out with the error where the account of the member is deleted', async () => {
      resetToken()
      await User.update({ id: bibi.id }, { deletedAt: new Date() })
      try {
        const result = await query({
          query: queryThankYouGreeting,
          variables: { code: greetingLink.code },
        })
        expect(result.errors).toBeDefined()
        expect(result.data?.queryTransactionLink ?? null).toBeNull()
        expect(JSON.stringify(result)).not.toContain(TEST_AVATAR_SMALL_BASE64)
      } finally {
        await User.update({ id: bibi.id }, { deletedAt: null })
      }

      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })

    it('is null in the lists of links and in the answer of createTransactionLink', async () => {
      const made = await mutate({
        mutation: gql`
          mutation ($amount: GradidoUnit!, $memo: String!) {
            createTransactionLink(amount: $amount, memo: $memo) {
              code
              senderAvatar
            }
          }
        `,
        variables: { amount: '5', memo: 'Neu, ohne Gesicht in der Antwort' },
      })
      expect(made.errors).toBeUndefined()
      expect(made.data.createTransactionLink.senderAvatar).toBeNull()

      const listed = await query({
        query: gql`
          query {
            listTransactionLinks(currentPage: 1, pageSize: 50) {
              links {
                code
                senderAvatar
              }
            }
          }
        `,
      })
      expect(listed.errors).toBeUndefined()
      const links: { code: string; senderAvatar: string | null }[] =
        listed.data.listTransactionLinks.links
      // The open links of this block are on the page, so the list could have carried a face.
      expect(links.map((link) => link.code)).toEqual(
        expect.arrayContaining([greetingLink.code, plainLink.code]),
      )
      expect(links.every((link) => link.senderAvatar === null)).toBe(true)
      // …and the page of the same link carries it.
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })

    // ⛔ A document may name the query under any number of aliases, each with a code of its
    // own; the same code under all of them asks the same way. One request is handed at most
    // SENDER_AVATARS_MAX_PER_REQUEST faces; the links past the cap come without theirs.
    it('hands one request at most SENDER_AVATARS_MAX_PER_REQUEST faces, over every alias', async () => {
      const aliases = SENDER_AVATARS_MAX_PER_REQUEST + 2
      const fields = Array.from(
        { length: aliases },
        (_, i) =>
          `face${i}: queryTransactionLink(code: $code) { ... on TransactionLink { code senderAvatar } }`,
      )
      resetToken()

      const result = await query({
        query: gql(`query ($code: String!) {\n${fields.join('\n')}\n}`),
        variables: { code: greetingLink.code },
      })

      expect(result.errors).toBeUndefined()
      const answers: { code: string; senderAvatar: string | null }[] = Object.values(result.data)
      expect(answers).toHaveLength(aliases)
      // Every alias was answered with the link itself, with or without its face.
      expect(answers.every((answer) => answer.code === greetingLink.code)).toBe(true)
      const faces = answers.filter((answer) => answer.senderAvatar === TEST_AVATAR_SMALL_BASE64)
      expect(faces).toHaveLength(SENDER_AVATARS_MAX_PER_REQUEST)
      expect(answers.filter((answer) => answer.senderAvatar === null)).toHaveLength(2)

      // The budget is the request's: the next one is handed the face again.
      expect(await faceOf(greetingLink.code)).toBe(TEST_AVATAR_SMALL_BASE64)
    })
  })
})

describe('deleteTransactionLink', () => {
  it('takes the greeting with the link and writes the event', async () => {
    const link = await created({ ...sarah, memo: `${LINE}\nZum Löschen` })
    const keep = await created({ ...sarah, memo: `${LINE}\nDer bleibt` })
    const rows = (await greetingRows()).length

    await expect(
      mutate({ mutation: deleteTransactionLink, variables: { id: link.id } }),
    ).resolves.toMatchObject({ data: { deleteTransactionLink: true } })

    const left = (await greetingRows()).map((row) => row.transactionLinkCode)
    expect(left).toHaveLength(rows - 1)
    expect(left).not.toContain(link.code)
    expect(left).toContain(keep.code)
    await expect(DbEvent.find()).resolves.toContainEqual(
      expect.objectContaining({
        type: EventType.TRANSACTION_LINK_DELETE,
        involvedTransactionLinkId: link.id,
      }),
    )
  })

  it('deletes the link all the same where the greeting cannot be removed, and logs it', async () => {
    const link = await created({ ...sarah, memo: `${LINE}\nAufräumen scheitert` })
    deleteGreeting.mockRejectedValueOnce(
      Object.assign(new Error(`Failed query ... ${NAME}`), { cause: { code: 'ECONNRESET' } }),
    )

    await expect(
      mutate({ mutation: deleteTransactionLink, variables: { id: link.id } }),
    ).resolves.toMatchObject({ data: { deleteTransactionLink: true } })

    const stored = await DbTransactionLink.findOneOrFail({
      where: { id: link.id },
      withDeleted: true,
    })
    expect(stored.deletedAt).not.toBeNull()
    expect(removeLogger.error).toHaveBeenCalledWith(
      'thank-you greeting could not be removed',
      link.code,
      'ECONNRESET',
    )
    expect(errorLog()).not.toContain('Wintergrün')
    await expect(DbEvent.find()).resolves.toContainEqual(
      expect.objectContaining({
        type: EventType.TRANSACTION_LINK_DELETE,
        involvedTransactionLinkId: link.id,
      }),
    )
  })

  it('deletes a plain link as before, without a word in the log', async () => {
    const plain = await created({ amount: '5', memo: 'Schlicht, zum Löschen' })
    const rows = (await greetingRows()).length

    await expect(
      mutate({ mutation: deleteTransactionLink, variables: { id: plain.id } }),
    ).resolves.toMatchObject({ data: { deleteTransactionLink: true } })

    expect(await greetingRows()).toHaveLength(rows)
    expect(removeLogger.error).not.toHaveBeenCalled()
  })

  it('leaves the greeting where the link is not the member’s own', async () => {
    const link = await created({ ...sarah, memo: `${LINE}\nGehört Bibi` })
    const rows = (await greetingRows()).length
    await loginAs('peter@lustig.de')
    jest.clearAllMocks()

    const result = await mutate({ mutation: deleteTransactionLink, variables: { id: link.id } })

    expect(result.errors).toHaveLength(1)
    expect(deleteGreeting).not.toHaveBeenCalled()
    expect(await greetingRows()).toHaveLength(rows)
  })
})

describe('the lists of links', () => {
  let greetingCodes: string[]
  let plainCode: string

  beforeAll(async () => {
    await loginAs('bibi@bloxberg.de')
    const first = await created({ ...sarah, memo: `${LINE}\nListe eins` })
    const second = await created({
      amount: '5',
      memo: 'Danke fürs Zuhören, liebe Liste',
      greeting: { motif: 'bouquet' },
    })
    const plain = await created({ amount: '5', memo: 'Schlicht, für die Liste' })
    greetingCodes = [first.code, second.code]
    plainCode = plain.code
  })

  it('carry each link’s greeting and ask the table once for the whole page', async () => {
    const result = await query({
      query: listTransactionLinks,
      variables: { currentPage: 1, pageSize: 25 },
    })

    expect(result.errors).toBeUndefined()
    const links = result.data.listTransactionLinks.links as {
      code: string
      greeting: typeof GREETING | null
    }[]
    expect(links.length).toBeGreaterThan(3)
    expect(links.find((link) => link.code === greetingCodes[0])?.greeting).toEqual(GREETING)
    expect(links.find((link) => link.code === greetingCodes[1])?.greeting).toEqual({
      motif: 'bouquet',
      line: null,
      recipientName: null,
    })
    expect(links.find((link) => link.code === plainCode)?.greeting).toBeNull()
    // One statement, naming every link of the page -- not one per link.
    expect(selectGreetings).toHaveBeenCalledTimes(1)
    expect([...selectGreetings.mock.calls[0][0]].sort()).toEqual(
      links.map((link) => link.code).sort(),
    )
  })

  it('ask once for a page without any link, too, and that asks the database nothing', async () => {
    const result = await query({
      query: listTransactionLinks,
      variables: { currentPage: 99, pageSize: 25 },
    })

    expect(result.data.listTransactionLinks.links).toEqual([])
    expect(selectGreetings).toHaveBeenCalledTimes(1)
    expect(selectGreetings).toHaveBeenCalledWith([])
  })

  // The admin's list may ask for deleted links; its own document does not ask for the
  // greeting, and a deleted link would not show one.
  it('leave the admin’s list as it was, and name no deleted link to the table', async () => {
    await loginAs('peter@lustig.de')
    jest.clearAllMocks()

    const result = await query({
      query: listTransactionLinksAdmin,
      variables: {
        userId: bibi.id,
        pageSize: 25,
        filters: { withDeleted: true, withExpired: true, withRedeemed: true },
      },
    })

    expect(result.errors).toBeUndefined()
    const links = result.data.listTransactionLinksAdmin.links as {
      code: string
      deletedAt: string | null
    }[]
    const deleted = links.filter((link) => link.deletedAt).map((link) => link.code)
    expect(deleted.length).toBeGreaterThan(0)
    expect(selectGreetings).toHaveBeenCalledTimes(1)
    const asked = selectGreetings.mock.calls[0][0]
    expect(asked).toHaveLength(links.length - deleted.length)
    for (const code of deleted) {
      expect(asked).not.toContain(code)
    }
  })
})
