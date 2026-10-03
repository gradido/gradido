// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  DBInsertFailed,
  Event as DbEvent,
  TransactionLink as DbTransactionLink,
  dbInsertThankYouGreeting,
  dbInsertThankYouGreetingPicture,
  EventType,
  thankYouGreetingPicturesTable,
  thankYouGreetingsTable,
  User,
} from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { CHAT_IMAGE_MAX_BYTES, CHAT_IMAGE_MAX_SIDE } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import { deleteTransactionLink, login, redeemTransactionLink } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * A thank-you greeting that carries a photo of the member's own instead of a motif (ZE-019), all
 * the way against a database: the small rendition comes with the link, the large one after it;
 * who holds the code of the OPEN link gets the picture at an address, without being signed in;
 * once the thank-you is accepted the large one is gone and the two it is between get the small
 * one, signed in; a deleted link has no picture left.
 *
 * Bibi writes the greetings, Peter accepts, Bob is the third member who has nothing to do with
 * them. The address is asked over HTTP, on the server createServer builds -- behind its cors,
 * its helmet and its limiter.
 *
 * The two writes of the pictures' and the greetings' table are the real ones, wrapped so that a
 * test can make one of them fail once and read the order they ran in.
 */
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbInsertThankYouGreeting: jest.fn(original.dbInsertThankYouGreeting),
    dbInsertThankYouGreetingPicture: jest.fn(original.dbInsertThankYouGreetingPicture),
  }
})
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

const insertGreeting = dbInsertThankYouGreeting as jest.MockedFunction<
  typeof dbInsertThankYouGreeting
>
const insertPicture = dbInsertThankYouGreetingPicture as jest.MockedFunction<
  typeof dbInsertThankYouGreetingPicture
>

CONFIG.DLT_ACTIVE = false

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let server: Server
let port: number
let bibi: User

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma'
const MEMO = `${LINE}\n${WORDS}`

// Two JPEGs with something recognisable inside each: what is handed out is seen, and what a log
// or an answer must not show.
const jpegAround = (inside: string) =>
  Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from(inside), Buffer.from([0xff, 0xd9])])
const SMALL = jpegAround('the small rendition of a private photo of Oma Emma')
const LARGE = jpegAround('the large rendition of a private photo of Oma Emma, for the page')
const SMALL_PICTURE = { data: SMALL.toString('base64'), width: 831, height: 577 }
const LARGE_PICTURE = { data: LARGE.toString('base64'), width: 1080, height: 750 }
const WITH_PICTURE = { picture: SMALL_PICTURE, line: LINE, recipientName: 'Sarah' }
const sarah = { amount: '5', memo: MEMO, greeting: WITH_PICTURE }

const createLink = gql`
  mutation ($amount: GradidoUnit!, $memo: String!, $greeting: ThankYouGreetingInput) {
    createTransactionLink(amount: $amount, memo: $memo, greeting: $greeting) {
      id
      code
      greeting {
        motif
        line
        recipientName
        hasPicture
      }
    }
  }
`
const addPicture = gql`
  mutation ($linkId: Int!, $picture: ChatImageInput!) {
    addThankYouGreetingPicture(linkId: $linkId, picture: $picture)
  }
`
const pictureOfLink = gql`
  query ($linkId: Int!) {
    thankYouGreetingPicture(linkId: $linkId)
  }
`
const linkByCode = gql`
  query ($code: String!) {
    queryTransactionLink(code: $code) {
      ... on TransactionLink {
        id
        redeemedAt
        greeting {
          motif
          line
          recipientName
          hasPicture
        }
      }
    }
  }
`
const ownLinks = gql`
  query {
    listTransactionLinks(currentPage: 1, pageSize: 25) {
      links {
        id
        greeting {
          motif
          hasPicture
        }
      }
    }
  }
`
const bookings = gql`
  query {
    transactionList(currentPage: 1, pageSize: 25) {
      transactions {
        typeId
        memo
        linkId
        greeting {
          motif
          line
          hasPicture
        }
      }
    }
  }
`

type Link = {
  id: number
  code: string
  greeting: { motif: string | null; hasPicture: boolean } | null
}

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

const created = async (variables: Record<string, unknown> = sarah): Promise<Link> => {
  const result = await mutate({ mutation: createLink, variables })
  expect(result.errors).toBeUndefined()
  return result.data.createTransactionLink
}

/** A greeting of Bibi's with both renditions filed. */
const withBothRenditions = async (): Promise<Link> => {
  await loginAs('bibi@bloxberg.de')
  const link = await created()
  const added = await mutate({
    mutation: addPicture,
    variables: { linkId: link.id, picture: LARGE_PICTURE },
  })
  expect(added.errors).toBeUndefined()
  expect(added.data.addThankYouGreetingPicture).toBe(true)
  return link
}

const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()
/** Every row of the pictures' table, read past the wrapped queries. */
const pictureRows = () => drizzle().select().from(thankYouGreetingPicturesTable)
const greetingRows = () => drizzle().select().from(thankYouGreetingsTable)
/** The renditions filed for a link, sorted. */
const renditionsOf = async (code: string) =>
  (await pictureRows())
    .filter((row) => row.transactionLinkCode === code)
    .map((row) => row.rendition)
    .sort()

const linksOfBibi = () => DbTransactionLink.count({ where: { userId: bibi.id }, withDeleted: true })
const createEvents = () => DbEvent.count({ where: { type: EventType.TRANSACTION_LINK_CREATE } })

/** The small rendition as the query hands it to whoever is signed in now, or null. */
const pictureFor = async (email: string, linkId: number): Promise<string | null> => {
  await loginAs(email)
  const result = await query({ query: pictureOfLink, variables: { linkId } })
  expect(result.errors).toBeUndefined()
  return result.data.thankYouGreetingPicture
}

type Answer = { status: number; headers: IncomingHttpHeaders; body: Buffer }

/** A path of this server, asked over HTTP as a browser asks it -- nobody signed in. */
const atThePath = (path: string, method = 'GET'): Promise<Answer> =>
  new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, path, method }, (res) => {
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

/** The address of a link's picture. */
const atTheAddress = (code: string): Promise<Answer> =>
  atThePath(`/api/thank-you-greeting-picture/${code}`)

const expectEmpty = (answer: Answer) => {
  expect(answer.status).toBe(404)
  expect(answer.body).toHaveLength(0)
  expect(answer.headers['cache-control']).toBe('no-store')
  expect(answer.headers['content-type']).toBeUndefined()
}

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  server = testEnv.app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  port = (server.address() as AddressInfo).port
  await cleanDB()
  // The admin has to exist for creationFactory.
  await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  await userFactory(testEnv, bobBaumeister)
  await creationFactory(testEnv, creations.find((c) => c.email === 'bibi@bloxberg.de')!)
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await cleanDB()
  await db.destroy()
})

beforeEach(async () => {
  jest.clearAllMocks()
  await loginAs('bibi@bloxberg.de')
})

describe('createTransactionLink with a greeting that carries a picture', () => {
  it('answers that the greeting has a picture, and files the small rendition under the code of the link', async () => {
    const link = await created()

    expect(link.greeting).toEqual({
      motif: null,
      line: LINE,
      recipientName: 'Sarah',
      hasPicture: true,
    })
    const greetings = (await greetingRows()).filter((row) => row.transactionLinkCode === link.code)
    expect(greetings).toHaveLength(1)
    expect(greetings[0]).toMatchObject({ motif: null, line: LINE, recipientName: 'Sarah' })
    const pictures = (await pictureRows()).filter((row) => row.transactionLinkCode === link.code)
    expect(pictures).toHaveLength(1)
    expect(pictures[0]).toMatchObject({
      rendition: 'small',
      width: 831,
      height: 577,
      mimeType: 'image/jpeg',
    })
    // The bytes as they came, not decoded and not changed.
    expect(pictures[0].image.equals(SMALL)).toBe(true)
  })

  it('files the greeting and its picture before the link is saved', async () => {
    const save = jest.spyOn(DbTransactionLink, 'save')

    await created()

    const greetingAt = insertGreeting.mock.invocationCallOrder[0]
    const pictureAt = insertPicture.mock.invocationCallOrder[0]
    const linkAt = save.mock.invocationCallOrder[0]
    save.mockRestore()
    expect(greetingAt).toBeLessThan(pictureAt)
    expect(pictureAt).toBeLessThan(linkAt)
    // Under the code the link was then saved with.
    expect(insertPicture.mock.calls[0][0].transactionLinkCode).toBe(
      insertGreeting.mock.calls[0][0].transactionLinkCode,
    )
  })

  // A greeting with a motif is, row for row, the one it was before there were pictures.
  it('leaves a greeting with a motif as it was: its motif, and no picture', async () => {
    const link = await created({
      amount: '5',
      memo: MEMO,
      greeting: { motif: 'bouquet', line: LINE, recipientName: 'Sarah' },
    })

    expect(link.greeting).toEqual({
      motif: 'bouquet',
      line: LINE,
      recipientName: 'Sarah',
      hasPicture: false,
    })
    expect(insertPicture).not.toHaveBeenCalled()
    expect(await renditionsOf(link.code)).toEqual([])
    const [greeting] = (await greetingRows()).filter((row) => row.transactionLinkCode === link.code)
    expect(greeting).toMatchObject({ motif: 'bouquet', line: LINE, recipientName: 'Sarah' })
  })

  describe('refused before anything is written', () => {
    let links: number
    let greetings: number
    let pictures: number
    let events: number

    beforeEach(async () => {
      links = await linksOfBibi()
      greetings = (await greetingRows()).length
      pictures = (await pictureRows()).length
      events = await createEvents()
    })

    const expectNothingWritten = async () => {
      expect(await linksOfBibi()).toBe(links)
      expect(await greetingRows()).toHaveLength(greetings)
      expect(await pictureRows()).toHaveLength(pictures)
      expect(await createEvents()).toBe(events)
      expect(insertGreeting).not.toHaveBeenCalled()
      expect(insertPicture).not.toHaveBeenCalled()
    }

    const refused = async (greeting: Record<string, unknown>, message: string) => {
      const result = await mutate({ mutation: createLink, variables: { ...sarah, greeting } })
      expect(result.errors).toEqual([new GraphQLError(message)])
      // Whatever the reason, the answer does not quote the picture.
      expect(JSON.stringify(result.errors)).not.toContain(SMALL_PICTURE.data)
      await expectNothingWritten()
    }

    it('a motif and a picture at once', async () => {
      await refused(
        { ...WITH_PICTURE, motif: 'bouquet' },
        'Thank-you greeting: a motif or a picture, one of the two',
      )
    })

    it('neither of the two', async () => {
      await refused({ line: LINE }, 'Thank-you greeting: a motif or a picture, one of the two')
      await refused(
        { motif: null, picture: null, line: LINE },
        'Thank-you greeting: a motif or a picture, one of the two',
      )
    })

    it('a picture that is empty, too large, or no JPEG', async () => {
      const tooLarge = Buffer.concat([
        Buffer.from([0xff, 0xd8]),
        Buffer.alloc(CHAT_IMAGE_MAX_BYTES, 0x20),
        Buffer.from([0xff, 0xd9]),
      ]).toString('base64')
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0xff, 0xd9]).toString('base64')

      await refused(
        { ...WITH_PICTURE, picture: { ...SMALL_PICTURE, data: '' } },
        'CHAT_IMAGE_NOT_ACCEPTED: EMPTY',
      )
      await refused(
        { ...WITH_PICTURE, picture: { ...SMALL_PICTURE, data: tooLarge } },
        'CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE',
      )
      await refused(
        { ...WITH_PICTURE, picture: { ...SMALL_PICTURE, data: png } },
        'CHAT_IMAGE_NOT_ACCEPTED: NOT_JPEG',
      )
    })

    // The small rendition has the chat picture's bounds: the size of the large one is too much.
    it('a picture of more than the area of a chat picture', async () => {
      await refused(
        { ...WITH_PICTURE, picture: { ...SMALL_PICTURE, width: 1080, height: 750 } },
        'CHAT_IMAGE_NOT_ACCEPTED: SIZE',
      )
    })

    it('a side past the bound, or no whole number', async () => {
      for (const size of [
        { width: CHAT_IMAGE_MAX_SIDE + 1, height: 10 },
        { width: 0, height: 577 },
      ]) {
        const result = await mutate({
          mutation: createLink,
          variables: {
            ...sarah,
            greeting: { ...WITH_PICTURE, picture: { ...SMALL_PICTURE, ...size } },
          },
        })
        expect(result.errors).toHaveLength(1)
        await expectNothingWritten()
      }
    })
  })

  describe('the picture cannot be filed', () => {
    it('takes the greeting back out, and leaves no link, no event and no picture in the log', async () => {
      const links = await linksOfBibi()
      const greetings = (await greetingRows()).length
      const events = await createEvents()
      insertPicture.mockResolvedValueOnce({
        success: false,
        error: new DBInsertFailed('thank_you_greeting_pictures', {
          transactionLinkCode: 'x',
          rendition: 'small' as const,
          width: 831,
          height: 577,
          mimeType: 'image/jpeg',
        }),
      })
      const save = jest.spyOn(DbTransactionLink, 'save')

      const result = await mutate({ mutation: createLink, variables: sarah })

      expect(result.errors).toEqual([new GraphQLError('Unable to save thank-you greeting picture')])
      expect(save).not.toHaveBeenCalled()
      save.mockRestore()
      expect(await linksOfBibi()).toBe(links)
      expect(await greetingRows()).toHaveLength(greetings)
      expect(await createEvents()).toBe(events)
      expect(logErrorLogger.error).toHaveBeenCalledWith(
        'Unable to save thank-you greeting picture',
        'DBInsertFailed',
      )
      expect(JSON.stringify(logErrorLogger.error.mock.calls)).not.toContain(SMALL_PICTURE.data)
    })

    // Drizzle writes the parameters of a statement into the message of its error -- the picture
    // among them. What reaches the log and the client is the driver's code.
    it('keeps the picture out of the log where the database itself throws', async () => {
      const links = await linksOfBibi()
      const greetings = (await greetingRows()).length
      insertPicture.mockRejectedValueOnce(
        Object.assign(
          new Error(`Failed query: insert into thank_you_greeting_pictures ... params: ${SMALL}`),
          { cause: { code: 'ER_LOCK_WAIT_TIMEOUT' } },
        ),
      )

      const result = await mutate({ mutation: createLink, variables: sarah })

      expect(result.errors).toEqual([new GraphQLError('Unable to save thank-you greeting picture')])
      expect(JSON.stringify(result.errors)).not.toContain('private photo')
      expect(logErrorLogger.error).toHaveBeenCalledWith(
        'Unable to save thank-you greeting picture',
        'ER_LOCK_WAIT_TIMEOUT',
      )
      expect(JSON.stringify(logErrorLogger.error.mock.calls)).not.toContain('private photo')
      expect(await linksOfBibi()).toBe(links)
      expect(await greetingRows()).toHaveLength(greetings)
    })
  })

  describe('the link cannot be saved', () => {
    it('takes the greeting and its picture back out', async () => {
      const links = await linksOfBibi()
      const greetings = (await greetingRows()).length
      const pictures = (await pictureRows()).length
      const events = await createEvents()
      const save = jest
        .spyOn(DbTransactionLink, 'save')
        .mockRejectedValueOnce(new Error('the link table is away'))

      const result = await mutate({ mutation: createLink, variables: sarah })
      save.mockRestore()

      expect(result.errors).toEqual([new GraphQLError('Unable to save transaction link')])
      // Both were filed first, and both are gone again.
      expect(insertGreeting).toHaveBeenCalledTimes(1)
      expect(insertPicture).toHaveBeenCalledTimes(1)
      expect(await greetingRows()).toHaveLength(greetings)
      expect(await pictureRows()).toHaveLength(pictures)
      expect(await renditionsOf(insertPicture.mock.calls[0][0].transactionLinkCode)).toEqual([])
      expect(await linksOfBibi()).toBe(links)
      expect(await createEvents()).toBe(events)
    })
  })
})

/**
 * The greeting says in the link, in the sender's list and with the booking THAT it has a
 * picture; the picture itself is in none of these answers.
 */
describe('who is told that a greeting has a picture', () => {
  it('whoever holds the code of the link, signed in or not', async () => {
    const link = await created()
    resetToken()

    const result = await query({ query: linkByCode, variables: { code: link.code } })

    expect(result.errors).toBeUndefined()
    expect(result.data.queryTransactionLink.greeting).toEqual({
      motif: null,
      line: LINE,
      recipientName: 'Sarah',
      hasPicture: true,
    })
    expect(JSON.stringify(result.data)).not.toContain(SMALL_PICTURE.data)
  })

  it('the sender, in the list of their links -- a greeting with a motif says no', async () => {
    const withPicture = await created()
    const withMotif = await created({ ...sarah, greeting: { motif: 'bouquet' } })

    const result = await query({ query: ownLinks })

    expect(result.errors).toBeUndefined()
    const links = result.data.listTransactionLinks.links as Link[]
    expect(links.find((link) => link.id === withPicture.id)?.greeting).toEqual({
      motif: null,
      hasPicture: true,
    })
    expect(links.find((link) => link.id === withMotif.id)?.greeting).toEqual({
      motif: 'bouquet',
      hasPicture: false,
    })
    expect(JSON.stringify(result.data)).not.toContain(SMALL_PICTURE.data)
  })
})

describe('addThankYouGreetingPicture', () => {
  const add = async (linkId: number, picture: Record<string, unknown> = LARGE_PICTURE) => {
    const result = await mutate({ mutation: addPicture, variables: { linkId, picture } })
    return { errors: result.errors, added: result.data?.addThankYouGreetingPicture ?? null }
  }

  it('adds the large rendition to the member’s own open greeting, once', async () => {
    const link = await created()

    expect(await add(link.id)).toEqual({ errors: undefined, added: true })

    expect(await renditionsOf(link.code)).toEqual(['large', 'small'])
    const [large] = (await pictureRows()).filter(
      (row) => row.transactionLinkCode === link.code && row.rendition === 'large',
    )
    expect(large).toMatchObject({ width: 1080, height: 750, mimeType: 'image/jpeg' })
    expect(large.image.equals(LARGE)).toBe(true)

    // A second time: refused, and the first one stays as it is.
    expect(await add(link.id, { ...LARGE_PICTURE, data: SMALL_PICTURE.data })).toEqual({
      errors: undefined,
      added: false,
    })
    const [still] = (await pictureRows()).filter(
      (row) => row.transactionLinkCode === link.code && row.rendition === 'large',
    )
    expect(still.image.equals(LARGE)).toBe(true)
  })

  it('refuses what is no picture, with the reason, and files nothing', async () => {
    const link = await created()

    const refused = await add(link.id, { ...LARGE_PICTURE, width: 1200, height: 833 })

    expect(refused.errors).toEqual([new GraphQLError('THANK_YOU_PICTURE_NOT_ACCEPTED: SIZE')])
    expect(await renditionsOf(link.code)).toEqual(['small'])
  })

  // ⛔ One answer for every link the member may not add to.
  it('answers false for somebody else’s greeting', async () => {
    const link = await created()

    await loginAs('bob@baumeister.de')
    expect(await add(link.id)).toEqual({ errors: undefined, added: false })
    expect(await renditionsOf(link.code)).toEqual(['small'])
  })

  it('answers false for a greeting with a motif, a plain link and no link at all', async () => {
    const withMotif = await created({ ...sarah, greeting: { motif: 'bouquet' } })
    const plain = await created({ amount: '5', memo: 'Ein schlichter Link' })

    expect(await add(withMotif.id)).toEqual({ errors: undefined, added: false })
    expect(await add(plain.id)).toEqual({ errors: undefined, added: false })
    expect(await add(2_000_000_000)).toEqual({ errors: undefined, added: false })
    expect(await renditionsOf(withMotif.code)).toEqual([])
    expect(await renditionsOf(plain.code)).toEqual([])
  })

  it('answers false once the link has run out', async () => {
    const link = await created()
    await DbTransactionLink.update({ id: link.id }, { validUntil: new Date(Date.now() - 60_000) })

    expect(await add(link.id)).toEqual({ errors: undefined, added: false })
    expect(await renditionsOf(link.code)).toEqual(['small'])
  })

  it('is not for somebody who is not signed in', async () => {
    const link = await created()
    resetToken()

    const refused = await add(link.id)

    expect(refused.errors).toEqual([new GraphQLError('401 Unauthorized')])
    expect(await renditionsOf(link.code)).toEqual(['small'])
  })
})

describe('an open greeting with a picture', () => {
  let link: Link

  beforeAll(async () => {
    link = await withBothRenditions()
  })

  it('shows its large rendition at the address, to somebody who is not signed in', async () => {
    resetToken()

    const answer = await atTheAddress(link.code)

    expect(answer.status).toBe(200)
    expect(answer.body.equals(LARGE)).toBe(true)
    expect(answer.headers['content-type']).toBe('image/jpeg')
    expect(answer.headers['cache-control']).toBe('no-store')
    expect(answer.headers['x-content-type-options']).toBe('nosniff')
  })

  it('shows the small one at the address where no large one was added', async () => {
    const smallOnly = await created()

    const answer = await atTheAddress(smallOnly.code)

    expect(answer.status).toBe(200)
    expect(answer.body.equals(SMALL)).toBe(true)
  })

  it('answers empty at the address for an unknown code, a motif’s link and a text that is no code', async () => {
    const withMotif = await created({ ...sarah, greeting: { motif: 'bouquet' } })

    expectEmpty(await atTheAddress('00000000000000000000beef'))
    expectEmpty(await atTheAddress(withMotif.code))
    expectEmpty(await atTheAddress('no-code'))
  })

  /**
   * ⛔ Everything below the address is its own to answer, in the server as createServer builds
   * it -- before Apollo, which stands under `/` and answers a GET it cannot read with words of
   * its own: a file's ending, a further part, an escape that cannot be decoded, another method.
   * Each gets the one empty answer, also for the code of an open link with a picture.
   */
  it('answers empty for every path below the address, and for every method but reading', async () => {
    const address = `/api/thank-you-greeting-picture/${link.code}`
    for (const path of [
      `${address}.jpg`,
      `${address}/x`,
      `${address}/`,
      '/api/thank-you-greeting-picture/',
      '/api/thank-you-greeting-picture',
      '/api/thank-you-greeting-picture/%E0%A4',
    ]) {
      const answer = await atThePath(path)
      expectEmpty(answer)
      expect(answer.headers['content-length']).toBe('0')
    }
    for (const method of ['POST', 'PUT', 'DELETE']) {
      expectEmpty(await atThePath(address, method))
    }
    // …and the address itself still serves the picture.
    expect((await atTheAddress(link.code)).body.equals(LARGE)).toBe(true)
  })

  it('hands the small rendition to the sender by the link’s id, and to nobody else', async () => {
    expect(await pictureFor('bibi@bloxberg.de', link.id)).toBe(SMALL_PICTURE.data)
    expect(await pictureFor('bob@baumeister.de', link.id)).toBeNull()
    // Not yet to the one who will accept it: nobody has.
    expect(await pictureFor('peter@lustig.de', link.id)).toBeNull()
  })

  it('hands nothing by the query to somebody who is not signed in', async () => {
    resetToken()

    const result = await query({ query: pictureOfLink, variables: { linkId: link.id } })

    expect(result.errors).toEqual([new GraphQLError('401 Unauthorized')])
  })
})

describe('once the thank-you is accepted', () => {
  let link: Link

  beforeAll(async () => {
    link = await withBothRenditions()
    await loginAs('peter@lustig.de')
    const redeemed = await mutate({
      mutation: redeemTransactionLink,
      variables: { code: link.code },
    })
    expect(redeemed.errors).toBeUndefined()
    expect(redeemed.data.redeemTransactionLink).toBe(true)
  })

  it('the large rendition is gone, and the small one stays', async () => {
    expect(await renditionsOf(link.code)).toEqual(['small'])
  })

  // ⛔ Stricter than the greeting's words, which the page still shows: no picture for the code.
  it('the address answers empty, though the link still names its greeting', async () => {
    expectEmpty(await atTheAddress(link.code))

    resetToken()
    const result = await query({ query: linkByCode, variables: { code: link.code } })
    expect(result.data.queryTransactionLink.redeemedAt).not.toBeNull()
    expect(result.data.queryTransactionLink.greeting.hasPicture).toBe(true)
  })

  it('the sender and the one who accepted get the small rendition, a third member none', async () => {
    expect(await pictureFor('bibi@bloxberg.de', link.id)).toBe(SMALL_PICTURE.data)
    expect(await pictureFor('peter@lustig.de', link.id)).toBe(SMALL_PICTURE.data)
    expect(await pictureFor('bob@baumeister.de', link.id)).toBeNull()
  })

  it('the booking says to both that its greeting has a picture, and carries none', async () => {
    for (const [email, typeId] of [
      ['bibi@bloxberg.de', 'SEND'],
      ['peter@lustig.de', 'RECEIVE'],
    ]) {
      await loginAs(email)
      const result = await query({ query: bookings })
      expect(result.errors).toBeUndefined()
      const booking = result.data.transactionList.transactions.find(
        (row: { typeId: string; linkId: number | null }) =>
          row.typeId === typeId && row.linkId === link.id,
      )
      expect(booking.greeting).toEqual({ motif: null, line: LINE, hasPicture: true })
      expect(JSON.stringify(result.data)).not.toContain(SMALL_PICTURE.data)
    }
  })

  it('no large rendition can be added any more', async () => {
    await loginAs('bibi@bloxberg.de')
    const result = await mutate({
      mutation: addPicture,
      variables: { linkId: link.id, picture: LARGE_PICTURE },
    })

    expect(result.data.addThankYouGreetingPicture).toBe(false)
    expect(await renditionsOf(link.code)).toEqual(['small'])
  })
})

describe('a greeting that ran out', () => {
  let link: Link

  beforeAll(async () => {
    link = await withBothRenditions()
    await DbTransactionLink.update({ id: link.id }, { validUntil: new Date(Date.now() - 60_000) })
  })

  it('shows no picture at the address', async () => {
    expectEmpty(await atTheAddress(link.code))
  })

  it('still shows the small rendition to the sender, and to nobody else', async () => {
    expect(await pictureFor('bibi@bloxberg.de', link.id)).toBe(SMALL_PICTURE.data)
    expect(await pictureFor('bob@baumeister.de', link.id)).toBeNull()
    expect(await pictureFor('peter@lustig.de', link.id)).toBeNull()
  })

  // Nothing tidies up: both renditions lie there until the sender deletes the greeting.
  it('keeps both renditions', async () => {
    expect(await renditionsOf(link.code)).toEqual(['large', 'small'])
  })
})

describe('deleteTransactionLink', () => {
  it('takes both renditions with the link, and nobody gets a picture any more', async () => {
    const link = await withBothRenditions()
    const other = await withBothRenditions()

    const result = await mutate({ mutation: deleteTransactionLink, variables: { id: link.id } })

    expect(result.errors).toBeUndefined()
    expect(result.data.deleteTransactionLink).toBe(true)
    expect(await renditionsOf(link.code)).toEqual([])
    expect((await greetingRows()).filter((row) => row.transactionLinkCode === link.code)).toEqual(
      [],
    )
    expectEmpty(await atTheAddress(link.code))
    expect(await pictureFor('bibi@bloxberg.de', link.id)).toBeNull()
    // The greeting of another link is not touched.
    expect(await renditionsOf(other.code)).toEqual(['large', 'small'])
  })

  // The rows are away with the link; where one could not be removed, the rule holds all the
  // same: a deleted link shows no picture to anybody.
  it('shows no picture of a deleted link even where its rows are still there', async () => {
    const link = await withBothRenditions()
    await DbTransactionLink.update({ id: link.id }, { deletedAt: new Date() })

    expect(await renditionsOf(link.code)).toEqual(['large', 'small'])
    expectEmpty(await atTheAddress(link.code))
    expect(await pictureFor('bibi@bloxberg.de', link.id)).toBeNull()
  })
})

/**
 * ⛔ The account of the member who made the link is deleted: the page of the link opens no more
 * (queryTransactionLink), and the code of the link shows no picture either -- though the link's
 * own row still reads "open". The last of the file: it takes Bibi's account away for a moment.
 */
describe('an open greeting of a member whose account is deleted', () => {
  it('shows no picture at the address, and shows it again once the account is back', async () => {
    const link = await withBothRenditions()
    expect((await atTheAddress(link.code)).status).toBe(200)

    await User.update({ id: bibi.id }, { deletedAt: new Date() })
    try {
      expectEmpty(await atTheAddress(link.code))
      // Nothing was taken out: the rows wait for the account, or for the link to run out.
      expect(await renditionsOf(link.code)).toEqual(['large', 'small'])
    } finally {
      await User.update({ id: bibi.id }, { deletedAt: null })
    }

    expect((await atTheAddress(link.code)).body.equals(LARGE)).toBe(true)
  })
})
