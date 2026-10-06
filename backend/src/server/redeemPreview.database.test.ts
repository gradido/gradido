// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  TransactionLink as DbTransactionLink,
  thankYouGreetingPicturesTable,
  User,
  usersTable,
} from 'database'
import { and, eq } from 'drizzle-orm'
import { gql } from 'graphql-tag'
import { CONFIG } from '@/config'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  createTransactionLink,
  deleteTransactionLink,
  login,
  redeemTransactionLink,
} from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * The preview of a redeem link all the way against a database, on the server createServer
 * builds -- behind its cors, its helmet and its limiter, and before Apollo: the links are made,
 * accepted and deleted by the mutations the wallet uses, and the address is asked over HTTP by
 * nobody who is signed in.
 *
 * Bibi (username "BBB", language de) writes the thank-yous, Peter accepts.
 */
// The two mails of a redeemed link are not this file's matter; nothing is sent.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendTransactionLinkRedeemedEmail: jest.fn(async () => null),
    sendTransactionReceivedEmail: jest.fn(async () => null),
  }
})
jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']
let db: AppDatabase
let server: Server
let port: number
let bibi: User

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma'
const MEMO = `${LINE}\n${WORDS}`
// An amount no measure of a picture and no other number of a document looks like.
const AMOUNT = '17.25'

// Two pictures that decode -- 4 x 2 and 6 x 4 grey pixels --: the server decodes what it is sent
// and files it encoded again, with the size it found.
const SMALL =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/wAALCAACAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z'
const LARGE =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/wAALCAAEAAYBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AQP/Z'
// What the sender says the sizes are, and what they are.
const SMALL_PICTURE = { data: SMALL, width: 831, height: 577 }
const LARGE_PICTURE = { data: LARGE, width: 1080, height: 750 }
const LARGE_SIZE = { width: 6, height: 4 }

const addPicture = gql`
  mutation ($linkId: Int!, $picture: ChatImageInput!) {
    addThankYouGreetingPicture(linkId: $linkId, picture: $picture)
  }
`

type Link = { id: number; code: string }
type Answer = { status: number; headers: IncomingHttpHeaders; body: Buffer }

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

const created = async (greeting?: Record<string, unknown>): Promise<Link> => {
  await loginAs('bibi@bloxberg.de')
  const result = await mutate({
    mutation: createTransactionLink,
    variables: { amount: AMOUNT, memo: greeting ? MEMO : 'Danke für die Suppe!', greeting },
  })
  expect(result.errors).toBeUndefined()
  return result.data.createTransactionLink
}

/** A greeting of Bibi's with a photo of her own, both renditions filed. */
const withPhoto = async (): Promise<Link> => {
  const link = await created({ picture: SMALL_PICTURE, line: LINE, recipientName: 'Sarah' })
  const added = await mutate({
    mutation: addPicture,
    variables: { linkId: link.id, picture: LARGE_PICTURE },
  })
  expect(added.errors).toBeUndefined()
  expect(added.data.addThankYouGreetingPicture).toBe(true)
  return link
}

const withMotif = () => created({ motif: 'bouquet', line: LINE, recipientName: 'Sarah' })

/** A path of this server, asked over HTTP as a messenger asks it -- nobody signed in. */
const atThePath = (
  path: string,
  method = 'GET',
  { headers = {}, body }: { headers?: Record<string, string>; body?: string } = {},
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
    req.end(body)
  })

const previewOf = (code: string): Promise<Answer> => atThePath(`/api/redeem-preview/${code}`)
const pictureOf = (code: string): Promise<Answer> =>
  atThePath(`/api/thank-you-greeting-picture/${code}`)

/** A rendition of a link's picture as the server filed it. */
const filed = async (code: string, rendition: 'small' | 'large'): Promise<Buffer> => {
  const rows = await AppDatabase.getInstance()
    .getDrizzleDataSource()
    .select({ image: thankYouGreetingPicturesTable.image })
    .from(thankYouGreetingPicturesTable)
    .where(
      and(
        eq(thankYouGreetingPicturesTable.transactionLinkCode, code),
        eq(thankYouGreetingPicturesTable.rendition, rendition),
      ),
    )
  expect(rows).toHaveLength(1)
  return rows[0].image
}

/** What a preview line of the document says, or undefined where it has no such line. */
const lineOf = (document: string, name: string): string | undefined =>
  document.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)">`))?.[1]

/** An answer without what differs from one request to the next by itself. */
const withoutDate = ({ status, headers, body }: Answer) => {
  const { date: _date, ...rest } = headers
  return { status, headers: rest, body: body.toString() }
}

const expectSentOn = (answer: Answer) => {
  expect(answer.status).toBe(302)
  expect(answer.headers.location).toBe(`${CONFIG.COMMUNITY_URL}/`)
  expect(answer.headers['cache-control']).toBe('no-store')
  expect(answer.body).toHaveLength(0)
}

const expectNoPicture = (answer: Answer) => {
  expect(answer.status).toBe(404)
  expect(answer.body).toHaveLength(0)
}

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  db = testEnv.db
  server = testEnv.app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  port = (server.address() as AddressInfo).port
  await cleanDB()
  // The admin has to exist for creationFactory.
  await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  await creationFactory(testEnv, creations.find((c) => c.email === 'bibi@bloxberg.de')!)
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await cleanDB()
  await db.destroy()
})

beforeEach(() => {
  resetToken()
})

describe('GET /api/redeem-preview/<code>, against a database', () => {
  describe('an open greeting with a photo', () => {
    let link: Link
    let document: string

    beforeAll(async () => {
      link = await withPhoto()
      resetToken()
      const answer = await previewOf(link.code)
      expect(answer.status).toBe(200)
      expect(answer.headers['content-type']).toBe('text/html; charset=utf-8')
      expect(answer.headers['cache-control']).toBe('no-store')
      document = answer.body.toString()
    })

    it('names the sender by her username, in her language, and the page of the link', () => {
      expect(document).toContain('<html lang="de">')
      expect(document).toContain('<title>BBB hat Dir einen Dank-Gruß geschickt</title>')
      expect(lineOf(document, 'og:title')).toBe('BBB hat Dir einen Dank-Gruß geschickt')
      expect(lineOf(document, 'og:description')).toBe('Helfen. Schenken. Danken.')
      expect(lineOf(document, 'og:url')).toBe(`${CONFIG.COMMUNITY_REDEEM_URL}${link.code}`)
    })

    // ⛔ The preview names a photo the address of the picture serves at the same moment.
    it('names the picture of the greeting, and that address serves the photo', async () => {
      const image = lineOf(document, 'og:image')

      expect(image).toBe(`${CONFIG.COMMUNITY_URL}/api/thank-you-greeting-picture/${link.code}`)
      expect(lineOf(document, 'twitter:image')).toBe(image)
      // The measure of the large rendition as it is filed: the size the picture has, not the
      // one its sender gave.
      expect(lineOf(document, 'og:image:width')).toBe(String(LARGE_SIZE.width))
      expect(lineOf(document, 'og:image:height')).toBe(String(LARGE_SIZE.height))

      const picture = await atThePath(String(image).slice(CONFIG.COMMUNITY_URL.length))
      const large = await filed(link.code, 'large')
      expect(picture.status).toBe(200)
      expect(picture.headers['content-type']).toBe('image/jpeg')
      expect(picture.body.equals(large)).toBe(true)
      // Two pictures, so that serving the large one is not serving either.
      expect(large.equals(await filed(link.code, 'small'))).toBe(false)
    })

    /**
     * ⛔ Nothing the page of the link shows beyond the picture and from whom it comes -- the
     * amount, the first line, the words, whom it is for --, and nothing the page does not show:
     * a real name, the identifier, the mail address.
     */
    it('names nothing else of the link, and nothing else of the sender', () => {
      for (const kept of [
        AMOUNT,
        AMOUNT.replace('.', ','),
        LINE,
        'weil es Dich gibt',
        'Liebe Sarah',
        'iPad',
        'Sarah',
        'Bibi',
        'Bloxberg',
        'bibi@bloxberg.de',
        bibi.gradidoID,
      ]) {
        expect({ kept, written: document.includes(kept) }).toEqual({ kept, written: false })
      }
      expect(document).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
      // The code stands in four addresses and in the link of the body, and nowhere besides.
      expect(document.split(link.code)).toHaveLength(6)
    })

    it('answers the code written in capitals with the same document', async () => {
      const asked = link.code.toUpperCase()
      // A code as the server makes it has letters in it; without them this would compare nothing.
      expect(asked).not.toBe(link.code)

      const answer = await previewOf(asked)

      expect(answer.status).toBe(200)
      expect(answer.body.toString()).toBe(document)
    })

    it('answers every path below the address itself, before Apollo', async () => {
      for (const path of [
        `/api/redeem-preview/${link.code}.html`,
        `/api/redeem-preview/${link.code}/x`,
        '/api/redeem-preview/',
      ]) {
        expectSentOn(await atThePath(path))
      }
      expectSentOn(await atThePath(`/api/redeem-preview/${link.code}`, 'POST'))
    })
  })

  it('names the motif’s file for a greeting with a motif, which has no picture at the address', async () => {
    const link = await withMotif()
    resetToken()

    const answer = await previewOf(link.code)
    const document = answer.body.toString()

    expect(answer.status).toBe(200)
    expect(lineOf(document, 'og:title')).toBe('BBB hat Dir einen Dank-Gruß geschickt')
    expect(lineOf(document, 'og:image')).toBe(
      `${CONFIG.COMMUNITY_URL}/img/thank-you-greeting/bouquet.jpg`,
    )
    expect(lineOf(document, 'og:image:width')).toBe('1080')
    expect(lineOf(document, 'og:image:height')).toBe('750')
    expectNoPicture(await pictureOf(link.code))
  })

  it('names the general picture and a title of its own for a plain link', async () => {
    const link = await created()
    resetToken()

    const answer = await previewOf(link.code)
    const document = answer.body.toString()

    expect(answer.status).toBe(200)
    expect(document).toContain('<title>BBB hat Dir einen Dank geschickt</title>')
    expect(lineOf(document, 'og:title')).toBe('BBB hat Dir einen Dank geschickt')
    expect(lineOf(document, 'og:image')).toBe(
      `${CONFIG.COMMUNITY_URL}/img/gradido-preview-1200-630.jpg`,
    )
    expect(lineOf(document, 'og:image:width')).toBe('1200')
    expect(lineOf(document, 'og:image:height')).toBe('630')
  })

  /**
   * Two kinds of request never reach the address: createServer mounts cors and the body
   * parsers in front of every address of the server, and they answer an OPTIONS and a body
   * they refuse themselves. What they answer says nothing about a link: it is the same for an
   * open link, for a code no link has and for a text that is no code -- and never the document.
   */
  it('is answered alike for every code where a request does not get as far as the address', async () => {
    const link = await withMotif()
    resetToken()
    expect((await previewOf(link.code)).status).toBe(200)
    const addresses = [link.code, '00000000000000000000beef', 'no-code'].map(
      (code) => `/api/redeem-preview/${code}`,
    )

    for (const [method, request] of [
      ['OPTIONS', { headers: { 'Access-Control-Request-Headers': 'x-probe' } }],
      [
        'GET',
        { headers: { 'Content-Type': 'application/json', 'Content-Length': '1' }, body: '{' },
      ],
      [
        'POST',
        { headers: { 'Content-Type': 'application/json', 'Content-Length': '1' }, body: '{' },
      ],
    ] as const) {
      const answers = []
      for (const address of addresses) {
        answers.push(withoutDate(await atThePath(address, method, request)))
      }

      expect({ method, status: answers[0].status === 200 }).toEqual({ method, status: false })
      expect(answers[0].body).not.toContain('og:title')
      expect(answers[1]).toEqual(answers[0])
      expect(answers[2]).toEqual(answers[0])
    }
  })

  // ⛔ Never the identifier: a member without a username is not named at all.
  it('names nobody where the sender has no username', async () => {
    const link = await withPhoto()
    const drizzle = AppDatabase.getInstance().getDrizzleDataSource()
    await drizzle.update(usersTable).set({ alias: null }).where(eq(usersTable.id, bibi.id))
    try {
      const answer = await previewOf(link.code)
      const document = answer.body.toString()

      expect(answer.status).toBe(200)
      expect(document).toContain('<title>Ein Dank-Gruß für Dich</title>')
      expect(document).not.toContain(bibi.gradidoID)
      // Still a greeting with its photo: the motif of such a greeting is null in its row.
      expect(lineOf(document, 'og:image')).toBe(
        `${CONFIG.COMMUNITY_URL}/api/thank-you-greeting-picture/${link.code}`,
      )
    } finally {
      await drizzle.update(usersTable).set({ alias: 'BBB' }).where(eq(usersTable.id, bibi.id))
    }
  })

  describe('a link without a preview of its own is sent on to the wallet’s address', () => {
    const sentOn: Answer[] = []

    it('once the thank-you is accepted -- and its code shows no picture any more', async () => {
      const link = await withPhoto()
      expect((await previewOf(link.code)).status).toBe(200)

      await loginAs('peter@lustig.de')
      const redeemed = await mutate({
        mutation: redeemTransactionLink,
        variables: { code: link.code },
      })
      expect(redeemed.errors).toBeUndefined()
      expect(redeemed.data.redeemTransactionLink).toBe(true)
      resetToken()

      const answer = await previewOf(link.code)
      expectSentOn(answer)
      expectNoPicture(await pictureOf(link.code))
      sentOn.push(answer)
    })

    it('once the link is deleted', async () => {
      const link = await withPhoto()
      expect((await previewOf(link.code)).status).toBe(200)

      await loginAs('bibi@bloxberg.de')
      const deleted = await mutate({ mutation: deleteTransactionLink, variables: { id: link.id } })
      expect(deleted.errors).toBeUndefined()
      expect(deleted.data.deleteTransactionLink).toBe(true)
      resetToken()

      const answer = await previewOf(link.code)
      expectSentOn(answer)
      expectNoPicture(await pictureOf(link.code))
      sentOn.push(answer)
    })

    it('once the link ran out', async () => {
      const link = await withPhoto()
      expect((await previewOf(link.code)).status).toBe(200)

      await DbTransactionLink.update({ id: link.id }, { validUntil: new Date(Date.now() - 60_000) })

      const answer = await previewOf(link.code)
      expectSentOn(answer)
      expectNoPicture(await pictureOf(link.code))
      sentOn.push(answer)
    })

    // ⛔ Both addresses call such a code no link: neither shows what the other would not.
    it('where two links carry the code -- and its code shows no picture either', async () => {
      const link = await withPhoto()
      const other = await created()
      expect((await previewOf(link.code)).status).toBe(200)
      expect((await pictureOf(link.code)).status).toBe(200)
      expect((await previewOf(other.code)).status).toBe(200)

      await DbTransactionLink.update({ id: other.id }, { code: link.code })

      const answer = await previewOf(link.code)
      expectSentOn(answer)
      expectNoPicture(await pictureOf(link.code))
      sentOn.push(answer)
    })

    it('for a code no link has, and for a text that is no code', async () => {
      for (const code of ['00000000000000000000beef', 'no-code', '']) {
        const answer = await previewOf(code)
        expectSentOn(answer)
        sentOn.push(answer)
      }
    })

    // The last that changes anything: it takes Bibi's account away for a moment.
    it('while the account of the sender is deleted -- and again not, once it is back', async () => {
      const link = await withPhoto()
      expect((await previewOf(link.code)).status).toBe(200)

      await User.update({ id: bibi.id }, { deletedAt: new Date() })
      try {
        const answer = await previewOf(link.code)
        expectSentOn(answer)
        expectNoPicture(await pictureOf(link.code))
        sentOn.push(answer)
      } finally {
        await User.update({ id: bibi.id }, { deletedAt: null })
      }

      expect((await previewOf(link.code)).status).toBe(200)
    })

    // ⛔ One answer: nothing on the wire tells the cases above apart.
    it('with one and the same answer for all of them', () => {
      expect(sentOn).toHaveLength(8)
      for (const answer of sentOn) {
        expect(withoutDate(answer)).toEqual(withoutDate(sentOn[0]))
      }
    })
  })
})
