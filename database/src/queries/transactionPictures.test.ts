// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'shared'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { Transaction as DbTransaction } from '../entity'
import { TransactionTypeId } from '../enum'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  transactionPictureImagesTable,
  transactionPicturesTable,
  transactionsTable,
} from '../schemas'
import {
  dbDeleteTransactionPictureImage,
  dbSelectTransactionPictureImageForMember,
} from './transactionPictureImages'
import {
  dbDeleteTransactionPictureWithoutBooking,
  dbInsertTransactionPicture,
  dbSelectTransactionPictureHeads,
} from './transactionPictures'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Members and bookings with ids far from any other test's.
const EMMA = 884001
const DAVE = 884002
const CARLA = 884003
const SEND_PHOTO = 884101
const RECEIVE_PHOTO = 884102
const SEND_MOTIF = 884103
const RECEIVE_MOTIF = 884104
const PLAIN_SEND = 884105
const PLAIN_RECEIVE = 884106
// A booking received from another community whose `linked_transaction_id` -- the other
// server's number -- happens to be the id of the booking with the photo here.
const FROM_AFAR = 884107
const BOOKINGS = [
  SEND_PHOTO,
  RECEIVE_PHOTO,
  SEND_MOTIF,
  RECEIVE_MOTIF,
  PLAIN_SEND,
  PLAIN_RECEIVE,
  FROM_AFAR,
]
const NO_SUCH_BOOKING = 884199
const gid = (id: number) => `00000000-0000-4000-8000-000000${id}`

// Two photos that differ, so a query that hands back the wrong one cannot pass.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
const OTHER_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0xff, 0xd9])
const photo = (image: Buffer = JPEG) => ({ photo: { image, width: 831, height: 577 } })

// The ids the pictures get as they are filed.
const filedIds: number[] = []
const file = async (picture: Parameters<typeof dbInsertTransactionPicture>[0]): Promise<number> => {
  const filed = await dbInsertTransactionPicture(picture)
  if (!filed.success) {
    throw new Error(`picture not filed: ${filed.error.message}`)
  }
  filedIds.push(filed.value)
  return filed.value
}

/** A booking row with what the schema requires. */
const booking = (
  id: number,
  userId: number,
  typeId: TransactionTypeId,
  rest: Partial<typeof transactionsTable.$inferInsert> = {},
): typeof transactionsTable.$inferInsert => ({
  id,
  typeId,
  userId,
  userGradidoId: gid(userId),
  memo: 'Für die Bank.',
  amount: new GradidoUnit(typeId === TransactionTypeId.SEND ? -500000n : 500000n),
  balance: new GradidoUnit(1000000n),
  balanceDate: new Date('2026-10-04T10:00:00.000Z'),
  decay: new GradidoUnit(0n),
  ...rest,
})

const headRows = () =>
  db
    .select({ id: transactionPicturesTable.id })
    .from(transactionPicturesTable)
    .where(inArray(transactionPicturesTable.id, filedIds.length ? filedIds : [0]))
const imageRows = () =>
  db
    .select({ id: transactionPictureImagesTable.transactionPictureId })
    .from(transactionPictureImagesTable)
    .where(
      inArray(transactionPictureImagesTable.transactionPictureId, filedIds.length ? filedIds : [0]),
    )

/** The statements a function sends, as the pool gets them. */
const statementsOf = async (run: () => Promise<unknown>): Promise<string[]> => {
  const pool = (drizzleDb() as any).$client
  const original = pool.query
  const caught: string[] = []
  pool.query = function (query: any, params: unknown[]) {
    caught.push(typeof query === 'string' ? query : query.sql)
    return original.call(this, query, params)
  }
  try {
    await run()
  } finally {
    pool.query = original
  }
  return caught
}

/** Lets the next statement that names the table fail the way the driver fails. */
const failNextStatementOn = (table: string, message: string): (() => void) => {
  const pool = (drizzleDb() as any).$client
  const original = pool.query
  pool.query = function (query: any, params: unknown[]) {
    const text: string = typeof query === 'string' ? query : query.sql
    if (text.includes(`\`${table}\``) && text.startsWith('insert')) {
      pool.query = original
      return Promise.reject(Object.assign(new Error(message), { code: 'ER_DATA_TOO_LONG' }))
    }
    return original.call(this, query, params)
  }
  return () => {
    pool.query = original
  }
}

const cleanUp = async (): Promise<void> => {
  await db.delete(transactionsTable).where(inArray(transactionsTable.id, BOOKINGS))
  await db.delete(transactionsTable).where(inArray(transactionsTable.userId, [EMMA, DAVE, CARLA]))
  if (filedIds.length) {
    await db
      .delete(transactionPictureImagesTable)
      .where(inArray(transactionPictureImagesTable.transactionPictureId, filedIds))
    await db.delete(transactionPicturesTable).where(inArray(transactionPicturesTable.id, filedIds))
  }
}

let photoId: number
let motifId: number

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await cleanUp()
})
afterAll(async () => {
  await cleanUp()
  await appDB.destroy()
})

describe('transactionPictures query test', () => {
  it('files a motif as one row and no photo', async () => {
    motifId = await file({ motif: 'giving-hands' })

    expect(motifId).toBeGreaterThan(0)
    expect(await dbSelectTransactionPictureHeads([motifId])).toEqual([
      { id: motifId, motif: 'giving-hands' },
    ])
    expect(await imageRows()).toEqual([])
  })

  it('files a photo as a row without a motif and its bytes beside it', async () => {
    photoId = await file(photo())

    expect(photoId).not.toBe(motifId)
    expect(await dbSelectTransactionPictureHeads([photoId])).toEqual([{ id: photoId, motif: null }])
    const stored = await db
      .select()
      .from(transactionPictureImagesTable)
      .where(eq(transactionPictureImagesTable.transactionPictureId, photoId))
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ width: 831, height: 577, mimeType: 'image/jpeg' })
    expect(Buffer.compare(stored[0].image, JPEG)).toBe(0)
  })

  it('takes the row back out where the bytes cannot be filed, and the failure carries no byte', async () => {
    const before = (
      await db.select({ id: transactionPicturesTable.id }).from(transactionPicturesTable)
    ).length
    const secret = Buffer.from('ffd8ffe0-THE-PHOTO-OF-THE-BENCH-ffd9')
    const restore = failNextStatementOn(
      'transaction_picture_images',
      // What Drizzle's message is like: the statement and its parameters.
      `Failed query: insert into transaction_picture_images ... params: ${secret.toString('base64')}`,
    )
    let filed: Awaited<ReturnType<typeof dbInsertTransactionPicture>>
    try {
      filed = await dbInsertTransactionPicture({
        photo: { image: secret, width: 800, height: 600 },
      })
    } finally {
      restore()
    }

    expect(filed.success).toBe(false)
    if (!filed.success) {
      expect(filed.error).toBeInstanceOf(DBInsertFailed)
      expect(filed.error.row).toEqual({
        row: 'transaction_picture_images',
        driverCode: 'ER_DATA_TOO_LONG',
      })
      const said = JSON.stringify(filed.error) + filed.error.message + String(filed.error.stack)
      expect(said).not.toContain(secret.toString('base64'))
      expect(said).not.toContain('THE-PHOTO')
    }
    // No row was left behind for the photo that is not there.
    expect(
      (await db.select({ id: transactionPicturesTable.id }).from(transactionPicturesTable)).length,
    ).toBe(before)
  })

  it('answers with the driver code, not the error, where the row itself is refused', async () => {
    const restore = failNextStatementOn(
      'transaction_pictures',
      'Failed query: insert ... params: x',
    )
    let filed: Awaited<ReturnType<typeof dbInsertTransactionPicture>>
    try {
      filed = await dbInsertTransactionPicture({ motif: 'bouquet' })
    } finally {
      restore()
    }

    expect(filed.success).toBe(false)
    if (!filed.success) {
      expect(filed.error.row).toEqual({
        row: 'transaction_pictures',
        driverCode: 'ER_DATA_TOO_LONG',
      })
    }
  })

  it('the heads of a page: one statement on the one table, none for a page without a picture', async () => {
    const some = await statementsOf(() =>
      dbSelectTransactionPictureHeads([photoId, motifId, photoId]),
    )
    const none = await statementsOf(() => dbSelectTransactionPictureHeads([]))
    const noIds = await statementsOf(() =>
      dbSelectTransactionPictureHeads([0, -1, Number.NaN, undefined as unknown as number]),
    )

    expect(some).toHaveLength(1)
    expect(some[0]).toContain('`transaction_pictures`')
    // ⛔ No list asks the table with the bytes.
    expect(some[0]).not.toContain('transaction_picture_images')
    expect(some[0]).not.toContain('image')
    expect(none).toEqual([])
    expect(noIds).toEqual([])
    expect(
      (await dbSelectTransactionPictureHeads([photoId, motifId, 4_000_000_000]))
        .map((h) => h.id)
        .sort(),
    ).toEqual([motifId, photoId].sort())
  })

  describe('with bookings that carry the pictures', () => {
    beforeAll(async () => {
      // The transfer with the photo is written the way executeTransaction writes it: through
      // the entity, the picture's id on both rows.
      const send = new DbTransaction()
      send.id = SEND_PHOTO
      send.typeId = TransactionTypeId.SEND
      send.userId = EMMA
      send.userGradidoID = gid(EMMA)
      send.linkedUserId = DAVE
      send.memo = 'Für die Bank.'
      send.amount = new GradidoUnit(-500000n)
      send.balance = new GradidoUnit(1000000n)
      send.balanceDate = new Date('2026-10-04T10:00:00.000Z')
      send.decay = new GradidoUnit(0n)
      send.transactionPictureId = photoId
      await DbTransaction.insert(send)
      const receive = new DbTransaction()
      receive.id = RECEIVE_PHOTO
      receive.typeId = TransactionTypeId.RECEIVE
      receive.userId = DAVE
      receive.userGradidoID = gid(DAVE)
      receive.linkedUserId = EMMA
      receive.linkedTransactionId = SEND_PHOTO
      receive.memo = 'Für die Bank.'
      receive.amount = new GradidoUnit(500000n)
      receive.balance = new GradidoUnit(500000n)
      receive.balanceDate = new Date('2026-10-04T10:00:00.000Z')
      receive.decay = new GradidoUnit(0n)
      receive.transactionPictureId = photoId
      await DbTransaction.insert(receive)

      await db.insert(transactionsTable).values([
        booking(SEND_MOTIF, EMMA, TransactionTypeId.SEND, { transactionPictureId: motifId }),
        booking(RECEIVE_MOTIF, CARLA, TransactionTypeId.RECEIVE, {
          transactionPictureId: motifId,
        }),
        booking(PLAIN_SEND, EMMA, TransactionTypeId.SEND),
        booking(PLAIN_RECEIVE, DAVE, TransactionTypeId.RECEIVE),
        booking(FROM_AFAR, CARLA, TransactionTypeId.RECEIVE, { linkedTransactionId: SEND_PHOTO }),
      ])
    })

    it('reads the column through Drizzle as the entity wrote it, and null where nothing was written', async () => {
      const rows = await db
        .select({ id: transactionsTable.id, picture: transactionsTable.transactionPictureId })
        .from(transactionsTable)
        .where(inArray(transactionsTable.id, [SEND_PHOTO, RECEIVE_PHOTO, PLAIN_SEND, FROM_AFAR]))

      expect(Object.fromEntries(rows.map((row) => [row.id, row.picture]))).toEqual({
        [SEND_PHOTO]: photoId,
        [RECEIVE_PHOTO]: photoId,
        [PLAIN_SEND]: null,
        [FROM_AFAR]: null,
      })
      // And the other way round: written through Drizzle, read through the entity.
      const motifRow = await DbTransaction.findOneOrFail({ where: { id: SEND_MOTIF } })
      expect(motifRow.transactionPictureId).toBe(motifId)
      const plainRow = await DbTransaction.findOneOrFail({ where: { id: PLAIN_SEND } })
      expect(plainRow.transactionPictureId).toBeNull()
    })

    it('gives the photo to the sender through her row and to the recipient through his', async () => {
      const toEmma = await dbSelectTransactionPictureImageForMember(SEND_PHOTO, EMMA)
      const toDave = await dbSelectTransactionPictureImageForMember(RECEIVE_PHOTO, DAVE)

      expect(toEmma.success && Buffer.compare(toEmma.value, JPEG)).toBe(0)
      expect(toDave.success && Buffer.compare(toDave.value, JPEG)).toBe(0)
    })

    it.each([
      ['a third member, by the sender’s row', SEND_PHOTO, CARLA],
      ['a third member, by the recipient’s row', RECEIVE_PHOTO, CARLA],
      ['the sender, by the recipient’s row', RECEIVE_PHOTO, EMMA],
      ['the recipient, by the sender’s row', SEND_PHOTO, DAVE],
      ['a booking without a picture', PLAIN_SEND, EMMA],
      ['a booking whose picture is a motif', SEND_MOTIF, EMMA],
      ['no such booking', NO_SUCH_BOOKING, EMMA],
      // The other server's number names the booking with the photo; her own row carries none.
      ['a booking from afar that names the booking with the photo', FROM_AFAR, CARLA],
      ['a number that is no id', 0, EMMA],
      ['no number at all', undefined as unknown as number, EMMA],
      ['no member at all', SEND_PHOTO, undefined as unknown as number],
    ])('gives nothing, and the one answer, to %s', async (_who, transactionId, userId) => {
      const found = await dbSelectTransactionPictureImageForMember(transactionId, userId)

      expect(found.success).toBe(false)
      if (!found.success) {
        expect(found.error).toBeInstanceOf(DBNotFoundError)
        expect(found.error.table).toBe('transaction_picture_images')
      }
    })

    it('hands each booking its own photo', async () => {
      const otherId = await file(photo(OTHER_JPEG))
      await db
        .update(transactionsTable)
        .set({ transactionPictureId: otherId })
        .where(eq(transactionsTable.id, PLAIN_RECEIVE))

      const other = await dbSelectTransactionPictureImageForMember(PLAIN_RECEIVE, DAVE)
      const first = await dbSelectTransactionPictureImageForMember(RECEIVE_PHOTO, DAVE)

      expect(other.success && Buffer.compare(other.value, OTHER_JPEG)).toBe(0)
      expect(first.success && Buffer.compare(first.value, JPEG)).toBe(0)
      await db
        .update(transactionsTable)
        .set({ transactionPictureId: null })
        .where(eq(transactionsTable.id, PLAIN_RECEIVE))
    })

    it('the photo is read by one statement, which names the member and stops at one row', async () => {
      const statements = await statementsOf(() =>
        dbSelectTransactionPictureImageForMember(SEND_PHOTO, EMMA),
      )
      const unasked = await statementsOf(() => dbSelectTransactionPictureImageForMember(0, EMMA))

      expect(statements).toHaveLength(1)
      expect(statements[0]).toContain('`image`')
      expect(statements[0]).toContain('`user_id`')
      expect(statements[0]).not.toContain('linked_transaction_id')
      expect(statements[0]).toContain('limit')
      expect(unasked).toEqual([])
    })

    it('does not take a picture out that a booking carries', async () => {
      expect(await dbDeleteTransactionPictureWithoutBooking(photoId, EMMA)).toBe(false)
      expect(await dbDeleteTransactionPictureWithoutBooking(motifId, EMMA)).toBe(false)

      expect(await dbSelectTransactionPictureHeads([photoId, motifId])).toHaveLength(2)
      const stillThere = await dbSelectTransactionPictureImageForMember(SEND_PHOTO, EMMA)
      expect(stillThere.success).toBe(true)
    })

    it('takes a picture out that no booking carries: its row and its photo', async () => {
      const orphanPhoto = await file(photo(OTHER_JPEG))
      const orphanMotif = await file({ motif: 'bouquet' })

      expect(await dbDeleteTransactionPictureWithoutBooking(orphanPhoto, EMMA)).toBe(true)
      expect(await dbDeleteTransactionPictureWithoutBooking(orphanMotif, EMMA)).toBe(true)

      expect(await dbSelectTransactionPictureHeads([orphanPhoto, orphanMotif])).toEqual([])
      expect((await imageRows()).map((row) => row.id)).not.toContain(orphanPhoto)
      // A second time there is nothing to take out.
      expect(await dbDeleteTransactionPictureWithoutBooking(orphanPhoto, EMMA)).toBe(false)
    })

    it.each([
      ['zero', 0],
      ['a negative number', -1],
      ['no number', undefined as unknown as number],
      ['null', null as unknown as number],
      ['not a number', Number.NaN],
    ])('does nothing at all with %s for a picture', async (_what, id) => {
      const headsBefore = (await headRows()).length
      const imagesBefore = (await imageRows()).length

      const statements = await statementsOf(async () => {
        expect(await dbDeleteTransactionPictureWithoutBooking(id, EMMA)).toBe(false)
        expect(await dbDeleteTransactionPictureWithoutBooking(photoId, id)).toBe(false)
        expect(await dbDeleteTransactionPictureImage(id)).toBe(0)
      })

      expect(statements).toEqual([])
      expect((await headRows()).length).toBe(headsBefore)
      expect((await imageRows()).length).toBe(imagesBefore)
    })

    it('the question whether a booking carries the picture is asked in the deleting statement, of the sender’s rows', async () => {
      const statements = await statementsOf(() =>
        dbDeleteTransactionPictureWithoutBooking(photoId, EMMA),
      )

      expect(statements).toHaveLength(1)
      expect(statements[0]).toMatch(/^delete from `transaction_pictures`/)
      expect(statements[0]).toContain('not exists')
      expect(statements[0]).toContain('`user_id`')
    })
  })
})
