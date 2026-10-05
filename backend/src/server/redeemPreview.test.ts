// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { getLogger } from 'config-schema/test/testSetup'
import { hasPhraseInLocale, translateForLocale } from 'core'
import {
  dbFindTransactionLinkForPreview,
  ThankYouGreetingPictureInfo,
  TransactionLinkForPreview,
} from 'database'
import { DrizzleQueryError } from 'drizzle-orm'
import express from 'express'
import helmet from 'helmet'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { OG_LOCALE, PREVIEW_LANGUAGES } from '@/data/RedeemPreview.logic'
import { cors } from './cors'
import { apiRedeemPreview, REDEEM_PREVIEW_PATH } from './redeemPreview'

// What the database answers is mocked here: the subject is what the address makes of it on
// the wire -- status, headers, the document line for line. The rule that reads a link has its
// own tests (data/RedeemPreview.logic.test.ts), and redeemPreview.database.test.ts runs the
// address against a database, through the server createServer builds.
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return { __esModule: true, ...original, dbFindTransactionLinkForPreview: jest.fn() }
})
// The real phrases, wrapped so that one test can hand out a phrase no catalog has.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return { __esModule: true, ...original, translateForLocale: jest.fn(original.translateForLocale) }
})

const findLink = dbFindTransactionLinkForPreview as jest.MockedFunction<
  typeof dbFindTransactionLinkForPreview
>
const translate = translateForLocale as jest.MockedFunction<typeof translateForLocale>

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.redeemPreview`)

const WALLET = 'https://wallet.example'
const CODE = 'a1f9c2d41b7e19981fa0d001'
// An identifier with letters in it, as a member's is: what must never stand in a document.
const GRADIDO_ID = '3f2a9c1e-7b4d-4a5f-8e6c-0d1b2a3c4e5f'
const IDENTIFIER_FORM = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
// Far from the moment the test runs, on either side.
const LATER = new Date('2999-12-31T00:00:00.000Z')
const LONG_AGO = new Date('2020-01-01T00:00:00.000Z')

const SMALL: ThankYouGreetingPictureInfo = { id: 11, rendition: 'small', width: 831, height: 577 }
const LARGE: ThankYouGreetingPictureInfo = { id: 12, rendition: 'large', width: 1080, height: 750 }
const WITH_PHOTO = { greeting: { motif: null }, pictures: [SMALL, LARGE] }
const WITH_MOTIF = { greeting: { motif: 'bouquet' } }

const found = ({
  link = {},
  maker = {},
  greeting = null,
  pictures = [],
}: {
  link?: Partial<TransactionLinkForPreview['link']>
  maker?: Partial<TransactionLinkForPreview['maker']>
  greeting?: TransactionLinkForPreview['greeting']
  pictures?: ThankYouGreetingPictureInfo[]
} = {}): TransactionLinkForPreview => ({
  link: {
    code: CODE,
    userId: 4711,
    validUntil: LATER,
    redeemedAt: null,
    redeemedBy: null,
    deletedAt: null,
    ...link,
  },
  maker: { alias: 'Oma-Emma', gradidoId: GRADIDO_ID, language: 'de', deletedAt: null, ...maker },
  greeting,
  pictures,
})

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
  CONFIG.COMMUNITY_URL = WALLET
  CONFIG.COMMUNITY_REDEEM_URL = `${WALLET}/redeem/`
  const app = express()
  app.use(cors)
  app.use(helmet())
  // An answer of the same server that sets no header of its own: what cors and helmet give
  // every answer.
  app.get('/plain', (_req, res) => {
    res.writeHead(204)
    res.end()
  })
  app.use(REDEEM_PREVIEW_PATH, apiRedeemPreview)
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
  Object.assign(CONFIG, configured)
})

beforeEach(() => {
  jest.clearAllMocks()
  findLink.mockResolvedValue(found(WITH_PHOTO))
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
  describe('for an open link', () => {
    it('answers with a document of exactly these lines for a greeting with a photo', async () => {
      const answer = await ask(addressOf(CODE))

      expect(answer.status).toBe(200)
      expect(answer.body.split('\n')).toEqual([
        '<!doctype html>',
        '<html lang="de">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<title>Oma-Emma hat Dir einen Dank-Gruß geschickt</title>',
        '<meta name="robots" content="noindex">',
        `<link rel="canonical" href="${WALLET}/redeem/${CODE}">`,
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Gradido">',
        '<meta property="og:locale" content="de_DE">',
        `<meta property="og:url" content="${WALLET}/redeem/${CODE}">`,
        '<meta property="og:title" content="Oma-Emma hat Dir einen Dank-Gruß geschickt">',
        '<meta property="og:description" content="Helfen. Schenken. Danken.">',
        `<meta property="og:image" content="${WALLET}/api/thank-you-greeting-picture/${CODE}">`,
        '<meta property="og:image:type" content="image/jpeg">',
        '<meta property="og:image:width" content="1080">',
        '<meta property="og:image:height" content="750">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="Oma-Emma hat Dir einen Dank-Gruß geschickt">',
        '<meta name="twitter:description" content="Helfen. Schenken. Danken.">',
        `<meta name="twitter:image" content="${WALLET}/api/thank-you-greeting-picture/${CODE}">`,
        '</head>',
        '<body>',
        `<p><a href="${WALLET}/redeem/${CODE}">Oma-Emma hat Dir einen Dank-Gruß geschickt</a></p>`,
        '</body>',
        '</html>',
        '',
      ])
      expect(findLink).toHaveBeenCalledTimes(1)
      expect(findLink).toHaveBeenCalledWith(CODE)
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
      findLink.mockResolvedValue(found(WITH_MOTIF))

      const lines = previewLines((await ask(addressOf(CODE))).body)

      expect(lines).toEqual(
        expect.arrayContaining([
          ['og:title', 'Oma-Emma hat Dir einen Dank-Gruß geschickt'],
          ['og:image', `${WALLET}/img/thank-you-greeting/bouquet.jpg`],
          ['og:image:type', 'image/jpeg'],
          ['og:image:width', '1080'],
          ['og:image:height', '750'],
          ['twitter:image', `${WALLET}/img/thank-you-greeting/bouquet.jpg`],
        ]),
      )
    })

    it('names the general picture, and a title of its own, for a plain link', async () => {
      findLink.mockResolvedValue(found())

      const { body } = await ask(addressOf(CODE))

      expect(body).toContain('<title>Oma-Emma hat Dir einen Dank geschickt</title>')
      expect(previewLines(body)).toEqual(
        expect.arrayContaining([
          ['og:title', 'Oma-Emma hat Dir einen Dank geschickt'],
          ['twitter:title', 'Oma-Emma hat Dir einen Dank geschickt'],
          ['og:image', `${WALLET}/img/gradido-preview-1200-630.jpg`],
          ['og:image:width', '1200'],
          ['og:image:height', '630'],
          ['twitter:image', `${WALLET}/img/gradido-preview-1200-630.jpg`],
        ]),
      )
    })

    it('names the measure of the small rendition where no large one is filed', async () => {
      findLink.mockResolvedValue(found({ greeting: { motif: null }, pictures: [SMALL] }))

      expect(previewLines((await ask(addressOf(CODE))).body)).toEqual(
        expect.arrayContaining([
          ['og:image', `${WALLET}/api/thank-you-greeting-picture/${CODE}`],
          ['og:image:width', '831'],
          ['og:image:height', '577'],
        ]),
      )
    })

    // ⛔ Never the identifier, which is what publicAlias hands out for such a member.
    it.each([
      ['a greeting', WITH_PHOTO, 'Ein Dank-Gruß für Dich'],
      ['a plain link', {}, 'Ein Dank für Dich'],
    ])(
      'writes a title that names nobody for %s of a member without a username',
      async (_what, link, title) => {
        findLink.mockResolvedValue(found({ ...link, maker: { alias: null } }))

        const { status, body } = await ask(addressOf(CODE))

        expect(status).toBe(200)
        expect(body).toContain(`<title>${title}</title>`)
        expect(previewLines(body)).toEqual(
          expect.arrayContaining([
            ['og:title', title],
            ['twitter:title', title],
          ]),
        )
        expect(body).not.toMatch(IDENTIFIER_FORM)
      },
    )

    it('writes nothing of the form of an identifier into any document', async () => {
      for (const link of [WITH_PHOTO, WITH_MOTIF, {}]) {
        for (const alias of ['Oma-Emma', 'ab', null]) {
          findLink.mockResolvedValue(found({ ...link, maker: { alias } }))

          const { status, body } = await ask(addressOf(CODE))

          expect(status).toBe(200)
          expect(body).not.toMatch(IDENTIFIER_FORM)
        }
      }
      // The form is the one the member's identifier has.
      expect(GRADIDO_ID).toMatch(IDENTIFIER_FORM)
    })

    /**
     * What a messenger needs: WhatsApp draws no preview without `og:title`, `og:description`
     * and `og:url`, each with something in it -- and no line stands twice, as some do in the
     * wallet's own page.
     */
    it('carries every preview line once, and none of them empty', async () => {
      for (const link of [WITH_PHOTO, WITH_MOTIF, {}]) {
        findLink.mockResolvedValue(found(link))

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
        expect(new Set(names).size).toBe(names.length)
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

    /**
     * The column finds a link whatever the case of the letters asked for, and the document
     * names the code the row holds: one address for one link, whoever pasted it how.
     */
    it('names the code of the row, not the one the request wrote', async () => {
      const asked = CODE.toUpperCase()
      expect(asked).not.toBe(CODE)

      const { status, body } = await ask(addressOf(asked))

      expect(status).toBe(200)
      expect(findLink).toHaveBeenCalledWith(asked)
      // canonical, og:url, og:image, twitter:image and the line in the body
      expect(body.split(CODE)).toHaveLength(6)
      expect(body).not.toContain(asked)
    })

    it('writes the document in the language of the sender, each of the ten in words of its own', async () => {
      const titles = new Set<string>()
      for (const language of PREVIEW_LANGUAGES) {
        findLink.mockResolvedValue(found({ ...WITH_PHOTO, maker: { language } }))

        const { body } = await ask(addressOf(CODE))

        expect(body).toContain(`<html lang="${language}">`)
        expect(previewLines(body)).toContainEqual(['og:locale', OG_LOCALE[language]])
        titles.add(body.split('\n').find((line) => line.startsWith('<title>')) ?? '')
        // No phrase is the English one under another language's name.
        for (const key of [
          'redeemPreview.description',
          'redeemPreview.greetingTitle',
          'redeemPreview.greetingTitleWithoutName',
          'redeemPreview.linkTitle',
          'redeemPreview.linkTitleWithoutName',
        ]) {
          expect({ language, key, own: hasPhraseInLocale(language, key) }).toEqual({
            language,
            key,
            own: true,
          })
        }
      }
      expect(titles.size).toBe(PREVIEW_LANGUAGES.length)
      expect(titles).toContain('<title>Oma-Emma sent you a thank-you greeting</title>')
      expect(titles).toContain('<title>Oma-Emma шлёт вам открытку с благодарностью</title>')
    })

    it('writes the document in English for a sender whose language is none of the ten', async () => {
      findLink.mockResolvedValue(found({ ...WITH_PHOTO, maker: { language: 'pl' } }))

      const { body } = await ask(addressOf(CODE))

      expect(body).toContain('<html lang="en">')
      expect(body).toContain('<title>Oma-Emma sent you a thank-you greeting</title>')
      expect(previewLines(body)).toEqual(
        expect.arrayContaining([
          ['og:locale', 'en_US'],
          ['og:description', 'Help. Give. Thank.'],
        ]),
      )
    })
  })

  describe('what goes into the document is escaped', () => {
    // No username the wallet lets a member choose looks like this; the column could hold it.
    const NAME = `<Tom & "Jerry's">`
    const ESCAPED_NAME = '&lt;Tom &amp; &quot;Jerry&#39;s&quot;&gt;'

    it('escapes a username, in the title, in every preview line and in the body', async () => {
      findLink.mockResolvedValue(found({ ...WITH_PHOTO, maker: { alias: NAME } }))

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

    // A phrase is inserted as it is by translateForLocale; the French one carries an apostrophe.
    it('escapes the apostrophe of a translated phrase', async () => {
      findLink.mockResolvedValue(found({ ...WITH_PHOTO, maker: { language: 'fr' } }))

      const { body } = await ask(addressOf(CODE))

      expect(body).toContain('<title>Oma-Emma t&#39;a envoyé un mot de remerciement</title>')
      expect(body).not.toContain("t'a")
    })

    it('escapes whatever a phrase carries, as a text and inside an attribute', async () => {
      translate
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
      findLink.mockResolvedValue(null)

      const answer = await ask(`${addressOf(CODE)}?to=https://evil.example`, { headers: dressedUp })

      await expectSentOn(answer)
      expect(JSON.stringify(answer)).not.toContain('evil.example')
    })
  })

  describe('for every link without a preview of its own', () => {
    // A failed query as Drizzle throws it: the statement and its parameters -- the code of the
    // link among them -- in the message and as properties of their own, the driver's error as
    // the cause.
    const databaseFailure = () =>
      new DrizzleQueryError(
        'select `code` from `transaction_links` where `transaction_links`.`code` = ?',
        [CODE],
        Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }),
      )

    // ⛔ One answer, whatever the reason -- nothing on the wire tells them apart.
    it('sends on to the wallet’s address, byte for byte the same', async () => {
      const sentOn: Answer[] = []

      // A text that is no code.
      sentOn.push(await ask(addressOf('no-code')))
      // A code no link has -- and a link whose maker has no row, and two links of one code:
      // the query's one answer for the three.
      findLink.mockResolvedValue(null)
      sentOn.push(await ask(addressOf(CODE)))
      // Accepted, run out, deleted.
      for (const link of [
        { redeemedAt: LONG_AGO, redeemedBy: 815 },
        { redeemedBy: 815 },
        { validUntil: LONG_AGO },
        { deletedAt: LONG_AGO },
      ]) {
        findLink.mockResolvedValue(found({ ...WITH_PHOTO, link }))
        sentOn.push(await ask(addressOf(CODE)))
      }
      // The account of the member who made the link is deleted.
      findLink.mockResolvedValue(found({ ...WITH_PHOTO, maker: { deletedAt: LONG_AGO } }))
      sentOn.push(await ask(addressOf(CODE)))
      // The database does not answer.
      findLink.mockRejectedValue(databaseFailure())
      sentOn.push(await ask(addressOf(CODE)))

      expect(sentOn).toHaveLength(8)
      for (const answer of sentOn) {
        await expectSentOn(answer)
      }
    })

    it('asks the database nothing about a text that is no code', async () => {
      for (const noCode of [
        '',
        'x',
        CODE.slice(1),
        `${CODE}1`,
        `${CODE.slice(1)}g`,
        `CL-${CODE.slice(3)}`,
        `${CODE.slice(1)}'`,
      ]) {
        await expectSentOn(await ask(addressOf(noCode)))
      }
      expect(findLink).not.toHaveBeenCalled()
    })

    it('writes the driver code of a failed query to the log, and nothing else of it', async () => {
      findLink.mockRejectedValue(databaseFailure())

      await ask(addressOf(CODE))

      // Exactly one text and nothing beside it: an error handed to the logger as a second
      // part would be written out with its message, its parameters and its stack.
      expect(logger.error.mock.calls).toEqual([['redeem preview not answered (ECONNRESET)']])
      // What such a failure carries and the log must not: the check is not of an empty error.
      expect(databaseFailure().message).toContain(CODE)
      expect(databaseFailure().params).toEqual([CODE])
    })

    // A mistake in this code is no failed query; it is answered the same and named by its kind.
    it('writes of any other failure what kind of error it is, and answers the same', async () => {
      findLink.mockRejectedValue(new TypeError(`no preview of ${CODE} for Oma-Emma`))

      await expectSentOn(await ask(addressOf(CODE)))

      expect(logger.error.mock.calls).toEqual([['redeem preview not answered (TypeError)']])
    })

    it('answers HEAD with the same, and has no other method: the same again', async () => {
      for (const method of ['HEAD', 'POST', 'PUT', 'DELETE', 'PATCH']) {
        findLink.mockResolvedValue(method === 'HEAD' ? null : found(WITH_PHOTO))
        await expectSentOn(await ask(addressOf(CODE), { method }))
      }
      // Only the HEAD came as far as the database.
      expect(findLink).toHaveBeenCalledTimes(1)
    })

    /**
     * ⛔ Everything below the address is the address's own to answer: a file's ending, a
     * further part, nothing at all, an escape -- one that cannot be decoded, and one that
     * would decode to a code, as this server is handed it (a proxy in front may hand on what
     * it has decoded). None falls through to what stands under `/` behind it, and none
     * reaches the database.
     */
    it('takes a code and nothing after it: the same answer for every path below it', async () => {
      for (const path of [
        `${addressOf(CODE)}/x`,
        `${addressOf(CODE)}.html`,
        `${addressOf(CODE)}.jpg`,
        `${addressOf(CODE)}/`,
        `${addressOf(CODE)}%2Fx`,
        `${addressOf(CODE)}%0A`,
        '/api/redeem-preview/',
        '/api/redeem-preview',
        '/api/redeem-preview/%E0%A4',
        '/api/redeem-preview/%',
        // `%61` is an "a": the code, were it decoded.
        `/api/redeem-preview/%61${CODE.slice(1)}`,
        `/api/redeem-preview/..%2F${CODE}`,
        `/api/redeem-preview/x/${CODE}`,
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
      expect(findLink).not.toHaveBeenCalled()
    })
  })

  // The address is this path and no other that begins like it.
  it('leaves a path that only begins like the address to what stands behind it', async () => {
    const answer = await ask(`/api/redeem-preview-x/${CODE}`)

    expect(answer.status).toBe(400)
    expect(findLink).not.toHaveBeenCalled()
  })

  // ⛔ Neither the code of a link nor a name: a served preview writes nothing at all.
  it('writes nothing to the log for a preview it serves', async () => {
    await ask(addressOf(CODE))

    const written = (['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const).flatMap(
      (level) => logger[level].mock.calls,
    )
    expect(written).toEqual([])
  })
})
