// AI-GENERATED — not an architecture reference
import { inspect } from 'node:util'
import { getLogger } from 'config-schema/test/testSetup'
import { removeLargeThankYouGreetingPicture } from 'core'
import {
  DBDuplicateEntryError,
  DBNotFoundError,
  User as DbUser,
  dbInsertThankYouGreetingPicture,
  dbSelectThankYouGreetingPictureImage,
  dbSelectThankYouGreetingPicturesByLinkId,
  ThankYouGreetingPicturesOfLink,
} from 'database'
import { CHAT_IMAGE_MAX_SIDE, THANK_YOU_PICTURE_LARGE_MAX_BYTES } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  THANK_YOU_GREETING_LARGE_PICTURE_COUNTS,
  THANK_YOU_GREETING_LARGE_PICTURES_MAX_PER_REQUEST,
  THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST,
} from '@/data/ThankYouGreetingPicture.logic'
import { Context, newRequestBudget } from '@/server/context'
import { TransactionLinkResolver } from './TransactionLinkResolver'

// What the database answers is mocked here: the subject is what the resolver decides itself --
// who is handed a picture and which, when the database is not even asked, and what happens
// around the upload of the large rendition. TransactionLinkResolver.greetingPicture.test.ts runs
// the same ways against a database.
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbSelectThankYouGreetingPicturesByLinkId: jest.fn(),
    dbSelectThankYouGreetingPictureImage: jest.fn(),
    dbInsertThankYouGreetingPicture: jest.fn(),
  }
})
// Taking the large rendition back out is core's (ThankYouGreetingPicture.logic.test.ts holds
// what it does): here only that the resolver asks for it, and when.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    removeLargeThankYouGreetingPicture: jest.fn(),
  }
})

const picturesOf = dbSelectThankYouGreetingPicturesByLinkId as jest.MockedFunction<
  typeof dbSelectThankYouGreetingPicturesByLinkId
>
const imageOf = dbSelectThankYouGreetingPictureImage as jest.MockedFunction<
  typeof dbSelectThankYouGreetingPictureImage
>
const insertPicture = dbInsertThankYouGreetingPicture as jest.MockedFunction<
  typeof dbInsertThankYouGreetingPicture
>
const removeLarge = removeLargeThankYouGreetingPicture as jest.MockedFunction<
  typeof removeLargeThankYouGreetingPicture
>

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

// The member who made the link, the one who accepted it, and a third who has nothing to do
// with it.
const SENDER = 4711
const ACCEPTER = 815
const THIRD = 2026

const LINK_ID = 7
const CODE = 'a1f9c2d41b7e19981fa0d001'
const SMALL_ID = 11
const LARGE_ID = 12
const SECRET = 'a private photo of Oma Emma'
const SMALL = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from('small'),
  Buffer.from([0xff, 0xd9]),
])
const LARGE = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from(SECRET),
  Buffer.from([0xff, 0xd9]),
])

const openLink = {
  id: LINK_ID,
  code: CODE,
  userId: SENDER,
  validUntil: new Date('2999-01-01T00:00:00.000Z'),
  redeemedAt: null as Date | null,
  redeemedBy: null as number | null,
  deletedAt: null as Date | null,
}
const runOut = { validUntil: new Date('2020-01-01T00:00:00.000Z') }
const accepted = { redeemedAt: new Date('2026-10-03T15:00:00.000Z'), redeemedBy: ACCEPTER }
const deleted = { deletedAt: new Date('2026-10-03T15:00:00.000Z') }

const small = { id: SMALL_ID, rendition: 'small' as const, width: 831, height: 577 }
const large = { id: LARGE_ID, rendition: 'large' as const, width: 1080, height: 750 }

const found = (
  state: Partial<typeof openLink> = {},
  pictures = [small, large],
): ThankYouGreetingPicturesOfLink => ({
  link: { ...openLink, ...state },
  makerDeletedAt: null,
  pictures,
})

/** A request of this member's, with a budget of its own. */
const requestOf = (id: number): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user: { id } as unknown as DbUser,
})

const notFound = (id: number) => ({
  success: false as const,
  error: new DBNotFoundError('thank_you_greeting_pictures', `id = ${id}`),
})

/** A failed Drizzle query as it really looks: the parameters are part of the message. */
const failedQuery = () =>
  Object.assign(
    new Error(`Failed query: insert into \`thank_you_greeting_pictures\` ... params: ${SECRET}`),
    { cause: { code: 'ER_LOCK_WAIT_TIMEOUT' } },
  )

/** A read that failed: the statement and the id it asked for are part of the message. */
const failedRead = () =>
  Object.assign(
    new Error(
      `Failed query: select \`id\` from \`thank_you_greeting_pictures\` ... params: ${LINK_ID}`,
    ),
    { cause: { code: 'ECONNRESET' } },
  )

/** What a failed read may say, to the member and to the log: that it failed, and the driver's code. */
const expectNoQueryIn = (failure: unknown) => {
  expect(failure).toBeInstanceOf(Error)
  expect((failure as Error).message).toBe('Unable to read thank-you greeting picture')
  expect(logErrorLogger.error).toHaveBeenCalledWith(
    'Unable to read thank-you greeting picture',
    'ECONNRESET',
  )
  for (const said of [
    inspect(failure, { depth: 6 }),
    inspect(logErrorLogger.error.mock.calls, { depth: 6 }),
  ]) {
    expect(said).not.toContain('Failed query')
    expect(said).not.toContain('params')
    expect(said).not.toContain('select')
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  picturesOf.mockResolvedValue(found())
  imageOf.mockImplementation(async (id: number) => {
    if (id === SMALL_ID) {
      return { success: true, value: SMALL }
    }
    if (id === LARGE_ID) {
      return { success: true, value: LARGE }
    }
    return notFound(id)
  })
  insertPicture.mockResolvedValue({ success: true })
  removeLarge.mockResolvedValue(true)
})

describe('thankYouGreetingPicture', () => {
  // Without `large`, as the schema hands it over where a document does not name it: false.
  const ask = (member: number, context = requestOf(member)) =>
    new TransactionLinkResolver().thankYouGreetingPicture(LINK_ID, false, context)

  /** What a member gets of a link in this state, and which picture's bytes were read for it. */
  const answerFor = async (member: number, state: Partial<typeof openLink>) => {
    jest.clearAllMocks()
    picturesOf.mockResolvedValue(found(state))
    const answer = await ask(member)
    return { answer, read: imageOf.mock.calls.map(([id]) => id) }
  }

  const SMALL_AS_BASE64 = SMALL.toString('base64')

  it('hands the small rendition to the member who made the link, as base64', async () => {
    expect(await ask(SENDER)).toBe(SMALL_AS_BASE64)

    expect(picturesOf).toHaveBeenCalledTimes(1)
    expect(picturesOf).toHaveBeenCalledWith(LINK_ID)
    expect(imageOf).toHaveBeenCalledTimes(1)
    expect(imageOf).toHaveBeenCalledWith(SMALL_ID)
  })

  // ⛔ Every row of the rule, for each of the three who can be signed in.
  it('the member who made the link: open, run out and accepted yes, deleted no', async () => {
    expect(await answerFor(SENDER, {})).toEqual({ answer: SMALL_AS_BASE64, read: [SMALL_ID] })
    expect(await answerFor(SENDER, runOut)).toEqual({ answer: SMALL_AS_BASE64, read: [SMALL_ID] })
    expect(await answerFor(SENDER, accepted)).toEqual({ answer: SMALL_AS_BASE64, read: [SMALL_ID] })
    expect(await answerFor(SENDER, deleted)).toEqual({ answer: null, read: [] })
  })

  it('the member who accepted it: accepted yes; before that, and deleted, no', async () => {
    expect(await answerFor(ACCEPTER, accepted)).toEqual({
      answer: SMALL_AS_BASE64,
      read: [SMALL_ID],
    })
    expect(await answerFor(ACCEPTER, {})).toEqual({ answer: null, read: [] })
    expect(await answerFor(ACCEPTER, runOut)).toEqual({ answer: null, read: [] })
    expect(await answerFor(ACCEPTER, { ...accepted, ...deleted })).toEqual({
      answer: null,
      read: [],
    })
  })

  it('a third member: never, and no picture is read for them', async () => {
    for (const state of [{}, runOut, accepted, deleted]) {
      expect(await answerFor(THIRD, state)).toEqual({ answer: null, read: [] })
    }
  })

  // The large rendition is the page's: by this way it is never read, though it is filed.
  it('never reads the large rendition', async () => {
    for (const member of [SENDER, ACCEPTER, THIRD]) {
      for (const state of [{}, runOut, accepted, deleted]) {
        const { read } = await answerFor(member, state)
        expect(read).not.toContain(LARGE_ID)
      }
    }
  })

  it('answers null for a link without a picture and for no link at all, alike', async () => {
    picturesOf.mockResolvedValue(null)

    expect(await ask(SENDER)).toBeNull()
    expect(imageOf).not.toHaveBeenCalled()
  })

  it('answers null where the small rendition is not there', async () => {
    picturesOf.mockResolvedValue(found({}, [large]))
    expect(await ask(SENDER)).toBeNull()
    expect(imageOf).not.toHaveBeenCalled()

    picturesOf.mockResolvedValue(found())
    imageOf.mockResolvedValue(notFound(SMALL_ID))
    expect(await ask(SENDER)).toBeNull()
  })

  // ⛔ A document may repeat the field under any number of aliases.
  it('serves ten in one HTTP request and refuses the eleventh before anything is read', async () => {
    const context = requestOf(SENDER)
    for (let served = 0; served < THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST; served += 1) {
      expect(await ask(SENDER, context)).toBe(SMALL_AS_BASE64)
    }
    jest.clearAllMocks()

    await expect(ask(SENDER, context)).rejects.toThrow(
      'Too many thank-you greeting pictures requested at once',
    )
    expect(picturesOf).not.toHaveBeenCalled()
    expect(imageOf).not.toHaveBeenCalled()
    expect(context.requestBudget.thankYouGreetingPicturesServed).toBe(
      THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST + 1,
    )
  })

  /**
   * ⛔ No error carries a query: where the database fails at one of the two reads, the member
   * and the log learn that the read failed and the driver's code -- not the statement, and not
   * what it asked for.
   */
  it('says nothing of the query where the read of the link fails', async () => {
    picturesOf.mockRejectedValue(failedRead())

    expectNoQueryIn(await ask(SENDER).catch((error: Error) => error))
    expect(imageOf).not.toHaveBeenCalled()
  })

  it('says nothing of the query where the read of the picture fails', async () => {
    imageOf.mockRejectedValue(failedRead())

    expectNoQueryIn(await ask(SENDER).catch((error: Error) => error))
  })

  it('counts a request that gets nothing as well', async () => {
    const context = requestOf(THIRD)
    await ask(THIRD, context)

    expect(context.requestBudget.thankYouGreetingPicturesServed).toBe(1)
  })

  // Every test above asks without `large`: that their answers stand is what "nothing changes
  // for a document that does not name it" means. None of them counts as a large one.
  it('counts no large rendition where none was asked for', async () => {
    const context = requestOf(SENDER)
    await ask(SENDER, context)
    await ask(SENDER, context)

    expect(context.requestBudget.thankYouGreetingLargePicturesServed).toBe(0)
  })

  /**
   * Asked for the LARGE rendition: the member who made a greeting duplicates it, and the wallet
   * fetches the photo the old one carries (ZE-030).
   */
  describe('asked for the large rendition', () => {
    const askLarge = (member: number, context = requestOf(member), large: boolean | null = true) =>
      new TransactionLinkResolver().thankYouGreetingPicture(LINK_ID, large, context)

    /** As answerFor above, asking for the large rendition. */
    const largeAnswerFor = async (
      member: number,
      state: Partial<typeof openLink>,
      { makerDeletedAt = null as Date | null, pictures = [small, large] } = {},
    ) => {
      jest.clearAllMocks()
      picturesOf.mockResolvedValue({ ...found(state, pictures), makerDeletedAt })
      const answer = await askLarge(member)
      return { answer, read: imageOf.mock.calls.map(([id]) => id) }
    }

    const LARGE_AS_BASE64 = LARGE.toString('base64')
    const theLarge = { answer: LARGE_AS_BASE64, read: [LARGE_ID] }
    const theSmall = { answer: SMALL_AS_BASE64, read: [SMALL_ID] }
    const nothing = { answer: null, read: [] }

    it('hands the large rendition to the member who made the link, as base64', async () => {
      expect(await askLarge(SENDER)).toBe(LARGE_AS_BASE64)

      expect(picturesOf).toHaveBeenCalledTimes(1)
      expect(picturesOf).toHaveBeenCalledWith(LINK_ID)
      expect(imageOf).toHaveBeenCalledTimes(1)
      expect(imageOf).toHaveBeenCalledWith(LARGE_ID)
    })

    // ⛔ Every row of the rule, for each of the three who can be signed in.
    it('the member who made the link: open and run out the large one', async () => {
      expect(await largeAnswerFor(SENDER, {})).toEqual(theLarge)
      expect(await largeAnswerFor(SENDER, runOut)).toEqual(theLarge)
    })

    it('the member who made the link: the small one where no large one is filed', async () => {
      expect(await largeAnswerFor(SENDER, {}, { pictures: [small] })).toEqual(theSmall)
      expect(await largeAnswerFor(SENDER, runOut, { pictures: [small] })).toEqual(theSmall)
    })

    it('the member who made the link: accepted the small one as ever, deleted nothing', async () => {
      expect(await largeAnswerFor(SENDER, accepted)).toEqual(theSmall)
      expect(await largeAnswerFor(SENDER, deleted)).toEqual(nothing)
      expect(await largeAnswerFor(SENDER, { ...runOut, ...deleted })).toEqual(nothing)
    })

    // A deleted account whose session still stands: what it gets without asking, and no more.
    it('the member who made the link, their own account deleted: the small one as ever', async () => {
      const gone = { makerDeletedAt: new Date('2026-10-04T08:00:00.000Z') }

      expect(await largeAnswerFor(SENDER, {}, gone)).toEqual(theSmall)
      expect(await largeAnswerFor(SENDER, runOut, gone)).toEqual(theSmall)
    })

    it('the member who accepted it: the small one and never the large one', async () => {
      expect(await largeAnswerFor(ACCEPTER, accepted)).toEqual(theSmall)
      expect(await largeAnswerFor(ACCEPTER, {})).toEqual(nothing)
      expect(await largeAnswerFor(ACCEPTER, runOut)).toEqual(nothing)
      expect(await largeAnswerFor(ACCEPTER, { ...accepted, ...deleted })).toEqual(nothing)
    })

    it('a third member: never, and no picture is read for them', async () => {
      for (const state of [{}, runOut, accepted, deleted]) {
        expect(await largeAnswerFor(THIRD, state)).toEqual(nothing)
      }
    })

    // ⛔ The large rendition is read for one member in two states, and for nobody else.
    it('reads the large rendition for the maker of an open or run-out link alone', async () => {
      for (const member of [SENDER, ACCEPTER, THIRD]) {
        for (const [name, state] of Object.entries({ open: {}, runOut, accepted, deleted })) {
          const { read } = await largeAnswerFor(member, state)
          if (member === SENDER && (name === 'open' || name === 'runOut')) {
            expect(read).toEqual([LARGE_ID])
          } else {
            expect(read).not.toContain(LARGE_ID)
          }
        }
      }
    })

    it('answers null for a link without a picture and for no link at all, alike', async () => {
      picturesOf.mockResolvedValue(null)

      expect(await askLarge(SENDER)).toBeNull()
      expect(imageOf).not.toHaveBeenCalled()
    })

    // The large rendition goes when the thank-you is accepted, and that may happen between the
    // two reads: no picture then, as at the address of the link.
    it('answers null where the large rendition went between the two reads', async () => {
      imageOf.mockResolvedValue(notFound(LARGE_ID))

      expect(await askLarge(SENDER)).toBeNull()
    })

    // A document may name the argument and give it no value.
    it('takes null for not asking', async () => {
      const context = requestOf(SENDER)

      expect(await askLarge(SENDER, context, null)).toBe(SMALL_AS_BASE64)
      expect(context.requestBudget.thankYouGreetingPicturesServed).toBe(1)
      expect(context.requestBudget.thankYouGreetingLargePicturesServed).toBe(0)
    })

    /**
     * ⛔ The budget of the HTTP request. A large rendition counts as three small ones, and a
     * request holds one call that asks for it -- so no request is served more than ten small
     * ones come to. Counted for the asking, before anything is read.
     */
    it('counts as three, whoever asks and whatever they get', async () => {
      for (const member of [SENDER, THIRD]) {
        const context = requestOf(member)
        await askLarge(member, context)

        expect(context.requestBudget.thankYouGreetingPicturesServed).toBe(
          THANK_YOU_GREETING_LARGE_PICTURE_COUNTS,
        )
        expect(context.requestBudget.thankYouGreetingLargePicturesServed).toBe(1)
      }
      expect(THANK_YOU_GREETING_LARGE_PICTURE_COUNTS).toBe(3)
    })

    // Under two aliases the resolver is called twice with the one budget of the request.
    it('refuses a second one in the same HTTP request before anything is read', async () => {
      const context = requestOf(SENDER)
      expect(await askLarge(SENDER, context)).toBe(LARGE_AS_BASE64)
      jest.clearAllMocks()

      await expect(askLarge(SENDER, context)).rejects.toThrow(
        'Too many thank-you greeting pictures requested at once',
      )
      expect(picturesOf).not.toHaveBeenCalled()
      expect(imageOf).not.toHaveBeenCalled()
      expect(THANK_YOU_GREETING_LARGE_PICTURES_MAX_PER_REQUEST).toBe(1)
    })

    it('serves one large and seven small ones, and refuses the eighth small one', async () => {
      const context = requestOf(SENDER)
      expect(await askLarge(SENDER, context)).toBe(LARGE_AS_BASE64)
      for (let served = 0; served < 7; served += 1) {
        expect(await ask(SENDER, context)).toBe(SMALL_AS_BASE64)
      }
      jest.clearAllMocks()

      await expect(ask(SENDER, context)).rejects.toThrow(
        'Too many thank-you greeting pictures requested at once',
      )
      expect(picturesOf).not.toHaveBeenCalled()
    })

    // The other way round: eight small ones first leave no room for a large one.
    it('refuses the large one after eight small ones', async () => {
      const context = requestOf(SENDER)
      for (let served = 0; served < 8; served += 1) {
        expect(await ask(SENDER, context)).toBe(SMALL_AS_BASE64)
      }
      jest.clearAllMocks()

      await expect(askLarge(SENDER, context)).rejects.toThrow(
        'Too many thank-you greeting pictures requested at once',
      )
      expect(picturesOf).not.toHaveBeenCalled()
      expect(imageOf).not.toHaveBeenCalled()
    })

    // What the wallet asks where it duplicates a greeting: both renditions in one request.
    it('serves the small and the large rendition of one link in one request', async () => {
      const context = requestOf(SENDER)

      expect(await ask(SENDER, context)).toBe(SMALL_AS_BASE64)
      expect(await askLarge(SENDER, context)).toBe(LARGE_AS_BASE64)
      expect(context.requestBudget.thankYouGreetingPicturesServed).toBe(4)
    })

    // The request log leaves the answer out by this count (plugins.ts): it must not be zero.
    it('leaves the count the request log reads above zero', async () => {
      const context = requestOf(SENDER)
      await askLarge(SENDER, context)

      expect(context.requestBudget.thankYouGreetingPicturesServed).toBeGreaterThan(0)
    })

    it('says nothing of the query where a read fails', async () => {
      picturesOf.mockRejectedValue(failedRead())
      expectNoQueryIn(await askLarge(SENDER).catch((error: Error) => error))
      expect(imageOf).not.toHaveBeenCalled()

      jest.clearAllMocks()
      picturesOf.mockResolvedValue(found())
      imageOf.mockRejectedValue(failedRead())
      expectNoQueryIn(await askLarge(SENDER).catch((error: Error) => error))
    })
  })
})

describe('addThankYouGreetingPicture', () => {
  const picture = (data = LARGE.toString('base64'), width = 1080, height = 750) => ({
    data,
    width,
    height,
  })
  const add = (member = SENDER, sent = picture()) =>
    new TransactionLinkResolver().addThankYouGreetingPicture(LINK_ID, sent, requestOf(member))

  beforeEach(() => {
    // The link as it stands before the upload: its small rendition, and no large one yet.
    picturesOf.mockResolvedValue(found({}, [small]))
  })

  it('files the large rendition under the code of the link, for the member who made it', async () => {
    expect(await add()).toBe(true)

    expect(insertPicture).toHaveBeenCalledTimes(1)
    expect(insertPicture).toHaveBeenCalledWith({
      transactionLinkCode: CODE,
      rendition: 'large',
      width: 1080,
      height: 750,
      image: LARGE,
      mimeType: 'image/jpeg',
    })
    expect(removeLarge).not.toHaveBeenCalled()
  })

  // What a picture has to be is asked first: it says nothing about any link.
  it('refuses what is no picture before the database is asked anything', async () => {
    const tooLarge = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.alloc(THANK_YOU_PICTURE_LARGE_MAX_BYTES, 0x20),
      Buffer.from([0xff, 0xd9]),
    ]).toString('base64')
    for (const [sent, reason] of [
      [picture(''), 'EMPTY'],
      [picture(tooLarge), 'TOO_LARGE'],
      [picture(Buffer.from('<svg onload=alert(1)>').toString('base64')), 'NOT_JPEG'],
      [picture(undefined, 1200, 833), 'SIZE'],
      [picture(undefined, CHAT_IMAGE_MAX_SIDE + 1, 100), 'SIZE'],
    ] as const) {
      await expect(add(SENDER, sent)).rejects.toThrow(`THANK_YOU_PICTURE_NOT_ACCEPTED: ${reason}`)
    }
    expect(picturesOf).not.toHaveBeenCalled()
    expect(insertPicture).not.toHaveBeenCalled()
    // The log gets the numbers, never the picture.
    expect(inspect(logErrorLogger.error.mock.calls, { depth: 6 })).not.toContain(SECRET)
    expect(inspect(logErrorLogger.error.mock.calls, { depth: 6 })).not.toContain(tooLarge)
  })

  // ⛔ One answer for every link the member may not add to -- nothing tells them apart.
  it('answers false, and files nothing, for somebody else’s link', async () => {
    expect(await add(THIRD)).toBe(false)
    expect(await add(ACCEPTER)).toBe(false)
    expect(insertPicture).not.toHaveBeenCalled()
  })

  it('answers false for a link that is accepted, run out or deleted', async () => {
    for (const state of [accepted, runOut, deleted]) {
      picturesOf.mockResolvedValue(found(state, [small]))
      expect(await add()).toBe(false)
    }
    expect(insertPicture).not.toHaveBeenCalled()
  })

  it('answers false for a greeting with a motif, a plain link and no link at all', async () => {
    picturesOf.mockResolvedValue(null)

    expect(await add()).toBe(false)
    expect(insertPicture).not.toHaveBeenCalled()
  })

  it('answers false a second time', async () => {
    picturesOf.mockResolvedValue(found({}, [small, large]))

    expect(await add()).toBe(false)
    expect(insertPicture).not.toHaveBeenCalled()
  })

  // Two uploads at once: the unique key refuses the second -- and the first one's row stays.
  it('answers false where the key refuses the row, and takes nothing out', async () => {
    insertPicture.mockResolvedValue({
      success: false,
      error: new DBDuplicateEntryError('thank_you_greeting_pictures', 'x', `${CODE} large`),
    })

    expect(await add()).toBe(false)
    expect(removeLarge).not.toHaveBeenCalled()
  })

  // ⛔ Accepting and deleting write their mark first and take the large rendition out
  // afterwards; this files it first and reads the mark afterwards -- one of the two sees the
  // other, whichever comes first.
  describe('the thank-you was accepted, or the link deleted, while the picture came in', () => {
    const closesMeanwhile = (after: ThankYouGreetingPicturesOfLink | null | Error) => {
      picturesOf.mockReset()
      picturesOf.mockResolvedValueOnce(found({}, [small]))
      if (after instanceof Error) {
        picturesOf.mockRejectedValueOnce(after)
      } else {
        picturesOf.mockResolvedValueOnce(after)
      }
    }

    it('takes the large rendition back out where the link was accepted meanwhile', async () => {
      closesMeanwhile(found(accepted, [small, large]))

      expect(await add()).toBe(false)

      expect(insertPicture).toHaveBeenCalledTimes(1)
      expect(removeLarge).toHaveBeenCalledTimes(1)
      expect(removeLarge).toHaveBeenCalledWith(CODE)
    })

    it('where it was deleted meanwhile -- with its pictures or before this one was filed', async () => {
      closesMeanwhile(null)
      expect(await add()).toBe(false)
      expect(removeLarge).toHaveBeenLastCalledWith(CODE)

      closesMeanwhile(found(deleted, [large]))
      expect(await add()).toBe(false)
      expect(removeLarge).toHaveBeenLastCalledWith(CODE)
      expect(removeLarge).toHaveBeenCalledTimes(2)
    })

    // A link that only ran out keeps its pictures: nothing takes them out but its deletion.
    it('leaves it where the link ran out meanwhile', async () => {
      closesMeanwhile(found(runOut, [small, large]))

      expect(await add()).toBe(true)
      expect(removeLarge).not.toHaveBeenCalled()
    })

    it('and where the second look itself fails', async () => {
      closesMeanwhile(failedQuery())

      expect(await add()).toBe(false)
      expect(removeLarge).toHaveBeenCalledWith(CODE)
    })

    it('leaves it where the link is still open', async () => {
      closesMeanwhile(found({}, [small, large]))

      expect(await add()).toBe(true)
      expect(removeLarge).not.toHaveBeenCalled()
    })
  })

  it('says nothing of the query where the read of the link fails, and files nothing', async () => {
    picturesOf.mockRejectedValue(failedRead())

    expectNoQueryIn(await add().catch((error: Error) => error))
    expect(insertPicture).not.toHaveBeenCalled()
  })

  // Drizzle writes the parameters of a statement into the message of its error -- the picture
  // among them. What reaches the log and the client is the driver's code.
  it('keeps the picture out of the log and the answer where the database itself throws', async () => {
    insertPicture.mockRejectedValue(failedQuery())

    const failure = await add().catch((error: Error) => error)

    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toBe('Unable to save thank-you greeting picture')
    expect(logErrorLogger.error).toHaveBeenCalledWith(
      'Unable to save thank-you greeting picture',
      'ER_LOCK_WAIT_TIMEOUT',
    )
    expect(inspect(logErrorLogger.error.mock.calls, { depth: 6 })).not.toContain(SECRET)
    expect(inspect(failure, { depth: 6 })).not.toContain(SECRET)
  })
})
