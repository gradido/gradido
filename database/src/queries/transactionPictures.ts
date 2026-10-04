// AI-GENERATED — not an architecture reference
import { and, eq, inArray, notExists, sql } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, driverCodeOfFailedQuery } from '../errorTypes'
import { transactionPicturesTable, transactionsTable } from '../schemas/drizzle.schema'
import {
  dbDeleteTransactionPictureImage,
  dbInsertTransactionPictureImage,
} from './transactionPictureImages'

/** The photo of a picture as it is filed: the JPEG's bytes and the size the wallet gave. */
export interface TransactionPicturePhoto {
  image: Buffer
  width: number
  height: number
}

/**
 * A picture to file with a transfer: one of the motifs by its key, or a photo of the member's
 * own. One of the two -- the caller has checked what came in (sendCoins).
 */
export type TransactionPictureToFile = { motif: string } | { photo: TransactionPicturePhoto }

/**
 * What a list may know of a picture: the motif's key, or null for a photo of the member's own.
 * Never the photo.
 */
export interface TransactionPictureHead {
  id: number
  motif: string | null
}

/** What an error about a picture that was not filed carries: no byte of the picture. */
export interface TransactionPictureNotFiled {
  /** Which of the two rows was refused: the picture's own, or its photo's. */
  row: 'transaction_pictures' | 'transaction_picture_images'
  driverCode: string | null
}

const TransactionPictureInsertFailed = (notFiled: TransactionPictureNotFiled) =>
  new DBInsertFailed<TransactionPictureNotFiled>(notFiled.row, notFiled)

const isRowId = (id: number): boolean => Number.isInteger(id) && id > 0

/**
 * Files a picture for a transfer and answers with the id of its row -- the id the booking is
 * about to carry on both of its rows (executeTransaction).
 *
 * The row first; for a photo its bytes after it (`transaction_picture_images`). Where the bytes
 * cannot be filed, the row is taken back out: a failure leaves nothing behind.
 *
 * ⛔ Filed BEFORE the booking, and through another connection than the booking is written
 * through -- no transaction spans the two (AGENTS.md). A picture whose booking then is not made
 * is taken out with dbDeleteTransactionPictureWithoutBooking; until a booking carries it, no
 * reader reaches it -- every reader starts from a booking.
 *
 * ⛔ Never throws what the driver threw: the message of a failed Drizzle statement carries its
 * parameters, and the photo is one of them. A failure comes back with the driver's code.
 */
export async function dbInsertTransactionPicture(
  picture: TransactionPictureToFile,
): Promise<Result<number, DBInsertFailed<TransactionPictureNotFiled>>> {
  let id: number
  try {
    const result = await drizzleDb()
      .insert(transactionPicturesTable)
      .values({ motif: 'motif' in picture ? picture.motif : null })
    id = result[0]?.insertId
    if (result[0]?.affectedRows !== 1 || !isRowId(id)) {
      return {
        success: false,
        error: TransactionPictureInsertFailed({ row: 'transaction_pictures', driverCode: null }),
      }
    }
  } catch (error) {
    return {
      success: false,
      error: TransactionPictureInsertFailed({
        row: 'transaction_pictures',
        driverCode: driverCodeOfFailedQuery(error),
      }),
    }
  }
  if ('motif' in picture) {
    return { success: true, value: id }
  }
  const filed = await dbInsertTransactionPictureImage({
    transactionPictureId: id,
    width: picture.photo.width,
    height: picture.photo.height,
    image: picture.photo.image,
    mimeType: 'image/jpeg',
  })
  if (filed.success) {
    return { success: true, value: id }
  }
  // The row promises a photo that is not there: out with it. A row that cannot be taken out
  // stays where no booking points at it; the failure to report is the photo's.
  try {
    await drizzleDb().delete(transactionPicturesTable).where(eq(transactionPicturesTable.id, id))
  } catch {
    // nothing to add: the caller hears that the picture was not filed
  }
  return {
    success: false,
    error: TransactionPictureInsertFailed({
      row: 'transaction_picture_images',
      driverCode: filed.error.row.driverCode,
    }),
  }
}

/**
 * What a list may know of these pictures, in no particular order; an id without a row is
 * simply not in the answer. One statement for a whole page of bookings, and none for a page
 * without a picture.
 *
 * ⛔ Reads `transaction_pictures` only. Whether a picture is a photo is said by its row (the
 * motif is NULL), so no list needs a look at the table with the bytes.
 */
export async function dbSelectTransactionPictureHeads(
  ids: number[],
): Promise<TransactionPictureHead[]> {
  const rowIds = [...new Set(ids.filter(isRowId))]
  if (rowIds.length === 0) {
    return []
  }
  return drizzleDb()
    .select({ id: transactionPicturesTable.id, motif: transactionPicturesTable.motif })
    .from(transactionPicturesTable)
    .where(inArray(transactionPicturesTable.id, rowIds))
}

/**
 * Takes a picture back out that was filed for a transfer which then was not booked: its row and
 * its photo. Answers whether it went.
 *
 * ⛔ Only a picture NO booking carries, and that is asked in the statement that deletes -- of
 * the rows of the member who was sending (`transactions.user_id`, which has an index): a
 * transfer that failed to the caller's eyes may have been booked all the same
 * (executeTransaction can throw after its commit), and a booked picture stays whatever happened
 * afterwards. With a number that is no row's id nothing happens at all.
 */
export async function dbDeleteTransactionPictureWithoutBooking(
  transactionPictureId: number,
  senderUserId: number,
): Promise<boolean> {
  if (!isRowId(transactionPictureId) || !isRowId(senderUserId)) {
    return false
  }
  const result = await drizzleDb()
    .delete(transactionPicturesTable)
    .where(
      and(
        eq(transactionPicturesTable.id, transactionPictureId),
        notExists(
          drizzleDb()
            .select({ one: sql`1` })
            .from(transactionsTable)
            .where(
              and(
                eq(transactionsTable.userId, senderUserId),
                eq(transactionsTable.transactionPictureId, transactionPictureId),
              ),
            ),
        ),
      ),
    )
  if (result[0]?.affectedRows !== 1) {
    return false
  }
  await dbDeleteTransactionPictureImage(transactionPictureId)
  return true
}
