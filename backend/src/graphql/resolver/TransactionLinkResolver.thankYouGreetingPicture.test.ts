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
import { reencodeImage } from 'shared-native'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST } from '@/data/ThankYouGreetingPicture.logic'
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
// A picture that decodes -- 4 x 2 grey pixels, the smallest JPEG ImageMagick writes -- with the
// secret in a comment segment: the upload is decoded and encoded again before it is filed.
const PICTURE = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/wAALCAACAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z',
  'base64',
)
const LARGE = Buffer.concat([
  PICTURE.subarray(0, 2),
  Buffer.from([0xff, 0xfe, 0x00, SECRET.length + 2]),
  Buffer.from(SECRET),
  PICTURE.subarray(2),
])
// LARGE as the server files it: at the quality it came in with, the encoder's own default.
let LARGE_STORED: Buffer
beforeAll(async () => {
  const reencoded = await reencodeImage(LARGE, { maxOutputBytes: 64 * 1024 })
  if (!reencoded.success) {
    throw new Error(reencoded.error.name)
  }
  LARGE_STORED = reencoded.value.data
})

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
  const ask = (member: number, context = requestOf(member)) =>
    new TransactionLinkResolver().thankYouGreetingPicture(LINK_ID, context)

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

  // ⛔ A document may repeat the mutation under aliases, with one picture in its variables.
  it('takes one picture in an HTTP request, and does no work on a second', async () => {
    const context = requestOf(SENDER)
    const resolver = new TransactionLinkResolver()

    expect(await resolver.addThankYouGreetingPicture(LINK_ID, picture(), context)).toBe(true)
    expect(insertPicture).toHaveBeenCalledTimes(1)
    picturesOf.mockClear()

    await expect(resolver.addThankYouGreetingPicture(LINK_ID, picture(), context)).rejects.toThrow(
      'Too many thank-you greeting pictures sent at once',
    )
    // Refused before the picture is looked at: not even what is no picture gets an answer.
    await expect(
      resolver.addThankYouGreetingPicture(LINK_ID, picture(''), context),
    ).rejects.toThrow('Too many thank-you greeting pictures sent at once')

    expect(picturesOf).not.toHaveBeenCalled()
    expect(insertPicture).toHaveBeenCalledTimes(1)
    expect(context.requestBudget.thankYouGreetingPicturesAccepted).toBe(3)
    // Another request has a budget of its own.
    expect(await add()).toBe(true)
  })

  it('files the large rendition under the code of the link, for the member who made it', async () => {
    expect(await add()).toBe(true)

    expect(insertPicture).toHaveBeenCalledTimes(1)
    // The picture encoded again, at the size it has -- not the bytes and the size as sent.
    expect(insertPicture).toHaveBeenCalledWith({
      transactionLinkCode: CODE,
      rendition: 'large',
      width: 4,
      height: 2,
      image: LARGE_STORED,
      mimeType: 'image/jpeg',
    })
    expect(LARGE.includes(SECRET)).toBe(true)
    expect(LARGE_STORED.includes(SECRET)).toBe(false)
    expect(removeLarge).not.toHaveBeenCalled()
  })

  // What a picture has to be is asked first: it says nothing about any link.
  it('refuses what is no picture before the database is asked anything', async () => {
    const tooLarge = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.alloc(THANK_YOU_PICTURE_LARGE_MAX_BYTES, 0x20),
      Buffer.from([0xff, 0xd9]),
    ]).toString('base64')
    const noPicture = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from(SECRET),
      Buffer.from([0xff, 0xd9]),
    ]).toString('base64')
    for (const [sent, reason] of [
      [picture(''), 'EMPTY'],
      [picture(tooLarge), 'TOO_LARGE'],
      [picture(Buffer.from('<svg onload=alert(1)>').toString('base64')), 'NOT_JPEG'],
      // A JPEG at both ends and no picture between.
      [picture(noPicture), 'NOT_JPEG'],
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
