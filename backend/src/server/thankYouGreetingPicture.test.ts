// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { getLogger } from 'config-schema/test/testSetup'
import {
  DBNotFoundError,
  dbSelectThankYouGreetingPictureImage,
  dbSelectThankYouGreetingPicturesByLinkCode,
  ThankYouGreetingPicturesOfLink,
} from 'database'
import { DrizzleQueryError } from 'drizzle-orm'
import express from 'express'
import helmet from 'helmet'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { cors } from './cors'
import {
  apiThankYouGreetingPicture,
  THANK_YOU_GREETING_PICTURE_PATH,
  thankYouGreetingPictureForCode,
} from './thankYouGreetingPicture'

// What the database answers is mocked here: the subject is what the address decides itself --
// which code it asks the database about at all, which rendition it serves, and what an answer
// looks like on the wire. TransactionLinkResolver.greetingPicture.test.ts runs the same address
// against a database, through the server createServer builds.
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbSelectThankYouGreetingPicturesByLinkCode: jest.fn(),
    dbSelectThankYouGreetingPictureImage: jest.fn(),
  }
})

const picturesOf = dbSelectThankYouGreetingPicturesByLinkCode as jest.MockedFunction<
  typeof dbSelectThankYouGreetingPicturesByLinkCode
>
const imageOf = dbSelectThankYouGreetingPictureImage as jest.MockedFunction<
  typeof dbSelectThankYouGreetingPictureImage
>

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.thankYouGreetingPicture`)

const CODE = 'a1f9c2d41b7e19981fa0d001'
const NOW = new Date('2026-10-03T16:30:00.000Z')
const SMALL_ID = 11
const LARGE_ID = 12
// Something recognisable inside each: what is served is seen, and what a log shows.
const SMALL = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from('the small rendition'),
  Buffer.from([0xff, 0xd9]),
])
const LARGE = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from('the large rendition of a private photo'),
  Buffer.from([0xff, 0xd9]),
])

const openLink = {
  id: 7,
  code: CODE,
  userId: 4711,
  validUntil: new Date('2026-10-17T14:00:00.000Z'),
  redeemedAt: null as Date | null,
  redeemedBy: null as number | null,
  deletedAt: null as Date | null,
}
const small = { id: SMALL_ID, rendition: 'small' as const, width: 831, height: 577 }
const large = { id: LARGE_ID, rendition: 'large' as const, width: 1080, height: 750 }

const found = (
  link: Partial<typeof openLink> = {},
  pictures = [small, large],
  makerDeletedAt: Date | null = null,
): ThankYouGreetingPicturesOfLink => ({ link: { ...openLink, ...link }, makerDeletedAt, pictures })

const notFound = (id: number) => ({
  success: false as const,
  error: new DBNotFoundError('thank_you_greeting_pictures', `id = ${id}`),
})

// A failed query as Drizzle throws it: the statement and its parameters -- the code of the link
// among them -- in the message and as properties of their own, the driver's error as the cause.
const databaseFailure = () =>
  new DrizzleQueryError(
    'select `id` from `thank_you_greeting_pictures` where `transaction_link_code` = ?',
    [CODE],
    Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }),
  )

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
})

describe('thankYouGreetingPictureForCode', () => {
  it('serves the large rendition of an open link', async () => {
    expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBe(LARGE)

    expect(picturesOf).toHaveBeenCalledTimes(1)
    expect(picturesOf).toHaveBeenCalledWith(CODE)
    expect(imageOf).toHaveBeenCalledTimes(1)
    expect(imageOf).toHaveBeenCalledWith(LARGE_ID)
  })

  it('serves the small one where no large one is filed', async () => {
    picturesOf.mockResolvedValue(found({}, [small]))

    expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBe(SMALL)
    expect(imageOf).toHaveBeenCalledWith(SMALL_ID)
  })

  // The form is asked before the database: a made-up address costs no query.
  it('asks the database nothing about a text that is no code', async () => {
    for (const noCode of [
      '',
      'x',
      'a1f9c2d41b7e19981fa0d00',
      'a1f9c2d41b7e19981fa0d0011',
      "a1f9c2d41b7e19981fa0d00'",
      'CL-a1f9c2d41b7e19981fa0d',
      undefined,
      ['a1f9c2d41b7e19981fa0d001'],
    ]) {
      expect(await thankYouGreetingPictureForCode(noCode, NOW)).toBeNull()
    }
    expect(picturesOf).not.toHaveBeenCalled()
    expect(imageOf).not.toHaveBeenCalled()
  })

  it('serves nothing for a code without a picture, and reads no picture', async () => {
    picturesOf.mockResolvedValue(null)

    expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBeNull()
    expect(imageOf).not.toHaveBeenCalled()
  })

  // ⛔ The rule's rows for whoever holds the code: an open link, and no other.
  it('serves nothing once the link is accepted, run out or deleted -- and reads no picture', async () => {
    const closed = [
      { redeemedAt: new Date('2026-10-03T15:00:00.000Z'), redeemedBy: 815 },
      { validUntil: new Date('2026-10-03T16:29:59.999Z') },
      { deletedAt: new Date('2026-10-03T15:00:00.000Z') },
    ]
    for (const state of closed) {
      picturesOf.mockResolvedValue(found(state))
      expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBeNull()
    }
    expect(picturesOf).toHaveBeenCalledTimes(closed.length)
    expect(imageOf).not.toHaveBeenCalled()
  })

  /**
   * ⛔ The account of the member who made the link is deleted: the page of the link opens no
   * more, and its code shows no picture -- though the link's own row still reads "open".
   */
  it('serves nothing of a link whose maker’s account is deleted -- and reads no picture', async () => {
    picturesOf.mockResolvedValue(found({}, [small, large], new Date('2026-10-03T15:00:00.000Z')))

    expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBeNull()
    expect(imageOf).not.toHaveBeenCalled()
  })

  it('serves the picture up to the very moment the link runs out', async () => {
    picturesOf.mockResolvedValue(found({ validUntil: NOW }))

    expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBe(LARGE)
  })

  // The thank-you was accepted between the two reads: the large rendition is gone.
  it('serves nothing where the picture went between the two reads', async () => {
    imageOf.mockResolvedValue(notFound(LARGE_ID))

    expect(await thankYouGreetingPictureForCode(CODE, NOW)).toBeNull()
  })
})

/** One answer of the address, as it goes over the wire. */
type Answer = { status: number; headers: IncomingHttpHeaders; body: Buffer }

/**
 * The address behind the middleware createServer puts before it -- cors and helmet --, asked
 * over HTTP: what a browser gets, header for header.
 */
describe('GET /api/thank-you-greeting-picture/<code>', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    const app = express()
    app.use(cors)
    app.use(helmet())
    app.use(THANK_YOU_GREETING_PICTURE_PATH, apiThankYouGreetingPicture)
    // What stands under `/` in createServer, after the address: Apollo, which answers a GET it
    // cannot read with a 400 and words of its own. Nothing below the address may get there.
    app.use((_req, res) => {
      res.status(400).send('GET query missing.')
    })
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    port = (server.address() as AddressInfo).port
  })
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  const ask = (
    path: string,
    { method = 'GET', headers = {} }: { method?: string; headers?: Record<string, string> } = {},
  ): Promise<Answer> =>
    new Promise((resolve, reject) => {
      const req = httpRequest({ host: '127.0.0.1', port, path, method, headers }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        )
      })
      req.on('error', reject)
      req.end()
    })

  const addressOf = (code: string) => `/api/thank-you-greeting-picture/${code}`

  /** An answer without what differs from one request to the next by itself. */
  const withoutDate = ({ status, headers, body }: Answer) => {
    const { date: _date, ...rest } = headers
    return { status, headers: rest, body: body.toString('base64') }
  }

  it('serves the picture as image/jpeg, byte for byte, and tells the browser to keep nothing', async () => {
    const answer = await ask(addressOf(CODE))

    expect(answer.status).toBe(200)
    expect(answer.body.equals(LARGE)).toBe(true)
    expect(answer.headers['content-type']).toBe('image/jpeg')
    expect(answer.headers['content-length']).toBe(String(LARGE.length))
    expect(answer.headers['cache-control']).toBe('no-store')
    // helmet's, which this address counts on: the browser reads it as a picture or not at all,
    // and no other site shows it as its own.
    expect(answer.headers['x-content-type-options']).toBe('nosniff')
    expect(answer.headers['cross-origin-resource-policy']).toBe('same-origin')
    // Its own, in the place of helmet's: shown as a document, it may load and run nothing and
    // has no origin -- the wallet's storage, where a session lives, is out of its reach.
    expect(answer.headers['content-security-policy']).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    )
    // No validator either: an ETag would be something to ask again with.
    expect(answer.headers.etag).toBeUndefined()
    expect(answer.headers['last-modified']).toBeUndefined()
  })

  it('finds the link of a code written in capitals, as the page of the link does', async () => {
    const answer = await ask(addressOf(CODE.toUpperCase()))

    expect(answer.status).toBe(200)
    expect(picturesOf).toHaveBeenCalledWith(CODE.toUpperCase())
  })

  // ⛔ One empty answer, whatever the reason -- nothing on the wire tells them apart.
  it('answers every other case with the same empty answer', async () => {
    const empty: Answer[] = []

    // No code at all.
    empty.push(await ask(addressOf('no-code')))
    // An unknown code, and a link without a picture.
    picturesOf.mockResolvedValue(null)
    empty.push(await ask(addressOf(CODE)))
    // Accepted, run out, deleted.
    for (const state of [
      { redeemedAt: new Date('2026-10-03T15:00:00.000Z'), redeemedBy: 815 },
      { validUntil: new Date('2020-01-01T00:00:00.000Z') },
      { deletedAt: new Date('2026-10-03T15:00:00.000Z') },
    ]) {
      picturesOf.mockResolvedValue(found(state))
      empty.push(await ask(addressOf(CODE)))
    }
    // The account of the member who made the link is deleted.
    picturesOf.mockResolvedValue(found({}, [small, large], new Date('2026-10-03T15:00:00.000Z')))
    empty.push(await ask(addressOf(CODE)))
    // The picture went between the two reads.
    picturesOf.mockResolvedValue(found())
    imageOf.mockResolvedValue(notFound(LARGE_ID))
    empty.push(await ask(addressOf(CODE)))
    // The database does not answer.
    picturesOf.mockRejectedValue(databaseFailure())
    empty.push(await ask(addressOf(CODE)))

    expect(empty).toHaveLength(8)
    const first = withoutDate(empty[0])
    expect(first.status).toBe(404)
    expect(first.body).toBe('')
    expect(first.headers['content-length']).toBe('0')
    expect(first.headers['content-type']).toBeUndefined()
    expect(first.headers['cache-control']).toBe('no-store')
    for (const answer of empty) {
      expect(withoutDate(answer)).toEqual(first)
    }
  })

  it('writes the driver code of a failed query to the log, and neither its message nor the code of the link', async () => {
    picturesOf.mockRejectedValue(databaseFailure())

    await ask(addressOf(CODE))

    // Exactly one text and nothing beside it: an error handed to the logger as a second part
    // would be written out with its message, its parameters and its stack.
    expect(logger.error.mock.calls).toEqual([
      ['thank-you greeting picture not served (ECONNRESET)'],
    ])
    // What such a failure carries and the log must not: the check is not of an empty error.
    expect(databaseFailure().message).toContain(CODE)
    expect(databaseFailure().params).toEqual([CODE])
  })

  // Nothing of the request goes into a header of the answer, for the picture or for the empty
  // answer: asked with headers and a query of its own, the address answers as it does without.
  it('puts nothing of the request into its answer', async () => {
    const plain = await ask(addressOf(CODE))
    const dressedUp = await ask(`${addressOf(CODE)}?download=x.html&type=text/html`, {
      headers: {
        Accept: 'text/html',
        Origin: 'https://example.org',
        Referer: 'https://example.org/x',
        'X-Forwarded-Host': 'example.org',
        Range: 'bytes=0-3',
        'If-None-Match': '*',
      },
    })
    expect(withoutDate(dressedUp)).toEqual(withoutDate(plain))

    picturesOf.mockResolvedValue(null)
    const emptyPlain = await ask(addressOf(CODE))
    const emptyDressedUp = await ask(`${addressOf(CODE)}?x=<script>`, {
      headers: { Accept: 'text/html', Origin: 'https://example.org' },
    })
    expect(withoutDate(emptyDressedUp)).toEqual(withoutDate(emptyPlain))
  })

  it('answers HEAD with the headers of the picture and no body', async () => {
    const answer = await ask(addressOf(CODE), { method: 'HEAD' })

    expect(answer.status).toBe(200)
    expect(answer.headers['content-type']).toBe('image/jpeg')
    expect(answer.headers['content-length']).toBe(String(LARGE.length))
    expect(answer.body).toHaveLength(0)
  })

  /** The empty answer, as the address gives it for a text that is no code. */
  const emptyAnswer = async () => withoutDate(await ask(addressOf('no-code')))

  it('is no address for anything but reading: the same empty answer', async () => {
    const empty = await emptyAnswer()
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const answer = await ask(addressOf(CODE), { method })
      expect(withoutDate(answer)).toEqual(empty)
    }
    expect(picturesOf).not.toHaveBeenCalled()
    expect(imageOf).not.toHaveBeenCalled()
  })

  /**
   * ⛔ Everything below the address is the address's own to answer, and gets the one empty
   * answer: a file's ending, a further part, nothing at all, an escape that cannot be decoded.
   * None of them falls through to what stands under `/` behind it, and none reaches the database.
   */
  it('takes a code and nothing after it: the same empty answer for every path below it', async () => {
    const empty = await emptyAnswer()
    expect(empty.status).toBe(404)
    for (const path of [
      `${addressOf(CODE)}/x`,
      `${addressOf(CODE)}.jpg`,
      `${addressOf(CODE)}/`,
      `${addressOf(CODE)}%2Fx`,
      '/api/thank-you-greeting-picture/',
      '/api/thank-you-greeting-picture',
      '/api/thank-you-greeting-picture/%E0%A4',
      '/api/thank-you-greeting-picture/%',
      `/api/thank-you-greeting-picture/..%2F${CODE}`,
      `/api/thank-you-greeting-picture/x/${CODE}`,
    ]) {
      const answer = await ask(path)
      // with the path beside it, so that a failure names the one it was
      expect({ path, answer: withoutDate(answer) }).toEqual({ path, answer: empty })
      expect(answer.body.toString()).not.toContain('GET query missing')
    }
    expect(picturesOf).not.toHaveBeenCalled()
    expect(imageOf).not.toHaveBeenCalled()
  })

  // The address is this path and no other that begins like it.
  it('leaves a path that only begins like the address to what stands behind it', async () => {
    const answer = await ask(`/api/thank-you-greeting-picture-x/${CODE}`)

    expect(answer.status).toBe(400)
    expect(picturesOf).not.toHaveBeenCalled()
  })
})
