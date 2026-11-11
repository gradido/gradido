// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { node } from '@elysia/node'
import { listenOnFreePort } from '@test/listenOnFreePort'
import { Elysia } from 'elysia'
import { helmet } from 'elysia-helmet'
import { CONFIG } from '@/config'
import type { RedeemPreview } from '@/data/RedeemPreview.logic'
import { cors } from './cors'

// What the route makes of a preview on the wire -- status, headers, the document line for line.
// Everything below it is mocked: which link has which preview is redeemPreviewOf's
// (data/RedeemPreview.logic.test.ts), the phrases of the ten languages are core's
// (locales/localization.test.ts), and redeemPreview.database.test.ts runs the address against a
// database, through the server createServer builds.
const mockFindLink = jest.fn()
const mockDriverCode = jest.fn()
const mockRedeemPreviewOf = jest.fn()
const mockTranslate = jest.fn()
const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}
jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('core', () => ({
  hasFormOfLinkCode: (text: unknown) => typeof text === 'string' && /^[0-9a-f]{24}$/i.test(text),
  translateForLocale: mockTranslate,
}))
jest.mock('database', () => ({
  dbFindTransactionLinkForPreview: mockFindLink,
  driverCodeOfFailedQuery: mockDriverCode,
}))
jest.mock('@/data/RedeemPreview.logic', () => ({
  OG_LOCALE: { de: 'de_DE', fr: 'fr_FR' },
  redeemPreviewOf: mockRedeemPreviewOf,
}))

const WALLET = 'https://wallet.example'
const CODE = 'a1f9c2d41b7e19981fa0d001'
const FOUND = { found: 'the row of the link' }
const PREVIEW: RedeemPreview = {
  code: CODE,
  kind: 'greeting',
  name: 'Oma-Emma',
  language: 'de',
  picture: { kind: 'photo', width: 1080, height: 750 },
}
const TITLE = 'Oma-Emma hat Dir einen Dank-Gruß geschickt'
const DESCRIPTION = 'Helfen. Schenken. Danken.'

/** One answer of the address, as it goes over the wire. */
type Answer = { status: number; headers: IncomingHttpHeaders; body: string }

/** An answer without what differs from one request to the next by itself. */
const withoutDate = ({ status, headers, body }: Answer) => {
  const { date: _date, ...rest } = headers
  return { status, headers: rest, body }
}

/**
 * The `og:` and `twitter:` lines of a document as a messenger reads them: out of the head,
 * within the first 300 KB (WhatsApp reads no further), every line it finds -- so that a line
 * written twice shows as two.
 */
const previewLines = (document: string): [string, string][] => {
  const head = document.slice(0, 300_000).split('</head>')[0]
  return [
    ...head.matchAll(/<meta (?:property|name)="((?:og|twitter):[^"]*)" content="([^"]*)">/g),
  ].map(([, name, content]) => [name, content])
}

let server: Server
let port: number
const configured = {
  COMMUNITY_URL: CONFIG.COMMUNITY_URL,
  COMMUNITY_REDEEM_URL: CONFIG.COMMUNITY_REDEEM_URL,
}

/**
 * The address behind the middleware createServer puts before it -- cors and helmet --, asked
 * over HTTP: what a messenger gets, header for header.
 */
beforeAll(async () => {
  const { redeemPreviewRoutes } = await import('./redeemPreview')
  CONFIG.COMMUNITY_URL = WALLET
  CONFIG.COMMUNITY_REDEEM_URL = `${WALLET}/redeem/`
  const app = new Elysia({ adapter: node() })
    .use(cors)
    .use(
      helmet({
        originAgentCluster: false,
        crossOriginEmbedderPolicy: true,
      }),
    )
    // An answer of the same server that sets no header of its own: what cors and helmet give
    // every answer.
    .get('/plain', () => new Response(null, { status: 204 }))
    .use(redeemPreviewRoutes)
  server = await listenOnFreePort(app)
  port = (server.address() as AddressInfo).port
})
afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  Object.assign(CONFIG, configured)
})

beforeEach(() => {
  jest.resetAllMocks()
  mockFindLink.mockResolvedValue(FOUND)
  mockRedeemPreviewOf.mockReturnValue(PREVIEW)
  mockTranslate.mockImplementation((_language: string, key: string, values?: { name: string }) =>
    key === 'redeemPreview.description'
      ? DESCRIPTION
      : `${values?.name} hat Dir einen ${key === 'redeemPreview.greetingTitle' ? 'Dank-Gruß' : 'Dank'} geschickt`,
  )
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
          body: Buffer.concat(chunks).toString('utf8'),
        }),
      )
    })
    req.on('error', reject)
    req.end()
  })

const addressOf = (code: string) => `/api/redeem-preview/${code}`

/** What cors and helmet give every answer of this server. */
const middlewareHeaders = async () => {
  const { 'content-length': _length, ...headers } = withoutDate(await ask('/plain')).headers
  return headers
}

/** The one answer for every link without a preview of its own: on to the wallet's address. */
const expectSentOn = async (answer: Answer) => {
  expect(withoutDate(answer)).toEqual({
    status: 302,
    headers: {
      ...(await middlewareHeaders()),
      'cache-control': 'no-store',
      'content-length': '0',
      location: `${WALLET}/`,
    },
    body: '',
  })
}

describe('GET /api/redeem-preview/<code>', () => {
  describe('for a link with a preview', () => {
    it('answers with a document of exactly these lines for a greeting with a photo', async () => {
      const answer = await ask(addressOf(CODE))

      expect(answer.status).toBe(200)
      expect(answer.body.split('\n')).toEqual([
        '<!doctype html>',
        '<html lang="de">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${TITLE}</title>`,
        '<meta name="robots" content="noindex">',
        `<link rel="canonical" href="${WALLET}/redeem/${CODE}">`,
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Gradido">',
        '<meta property="og:locale" content="de_DE">',
        `<meta property="og:url" content="${WALLET}/redeem/${CODE}">`,
        `<meta property="og:title" content="${TITLE}">`,
        `<meta property="og:description" content="${DESCRIPTION}">`,
        `<meta property="og:image" content="${WALLET}/api/thank-you-greeting-picture/${CODE}">`,
        '<meta property="og:image:type" content="image/jpeg">',
        '<meta property="og:image:width" content="1080">',
        '<meta property="og:image:height" content="750">',
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:title" content="${TITLE}">`,
        `<meta name="twitter:description" content="${DESCRIPTION}">`,
        `<meta name="twitter:image" content="${WALLET}/api/thank-you-greeting-picture/${CODE}">`,
        '</head>',
        '<body>',
        `<p><a href="${WALLET}/redeem/${CODE}">${TITLE}</a></p>`,
        '</body>',
        '</html>',
        '',
      ])
      expect(mockFindLink).toHaveBeenCalledWith(CODE)
      expect(mockRedeemPreviewOf).toHaveBeenCalledWith(FOUND, expect.any(Date))
    })

    it('answers with these headers: its own three, and what cors and helmet give every answer', async () => {
      const answer = await ask(addressOf(CODE))

      expect(withoutDate(answer).headers).toEqual({
        ...(await middlewareHeaders()),
        'cache-control': 'no-store',
        'content-type': 'text/html; charset=utf-8',
        'content-length': String(Buffer.byteLength(answer.body)),
      })
      // helmet's are among them: the comparison above is not with nothing.
      expect(answer.headers['x-content-type-options']).toBe('nosniff')
      expect(answer.headers['content-security-policy']).toContain("default-src 'self'")
      // No validator: an ETag would be something to ask again with.
      expect(answer.headers.etag).toBeUndefined()
    })

    it('names the motif’s file and its measure for a greeting with a motif', async () => {
      mockRedeemPreviewOf.mockReturnValue({
        ...PREVIEW,
        picture: { kind: 'motif', motif: 'bouquet' },
      })

      expect(previewLines((await ask(addressOf(CODE))).body)).toEqual(
        expect.arrayContaining([
          ['og:image', `${WALLET}/img/thank-you-greeting/bouquet.jpg`],
          ['og:image:width', '1080'],
          ['og:image:height', '750'],
          ['twitter:image', `${WALLET}/img/thank-you-greeting/bouquet.jpg`],
        ]),
      )
    })

    it('names the general picture, and a title of its own, for a plain link', async () => {
      mockRedeemPreviewOf.mockReturnValue({
        ...PREVIEW,
        kind: 'link',
        picture: { kind: 'general' },
      })

      const { body } = await ask(addressOf(CODE))

      expect(body).toContain('<title>Oma-Emma hat Dir einen Dank geschickt</title>')
      expect(previewLines(body)).toEqual(
        expect.arrayContaining([
          ['og:title', 'Oma-Emma hat Dir einen Dank geschickt'],
          ['og:image', `${WALLET}/img/gradido-preview-1200-630.jpg`],
          ['og:image:width', '1200'],
          ['og:image:height', '630'],
        ]),
      )
    })

    /**
     * What a messenger needs: WhatsApp draws no preview without `og:title`, `og:description`
     * and `og:url`, each with something in it -- and no line stands twice, as some do in the
     * wallet's own page.
     */
    it('carries every preview line once, and none of them empty', async () => {
      for (const picture of [
        PREVIEW.picture,
        { kind: 'motif', motif: 'bouquet' },
        { kind: 'general' },
      ]) {
        mockRedeemPreviewOf.mockReturnValue({ ...PREVIEW, picture })

        const { body } = await ask(addressOf(CODE))
        const lines = previewLines(body)
        const names = lines.map(([name]) => name)

        expect(names).toEqual([
          'og:type',
          'og:site_name',
          'og:locale',
          'og:url',
          'og:title',
          'og:description',
          'og:image',
          'og:image:type',
          'og:image:width',
          'og:image:height',
          'twitter:card',
          'twitter:title',
          'twitter:description',
          'twitter:image',
        ])
        for (const [, content] of lines) {
          expect(content.trim()).not.toBe('')
        }
        expect(body.match(/<title>/g)).toHaveLength(1)
        expect(body.match(/rel="canonical"/g)).toHaveLength(1)
        // The reader sees all of it: nothing of the kind stands outside what it read.
        expect(body.match(/(?:og|twitter):/g)).toHaveLength(names.length)
      }
    })

    it('answers HEAD with the headers of the document and no body', async () => {
      const got = await ask(addressOf(CODE))
      const head = await ask(addressOf(CODE), { method: 'HEAD' })

      expect(head.status).toBe(200)
      expect(head.body).toBe('')
      expect(withoutDate(head).headers).toEqual(withoutDate(got).headers)
    })

    // One address for one link, whoever pasted it how.
    it('names the code of the preview, not the one the request wrote', async () => {
      const asked = CODE.toUpperCase()

      const { status, body } = await ask(addressOf(asked))

      expect(status).toBe(200)
      expect(mockFindLink).toHaveBeenCalledWith(asked)
      // canonical, og:url, og:image, twitter:image and the line in the body
      expect(body.split(CODE)).toHaveLength(6)
      expect(body).not.toContain(asked)
    })

    it('writes the document in the language of the preview', async () => {
      mockRedeemPreviewOf.mockReturnValue({ ...PREVIEW, language: 'fr' })

      const { body } = await ask(addressOf(CODE))

      expect(body).toContain('<html lang="fr">')
      expect(previewLines(body)).toContainEqual(['og:locale', 'fr_FR'])
      expect(mockTranslate).toHaveBeenCalledWith('fr', 'redeemPreview.greetingTitle', {
        name: 'Oma-Emma',
      })
      expect(mockTranslate).toHaveBeenCalledWith('fr', 'redeemPreview.description')
    })
  })

  describe('what goes into the document is escaped', () => {
    // No username the wallet lets a member choose looks like this; the column could hold it.
    const NAME = `<Tom & "Jerry's">`
    const ESCAPED_NAME = '&lt;Tom &amp; &quot;Jerry&#39;s&quot;&gt;'

    it('escapes a username, in the title, in every preview line and in the body', async () => {
      mockRedeemPreviewOf.mockReturnValue({ ...PREVIEW, name: NAME })

      const { body } = await ask(addressOf(CODE))
      const title = `${ESCAPED_NAME} hat Dir einen Dank-Gruß geschickt`

      expect(body).toContain(`<title>${title}</title>`)
      expect(body).toContain(`<meta property="og:title" content="${title}">`)
      expect(body).toContain(`<meta name="twitter:title" content="${title}">`)
      expect(body).toContain(`<p><a href="${WALLET}/redeem/${CODE}">${title}</a></p>`)
      for (const raw of ['<Tom', 'Tom & ', '"Jerry', "Jerry's", 's">']) {
        expect(body).not.toContain(raw)
      }
    })

    it('escapes whatever a phrase carries, as a text and inside an attribute', async () => {
      mockTranslate
        .mockImplementationOnce(() => `A "title" <of> Tom & Jerry's`)
        .mockImplementationOnce(() => `<script>alert('x')</script> & "more"`)

      const { body } = await ask(addressOf(CODE))
      const title = 'A &quot;title&quot; &lt;of&gt; Tom &amp; Jerry&#39;s'
      const description = '&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; &quot;more&quot;'

      expect(body).toContain(`<title>${title}</title>`)
      expect(body).toContain(`<meta property="og:title" content="${title}">`)
      expect(body).toContain(`<meta property="og:description" content="${description}">`)
      expect(body).toContain(`<meta name="twitter:description" content="${description}">`)
      expect(body).not.toContain('<script>')
      expect(body).not.toContain('"title"')
    })

    it('escapes the addresses, should the configured one ever carry such a character', async () => {
      CONFIG.COMMUNITY_URL = `${WALLET}/a&b"c`
      CONFIG.COMMUNITY_REDEEM_URL = `${WALLET}/a&b"c/redeem/`
      try {
        const { body } = await ask(addressOf(CODE))

        expect(body).toContain(
          `<meta property="og:url" content="${WALLET}/a&amp;b&quot;c/redeem/${CODE}">`,
        )
        expect(body).toContain(
          `<meta property="og:image" content="${WALLET}/a&amp;b&quot;c/api/thank-you-greeting-picture/${CODE}">`,
        )
        expect(body).not.toContain('a&b"c')
      } finally {
        CONFIG.COMMUNITY_URL = WALLET
        CONFIG.COMMUNITY_REDEEM_URL = `${WALLET}/redeem/`
      }
    })
  })

  describe('nothing of the request goes into an answer', () => {
    const dressedUp = {
      Host: 'evil.example',
      'X-Forwarded-Host': 'evil.example',
      'X-Forwarded-Proto': 'http',
      Forwarded: 'host=evil.example;proto=http',
      Origin: 'https://evil.example',
      Referer: 'https://evil.example/x',
      'User-Agent': 'TelegramBot (like TwitterBot) evil.example',
      'Accept-Language': 'tr',
      Range: 'bytes=0-3',
      'If-None-Match': '*',
    }

    it('answers a request with a foreign host and a query of its own as it answers without', async () => {
      const plain = await ask(addressOf(CODE))
      const answer = await ask(`${addressOf(CODE)}?lang=tr&to=https://evil.example`, {
        headers: dressedUp,
      })

      expect(withoutDate(answer)).toEqual(withoutDate(plain))
      expect(JSON.stringify(answer)).not.toContain('evil.example')
      expect(answer.body).toContain(`<meta property="og:url" content="${WALLET}/redeem/${CODE}">`)
    })

    it('sends on to the configured address, whatever host the request names', async () => {
      mockRedeemPreviewOf.mockReturnValue(null)

      const answer = await ask(`${addressOf(CODE)}?to=https://evil.example`, { headers: dressedUp })

      await expectSentOn(answer)
      expect(JSON.stringify(answer)).not.toContain('evil.example')
    })
  })

  describe('for every link without a preview of its own', () => {
    // A failed query carries the code of the link in its message, as Drizzle's does.
    const databaseFailure = () => new Error(`select … where code = '${CODE}'`)

    // ⛔ One answer, whatever the reason -- nothing on the wire tells them apart.
    it('sends on to the wallet’s address, byte for byte the same', async () => {
      const sentOn: Answer[] = []

      // A text that is no code.
      sentOn.push(await ask(addressOf('no-code')))
      // A link without a preview of its own: none found, accepted, run out, deleted, …
      mockRedeemPreviewOf.mockReturnValue(null)
      sentOn.push(await ask(addressOf(CODE)))
      // The database does not answer.
      mockFindLink.mockRejectedValue(databaseFailure())
      sentOn.push(await ask(addressOf(CODE)))

      expect(sentOn).toHaveLength(3)
      for (const answer of sentOn) {
        await expectSentOn(answer)
      }
    })

    it('asks the database nothing about a text that is no code', async () => {
      for (const noCode of [
        'x',
        CODE.slice(1),
        `${CODE}1`,
        `${CODE.slice(1)}g`,
        `CL-${CODE.slice(3)}`,
        `${CODE.slice(1)}'`,
      ]) {
        await expectSentOn(await ask(addressOf(noCode)))
      }
      expect(mockFindLink).not.toHaveBeenCalled()
    })

    it('writes the driver code of a failed query to the log, and nothing else of it', async () => {
      const failure = databaseFailure()
      mockFindLink.mockRejectedValue(failure)
      mockDriverCode.mockReturnValue('ECONNRESET')

      await ask(addressOf(CODE))

      expect(mockDriverCode).toHaveBeenCalledWith(failure)
      // Exactly one text and nothing beside it: an error handed to the logger as a second
      // part would be written out with its message, its parameters and its stack.
      expect(mockLogger.error.mock.calls).toEqual([['redeem preview not answered (ECONNRESET)']])
    })

    // A mistake in this code is no failed query; it is answered the same and named by its kind.
    it('writes of any other failure what kind of error it is, and answers the same', async () => {
      mockRedeemPreviewOf.mockImplementation(() => {
        throw new TypeError(`no preview of ${CODE} for Oma-Emma`)
      })

      await expectSentOn(await ask(addressOf(CODE)))

      expect(mockLogger.error.mock.calls).toEqual([['redeem preview not answered (TypeError)']])
    })

    it('answers HEAD with the same', async () => {
      mockRedeemPreviewOf.mockReturnValue(null)

      await expectSentOn(await ask(addressOf(CODE), { method: 'HEAD' }))
    })

    /**
     * One part after the address is the text held against the form of a code: with a file's
     * ending or an escape it is no code, and does not reach the database.
     */
    it('takes a code and nothing after it: the same answer for a text with more in it', async () => {
      for (const path of [
        `${addressOf(CODE)}.html`,
        `${addressOf(CODE)}.jpg`,
        `${addressOf(CODE)}%2Fx`,
        `${addressOf(CODE)}%0A`,
        '/api/redeem-preview/%E0%A4',
        '/api/redeem-preview/%',
        `/api/redeem-preview/..%2F${CODE}`,
      ]) {
        const answer = await ask(path)
        // with the path beside it, so that a failure names the one it was
        expect({ path, status: answer.status, body: answer.body }).toEqual({
          path,
          status: 302,
          body: '',
        })
        await expectSentOn(answer)
      }
      expect(mockFindLink).not.toHaveBeenCalled()
    })
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
      ['GET', `/api/redeem-preview/x/${CODE}`],
      ['GET', '/api/redeem-preview/'],
      ['GET', '/api/redeem-preview'],
      ['GET', `/api/redeem-preview-x/${CODE}`],
    ]) {
      const answer = await ask(path, { method })
      expect({ method, path, status: answer.status }).toEqual({ method, path, status: 404 })
    }
    expect(mockFindLink).not.toHaveBeenCalled()
  })

  // ⛔ Neither the code of a link nor a name: a served preview writes nothing at all.
  it('writes nothing to the log for a preview it serves', async () => {
    await ask(addressOf(CODE))

    const written = Object.values(mockLogger).flatMap((level) => level.mock.calls)
    expect(written).toEqual([])
  })
})
