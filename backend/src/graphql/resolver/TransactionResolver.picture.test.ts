// AI-GENERATED — not an architecture reference
import { inspect } from 'node:util'
import {
  cleanDB,
  resetToken,
  TEST_PICTURE_BASE64,
  TEST_PICTURE_SIZE,
  testEnvironment,
} from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  countOpenPendingTransactions,
  Transaction as DbTransaction,
  dbInsertEvent,
  dbInsertTransactionPicture,
  dbSelectTransactionPictureHeads,
  foreignReceive,
  transactionPictureImagesTable,
  transactionPicturesTable,
  User,
} from 'database'
import { gql } from 'graphql-tag'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { TRANSACTION_PICTURES_MAX_PER_REQUEST } from '@/data/TransactionPicture.logic'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  createTransactionLink,
  login,
  redeemTransactionLink,
  sendCoins,
} from '@/seeds/graphql/mutations'
import { transactionsQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

/**
 * A picture with a transfer, all the way against a database: a member who sends Gradido to a
 * member of their community adds a motif or a photo of their own; the booking carries it on
 * both rows, the booking list of each of the two names it, and each of the two gets the photo
 * through their own row -- nobody else, on no way.
 *
 * Bibi sends, Peter receives, Bob is the third member who has nothing to do with it.
 *
 * The queries are the real ones, wrapped so that a test can make one fail once and count how
 * often a page asks. TransactionResolver.transactionPicture.test.ts holds the order of the
 * steps without a database.
 */
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    countOpenPendingTransactions: jest.fn(original.countOpenPendingTransactions),
    dbInsertEvent: jest.fn(original.dbInsertEvent),
    dbInsertTransactionPicture: jest.fn(original.dbInsertTransactionPicture),
    dbSelectTransactionPictureHeads: jest.fn(original.dbSelectTransactionPictureHeads),
  }
})
// The mails are not this file's matter; nothing is sent.
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

const openPending = countOpenPendingTransactions as jest.MockedFunction<
  typeof countOpenPendingTransactions
>
const insertEvent = dbInsertEvent as jest.MockedFunction<typeof dbInsertEvent>
const filePicture = dbInsertTransactionPicture as jest.MockedFunction<
  typeof dbInsertTransactionPicture
>
const selectHeads = dbSelectTransactionPictureHeads as jest.MockedFunction<
  typeof dbSelectTransactionPictureHeads
>

CONFIG.DLT_ACTIVE = false

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let bibi: User
let peter: User
let bob: User

// A JPEG with something recognisable inside: what is handed out is seen, and what a log or an
// answer says is searched for it.
const SECRET = 'a private photo of the bench Dave built'
// It decodes (test/helpers.ts), and the secret stands in a comment segment of the file: the
// server stores the picture decoded and encoded again -- STORED, the same pixels without it.
const STORED = Buffer.from(TEST_PICTURE_BASE64, 'base64')
const STORED_BASE64 = TEST_PICTURE_BASE64
const PHOTO = Buffer.concat([
  STORED.subarray(0, 2),
  Buffer.from([0xff, 0xfe, 0x00, SECRET.length + 2]),
  Buffer.from(SECRET),
  STORED.subarray(2),
])
const PHOTO_BASE64 = PHOTO.toString('base64')
const PICTURE = { data: PHOTO_BASE64, width: 831, height: 577 }

const MOTIF_MEMO = 'Danke fürs Gießen, mit einem Motiv'
const PHOTO_MEMO = 'Für die Bank. Mit einem Foto'
const PLAIN_MEMO = 'Einfach überwiesen, ohne Bild'
const GREETING_MEMO = 'Einfach so — weil es Dich gibt.\nLieber Peter, danke!'
const AFTER_COMMIT_MEMO = 'Gebucht, und danach ein Fehler'

type Booking = {
  id: number
  typeId: string
  memo: string
  greeting: { motif: string | null } | null
  picture: { motif: string | null; hasPicture: boolean } | null
}

const pictureOfBooking = gql`
  query ($transactionId: Int!) {
    transactionPicture(transactionId: $transactionId)
  }
`

const loginAs = (email: string) =>
  mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

/** A transfer from whoever is signed in now, as the mutation answers it. */
const send = (recipientIdentifier: string, memo: string, picture: Record<string, unknown> = {}) =>
  mutate({
    mutation: sendCoins,
    variables: {
      recipientCommunityIdentifier: bibi.communityUuid,
      recipientIdentifier,
      amount: '5',
      memo,
      ...picture,
    },
  })

const sent = async (
  recipientIdentifier: string,
  memo: string,
  picture: Record<string, unknown> = {},
) => {
  const result = await send(recipientIdentifier, memo, picture)
  expect(result.errors).toBeUndefined()
  expect(result.data.sendCoins).toBe(true)
}

/** The booking list of a member, as their wallet asks for it; only this call is counted. */
const listOf = async (email: string) => {
  await loginAs(email)
  jest.clearAllMocks()
  const result = await query({ query: transactionsQuery })
  expect(result.errors).toBeUndefined()
  return result.data.transactionList.transactions as Booking[]
}

const rowOf = (bookings: Booking[], typeId: string, memo: string) => {
  const rows = bookings.filter((booking) => booking.typeId === typeId && booking.memo === memo)
  expect(rows).toHaveLength(1)
  return rows[0]
}

/** The two rows of a transfer as the database holds them: the sender's, the recipient's. */
const rowsOf = async (memo: string) => {
  const rows = await DbTransaction.find({ where: { memo }, order: { id: 'ASC' } })
  return {
    send: rows.find((row) => row.userId === bibi.id),
    receive: rows.find((row) => row.userId === peter.id),
    all: rows,
  }
}

const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()
/** Every row of the two tables, read past the wrapped queries. */
const headRows = () => drizzle().select().from(transactionPicturesTable)
const imageRows = () => drizzle().select().from(transactionPictureImagesTable)
const bookings = () => DbTransaction.count()

/** The photo as the query hands it to whoever is signed in now, or null. */
const photoFor = async (email: string, transactionId: number): Promise<string | null> => {
  await loginAs(email)
  const result = await query({ query: pictureOfBooking, variables: { transactionId } })
  expect(result.errors).toBeUndefined()
  return result.data.transactionPicture
}

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  // The admin has to exist for creationFactory.
  peter = await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  await userFactory(testEnv, raeuberHotzenplotz)
  await creationFactory(testEnv, creations.find((c) => c.email === 'bibi@bloxberg.de')!)

  await loginAs('bibi@bloxberg.de')
  await sent('peter@lustig.de', MOTIF_MEMO, { motif: 'giving-hands' })
  await sent('peter@lustig.de', PHOTO_MEMO, { picture: PICTURE })
  await sent('peter@lustig.de', PLAIN_MEMO)
  await sent('raeuber@hotzenplotz.de', PLAIN_MEMO)
  // A booking made from a link with a greeting: the second caller of executeTransaction.
  const link = await mutate({
    mutation: createTransactionLink,
    variables: { amount: '7', memo: GREETING_MEMO, greeting: { motif: 'bouquet' } },
  })
  expect(link.errors).toBeUndefined()
  await loginAs('peter@lustig.de')
  const redeemed = await mutate({
    mutation: redeemTransactionLink,
    variables: { code: link.data.createTransactionLink.code },
  })
  expect(redeemed.errors).toBeUndefined()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('a transfer with a motif', () => {
  it('carries the same picture on both rows, and the picture is the motif alone', async () => {
    const { send: sendRow, receive } = await rowsOf(MOTIF_MEMO)

    expect(sendRow?.transactionPictureId).toBeGreaterThan(0)
    expect(receive?.transactionPictureId).toBe(sendRow?.transactionPictureId)
    const heads = (await headRows()).filter((row) => row.id === sendRow?.transactionPictureId)
    expect(heads).toHaveLength(1)
    expect(heads[0].motif).toBe('giving-hands')
    expect(
      (await imageRows()).filter(
        (row) => row.transactionPictureId === sendRow?.transactionPictureId,
      ),
    ).toEqual([])
  })

  it('is named on the sender’s list and on the recipient’s, and has no photo to fetch', async () => {
    const sendersRow = rowOf(await listOf('bibi@bloxberg.de'), 'SEND', MOTIF_MEMO)
    const recipientsRow = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', MOTIF_MEMO)

    expect(sendersRow.picture).toEqual({ motif: 'giving-hands', hasPicture: false })
    expect(recipientsRow.picture).toEqual({ motif: 'giving-hands', hasPicture: false })
    expect(sendersRow.greeting).toBeNull()
    expect(await photoFor('bibi@bloxberg.de', sendersRow.id)).toBeNull()
  })
})

describe('a transfer with a photo', () => {
  it('carries the same picture on both rows, and the photo is filed beside it as it came', async () => {
    const { send: sendRow, receive } = await rowsOf(PHOTO_MEMO)

    expect(sendRow?.transactionPictureId).toBeGreaterThan(0)
    expect(receive?.transactionPictureId).toBe(sendRow?.transactionPictureId)
    const heads = (await headRows()).filter((row) => row.id === sendRow?.transactionPictureId)
    expect(heads).toHaveLength(1)
    expect(heads[0].motif).toBeNull()
    const images = (await imageRows()).filter(
      (row) => row.transactionPictureId === sendRow?.transactionPictureId,
    )
    expect(images).toHaveLength(1)
    // The size the picture has, not the one its sender gave -- and the picture encoded again,
    // with nothing of what was hidden in the file.
    expect(images[0]).toMatchObject({ ...TEST_PICTURE_SIZE, mimeType: 'image/jpeg' })
    expect(Buffer.compare(images[0].image, STORED)).toBe(0)
    expect(PHOTO.includes(SECRET)).toBe(true)
    expect(images[0].image.includes(SECRET)).toBe(false)
  })

  it('is named on both lists as a photo -- and no list carries the photo', async () => {
    const sendersList = await listOf('bibi@bloxberg.de')
    const recipientsList = await listOf('peter@lustig.de')

    expect(rowOf(sendersList, 'SEND', PHOTO_MEMO).picture).toEqual({
      motif: null,
      hasPicture: true,
    })
    expect(rowOf(recipientsList, 'RECEIVE', PHOTO_MEMO).picture).toEqual({
      motif: null,
      hasPicture: true,
    })
    expect(JSON.stringify([sendersList, recipientsList])).not.toContain(PHOTO_BASE64)
  })

  it('reaches the sender through her row and the recipient through his', async () => {
    const { send: sendRow, receive } = await rowsOf(PHOTO_MEMO)

    expect(await photoFor('bibi@bloxberg.de', sendRow!.id)).toBe(STORED_BASE64)
    expect(await photoFor('peter@lustig.de', receive!.id)).toBe(STORED_BASE64)
  })

  it('reaches nobody through a row that is not their own', async () => {
    const { send: sendRow, receive } = await rowsOf(PHOTO_MEMO)

    // Each of the two by the other's row, and the third member by either.
    expect(await photoFor('peter@lustig.de', sendRow!.id)).toBeNull()
    expect(await photoFor('bibi@bloxberg.de', receive!.id)).toBeNull()
    expect(await photoFor('bob@baumeister.de', sendRow!.id)).toBeNull()
    expect(await photoFor('bob@baumeister.de', receive!.id)).toBeNull()
  })

  it('is not there for a booking without one, nor for an id no booking has', async () => {
    const plain = (await rowsOf(PLAIN_MEMO)).all.find((row) => row.userId === bibi.id)

    expect(await photoFor('bibi@bloxberg.de', plain!.id)).toBeNull()
    expect(await photoFor('bibi@bloxberg.de', 2_000_000_000)).toBeNull()
    expect(await photoFor('bibi@bloxberg.de', 0)).toBeNull()
    expect(await photoFor('bibi@bloxberg.de', -1)).toBeNull()
  })

  it('is handed to nobody who is not signed in', async () => {
    const { send: sendRow } = await rowsOf(PHOTO_MEMO)
    resetToken()

    const result = await query({
      query: pictureOfBooking,
      variables: { transactionId: sendRow!.id },
    })

    expect(result.data?.transactionPicture ?? null).toBeNull()
    expect(result.errors?.[0].message).toBe('401 Unauthorized')
    expect(JSON.stringify(result)).not.toContain(PHOTO_BASE64)
  })

  it('is served ten times in one request, and not an eleventh', async () => {
    const { send: sendRow } = await rowsOf(PHOTO_MEMO)
    await loginAs('bibi@bloxberg.de')
    const aliases = (count: number) =>
      gql(
        `query { ${Array.from(
          { length: count },
          (_, n) => `p${n}: transactionPicture(transactionId: ${sendRow!.id})`,
        ).join(' ')} }`,
      )

    const allowed = await query({ query: aliases(TRANSACTION_PICTURES_MAX_PER_REQUEST) })
    const oneMore = await query({ query: aliases(TRANSACTION_PICTURES_MAX_PER_REQUEST + 1) })

    expect(allowed.errors).toBeUndefined()
    expect(Object.values(allowed.data)).toEqual(
      Array.from({ length: TRANSACTION_PICTURES_MAX_PER_REQUEST }, () => STORED_BASE64),
    )
    expect(oneMore.errors?.map((error) => error.message)).toEqual([
      'Too many transaction pictures requested at once',
    ])
  })
})

describe('every other booking', () => {
  it('carries no picture on its rows: a transfer without one, a booking made from a link', async () => {
    const plain = await rowsOf(PLAIN_MEMO)
    const fromLink = await DbTransaction.find({ where: { memo: GREETING_MEMO } })

    expect(plain.all).toHaveLength(4)
    expect(plain.all.map((row) => row.transactionPictureId)).toEqual([null, null, null, null])
    expect(fromLink).toHaveLength(2)
    expect(fromLink.map((row) => row.transactionPictureId)).toEqual([null, null])
  })

  it('is named without a picture on the list -- the creation and the two rows that are no bookings too', async () => {
    const list = await listOf('bibi@bloxberg.de')
    const withPicture = list.filter((booking) => booking.picture !== null)

    expect(withPicture.map((booking) => booking.memo).sort()).toEqual(
      [MOTIF_MEMO, PHOTO_MEMO].sort(),
    )
    expect(list.some((booking) => booking.typeId === 'CREATION')).toBe(true)
    expect(list.some((booking) => booking.typeId === 'DECAY')).toBe(true)
  })

  it('made from a link keeps its greeting and gets no picture', async () => {
    const row = rowOf(await listOf('peter@lustig.de'), 'RECEIVE', GREETING_MEMO)

    expect(row.greeting).toEqual(expect.objectContaining({ motif: 'bouquet' }))
    expect(row.picture).toBeNull()
  })
})

describe('what a page of the booking list asks', () => {
  it('asks the pictures once for the page, each picture once', async () => {
    const motifId = (await rowsOf(MOTIF_MEMO)).send?.transactionPictureId
    const photoId = (await rowsOf(PHOTO_MEMO)).send?.transactionPictureId

    await listOf('bibi@bloxberg.de')

    expect(selectHeads).toHaveBeenCalledTimes(1)
    expect([...selectHeads.mock.calls[0][0]].sort()).toEqual([motifId, photoId].sort())
  })

  it('names no picture for a page without one', async () => {
    await listOf('raeuber@hotzenplotz.de')

    // With nothing to ask for the query sends no statement (transactionPictures.test.ts).
    expect(selectHeads).toHaveBeenCalledTimes(1)
    expect(selectHeads).toHaveBeenCalledWith([])
  })
})

describe('a booking received from another community', () => {
  it('gets no picture by the other server’s number, on the list or by the query', async () => {
    const withPhoto = (await rowsOf(PHOTO_MEMO)).send!
    const fromAfar = await foreignReceive(
      bob,
      { communityUuid: uuidv4(), gradidoID: uuidv4(), name: 'Sarah' },
      new Date(),
    )
    // What settlePendingReceiveTransaction writes: the id the booking has on the OTHER server
    // -- here it happens to be the id of the booking with the photo.
    fromAfar.linkedTransactionId = withPhoto.id
    await fromAfar.save()

    const row = (await listOf('bob@baumeister.de')).find((booking) => booking.id === fromAfar.id)

    expect(row).toBeDefined()
    expect(row?.picture).toBeNull()
    expect(await photoFor('bob@baumeister.de', fromAfar.id)).toBeNull()
  })
})

describe('what a failure leaves behind', () => {
  const state = async () => ({
    bookings: await bookings(),
    heads: (await headRows()).length,
    images: (await imageRows()).length,
  })

  beforeEach(async () => {
    await loginAs('bibi@bloxberg.de')
    jest.clearAllMocks()
  })

  it('a motif and a photo at once: refused, nothing booked, nothing filed', async () => {
    const before = await state()

    const result = await send('peter@lustig.de', 'Beides zugleich', {
      motif: 'bouquet',
      picture: PICTURE,
    })

    expect(result.errors?.[0].message).toBe('Transfer picture: a motif or a photo, not both')
    expect(filePicture).not.toHaveBeenCalled()
    expect(await state()).toEqual(before)
  })

  it('an unknown motif, and a photo that is no JPEG: refused, nothing booked, nothing filed', async () => {
    const before = await state()
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0xff, 0xd9]).toString('base64')

    const unknown = await send('peter@lustig.de', 'Ein Elefant', { motif: 'elephant' })
    const noJpeg = await send('peter@lustig.de', 'Kein JPEG', {
      picture: { ...PICTURE, data: png },
    })

    expect(unknown.errors?.[0].message).toBe('Transfer picture: unknown motif')
    expect(noJpeg.errors?.[0].message).toBe('CHAT_IMAGE_NOT_ACCEPTED: NOT_JPEG')
    expect(filePicture).not.toHaveBeenCalled()
    expect(await state()).toEqual(before)
  })

  it('a balance that does not cover it: refused before anything is filed', async () => {
    await loginAs('bob@baumeister.de')
    jest.clearAllMocks()
    const before = await state()

    const result = await send('peter@lustig.de', 'Mehr als Bob hat', { picture: PICTURE })

    expect(result.errors?.[0].message).toBe('User has not enough GDD or amount is < 0')
    expect(filePicture).not.toHaveBeenCalled()
    expect(await state()).toEqual(before)
  })

  it('oneself as the recipient: refused before anything is filed', async () => {
    const before = await state()

    const result = await send('bibi@bloxberg.de', 'An mich selbst', { motif: 'bouquet' })

    expect(result.errors?.[0].message).toBe('Sender and Recipient are the same')
    expect(filePicture).not.toHaveBeenCalled()
    expect(await state()).toEqual(before)
  })

  it('a booking that is not made after the picture was filed: the picture is out again', async () => {
    const before = await state()
    openPending.mockResolvedValueOnce(1)

    const result = await send('peter@lustig.de', 'Offene Vorgänge', { picture: PICTURE })

    expect(result.errors?.[0].message).toContain("ongoing 'Pending-Transactions'")
    expect(filePicture).toHaveBeenCalledTimes(1)
    const filed = await filePicture.mock.results[0].value
    expect(filed.success).toBe(true)
    // Filed, and taken back out: its row and its photo.
    expect(await state()).toEqual(before)
    expect((await headRows()).map((row) => row.id)).not.toContain(filed.value)
  })

  it('a throw AFTER the commit: the booking stands, and so does its picture', async () => {
    const before = await state()
    insertEvent.mockRejectedValueOnce(new Error('the events table is away'))

    const result = await send('peter@lustig.de', AFTER_COMMIT_MEMO, { picture: PICTURE })

    // The member is told of a failure (as before this change) ...
    expect(result.errors).toBeDefined()
    // ... and the transfer is booked all the same, with its picture on both rows.
    const { send: sendRow, receive } = await rowsOf(AFTER_COMMIT_MEMO)
    expect(sendRow?.transactionPictureId).toBeGreaterThan(0)
    expect(receive?.transactionPictureId).toBe(sendRow?.transactionPictureId)
    expect(await state()).toEqual({
      bookings: before.bookings + 2,
      heads: before.heads + 1,
      images: before.images + 1,
    })
    expect(await photoFor('bibi@bloxberg.de', sendRow!.id)).toBe(STORED_BASE64)
    expect(await photoFor('peter@lustig.de', receive!.id)).toBe(STORED_BASE64)
  })

  it('a photo the database refuses: nothing booked, and no byte of it in the answer or the log', async () => {
    const before = await state()
    // The driver fails the insert of the photo the way it really fails: Drizzle then writes the
    // statement and its parameters -- the photo -- into the error's message.
    const pool = (drizzle() as any).$client
    const original = pool.query
    pool.query = function (statement: any, params: unknown[]) {
      const text: string = typeof statement === 'string' ? statement : statement.sql
      if (text.startsWith('insert') && text.includes('`transaction_picture_images`')) {
        pool.query = original
        return Promise.reject(
          Object.assign(new Error('Data too long for column'), { code: 'ER_DATA_TOO_LONG' }),
        )
      }
      return original.call(this, statement, params)
    }
    let result: Awaited<ReturnType<typeof send>>
    try {
      result = await send('peter@lustig.de', 'Das Foto wird abgelehnt', { picture: PICTURE })
    } finally {
      pool.query = original
    }

    expect(result.errors?.[0].message).toBe('Unable to save the picture of the transfer')
    expect(logErrorLogger.error).toHaveBeenCalledWith(
      'Unable to save the picture of the transfer',
      { row: 'transaction_picture_images', driverCode: 'ER_DATA_TOO_LONG' },
    )
    // Nothing booked, and the row of the picture is out again.
    expect(await state()).toEqual(before)
    for (const said of [
      JSON.stringify(result.errors),
      inspect(result.errors, { depth: 8 }),
      inspect(logErrorLogger.error.mock.calls, { depth: 8 }),
    ]) {
      expect(said).not.toContain(PHOTO_BASE64)
      expect(said).not.toContain(PHOTO.toString('hex'))
      expect(said).not.toContain(SECRET)
      expect(said).not.toContain('Failed query')
    }
  })
})
