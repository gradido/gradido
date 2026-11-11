// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { node } from '@elysia/node'
import { listenOnFreePort } from '@test/listenOnFreePort'
import { DrizzleQueryError } from 'drizzle-orm'
import { Elysia } from 'elysia'
import { helmet } from 'elysia-helmet'
import { cors } from './cors'

// Which picture a code gets is thankYouGreetingPictureForCode's, tested in core, and mocked
// here: the subject is what an answer of the address looks like on the wire.
// TransactionLinkResolver.greetingPicture.test.ts runs the same address against a database,
// through the server createServer builds.
const mockPictureForCode = jest.fn()
const mockLogger = { error: jest.fn() }
jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('core', () => ({
  thankYouGreetingPictureForCode: mockPictureForCode,
}))

const CODE = 'a1f9c2d41b7e19981fa0d001'
// Something recognisable inside: what is served is seen, and what a log shows.
const LARGE = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from('the large rendition of a private photo'),
  Buffer.from([0xff, 0xd9]),
])

// A failed query as Drizzle throws it: the statement and its parameters -- the code of the link
// among them -- in the message and as properties of their own, the driver's error as the cause.
const databaseFailure = () =>
  new DrizzleQueryError(
    'select `id` from `thank_you_greeting_pictures` where `transaction_link_code` = ?',
    [CODE],
    Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }),
  )

beforeEach(() => {
  jest.resetAllMocks()
  // a picture for every text of the form of a code (24 hex digits, either case), as for an
  // open link with one
  mockPictureForCode.mockImplementation(async (code: string) =>
    /^[0-9a-f]{24}$/i.test(code) ? LARGE : null,
  )
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
    const { thankYouGreetingPictureRoutes } = await import('./thankYouGreetingPicture')
    const app = new Elysia({ adapter: node() })
      .use(cors)
      .use(
        helmet({
          originAgentCluster: false,
          crossOriginEmbedderPolicy: true,
        }),
      )
      .use(thankYouGreetingPictureRoutes)
    server = await listenOnFreePort(app)
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
    expect(mockPictureForCode).toHaveBeenCalledWith(CODE.toUpperCase(), expect.any(Date))
  })

  // ⛔ One empty answer, whatever the reason -- nothing on the wire tells them apart.
  it('answers every other case with the same empty answer', async () => {
    const empty: Answer[] = []

    // No code at all.
    empty.push(await ask(addressOf('no-code')))
    // A code without a picture to serve: unknown, no picture, the link not open.
    mockPictureForCode.mockResolvedValue(null)
    empty.push(await ask(addressOf(CODE)))
    // The database does not answer.
    mockPictureForCode.mockRejectedValue(databaseFailure())
    empty.push(await ask(addressOf(CODE)))

    expect(empty).toHaveLength(3)
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
    mockPictureForCode.mockRejectedValue(databaseFailure())

    await ask(addressOf(CODE))

    // Exactly one text and nothing beside it: an error handed to the logger as a second part
    // would be written out with its message, its parameters and its stack.
    expect(mockLogger.error.mock.calls).toEqual([
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

    mockPictureForCode.mockResolvedValue(null)
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

  /**
   * One part after the address is the text held against the form of a code: with a file's
   * ending or an escape it is no code, and gets the one empty answer.
   */
  it('takes a code and nothing after it: the same empty answer for a text with more in it', async () => {
    const empty = await emptyAnswer()
    expect(empty.status).toBe(404)
    for (const path of [
      `${addressOf(CODE)}.jpg`,
      `${addressOf(CODE)}%2Fx`,
      '/api/thank-you-greeting-picture/%E0%A4',
      '/api/thank-you-greeting-picture/%',
      `/api/thank-you-greeting-picture/..%2F${CODE}`,
    ]) {
      const answer = await ask(path)
      // with the path beside it, so that a failure names the one it was
      expect({ path, answer: withoutDate(answer) }).toEqual({ path, answer: empty })
    }
  })

  // The route is GET and HEAD of one part after the address. Anything else is no route of
  // this server, whatever the code in it.
  it('is no route for another method, a further part, or a path that only begins like it', async () => {
    for (const [method, path] of [
      ['POST', addressOf(CODE)],
      ['PUT', addressOf(CODE)],
      ['DELETE', addressOf(CODE)],
      ['PATCH', addressOf(CODE)],
      ['GET', `${addressOf(CODE)}/x`],
      ['GET', `/api/thank-you-greeting-picture/x/${CODE}`],
      ['GET', '/api/thank-you-greeting-picture/'],
      ['GET', '/api/thank-you-greeting-picture'],
      ['GET', `/api/thank-you-greeting-picture-x/${CODE}`],
    ]) {
      const answer = await ask(path, { method })
      expect({ method, path, status: answer.status }).toEqual({ method, path, status: 404 })
    }
    expect(mockPictureForCode).not.toHaveBeenCalled()
  })
})
