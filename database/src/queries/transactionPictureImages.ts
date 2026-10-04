// AI-GENERATED — not an architecture reference
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { TransactionTypeId } from '../enum'
import { DBInsertFailed, DBNotFoundError, driverCodeOfFailedQuery } from '../errorTypes'
import {
  TransactionPictureImageInsert,
  transactionPictureImagesTable,
  transactionsTable,
} from '../schemas/drizzle.schema'

/**
 * What an error about a photo's row carries: the row without its bytes, and the driver's code
 * where the driver refused it.
 */
export type TransactionPictureImageNotFiled = Omit<TransactionPictureImageInsert, 'image'> & {
  driverCode: string | null
}

// An error is what ends up in a log or an answer, and a photo a member chose must not: the row
// goes into the error without its bytes.
const TransactionPictureImageInsertFailed = (
  { image: _image, ...row }: TransactionPictureImageInsert,
  driverCode: string | null,
) =>
  new DBInsertFailed<TransactionPictureImageNotFiled>('transaction_picture_images', {
    ...row,
    driverCode,
  })

/**
 * Files the photo of a transfer's picture, under the row of `transaction_pictures` it belongs
 * to (dbInsertTransactionPicture, which is the caller).
 *
 * ⛔ Never throws what the driver threw: Drizzle writes the parameters of a failed statement
 * into the error's message -- here the photo --, and an error that travels on ends up in an
 * answer or a log. A failure comes back with the driver's code and the row without its bytes.
 */
export async function dbInsertTransactionPictureImage(
  row: TransactionPictureImageInsert,
): Promise<VoidResult<DBInsertFailed<TransactionPictureImageNotFiled>>> {
  try {
    const result = await drizzleDb().insert(transactionPictureImagesTable).values(row)
    if (result[0]?.affectedRows === 1) {
      return { success: true }
    }
  } catch (error) {
    return {
      success: false,
      error: TransactionPictureImageInsertFailed(row, driverCodeOfFailedQuery(error)),
    }
  }
  return { success: false, error: TransactionPictureImageInsertFailed(row, null) }
}

const isRowId = (id: number): boolean => Number.isInteger(id) && id > 0

/**
 * The photo sent with a transfer, for a member: its bytes where the booking row with this id is
 * the member's OWN (`transactions.user_id`) and carries a picture that is a photo.
 *
 * ⛔ The one query that reads `image`, and the rule is in it rather than at the caller: a rule
 * every caller has to remember to apply is not a rule. A transfer has two rows -- the sender's
 * and the recipient's --, executeTransaction writes the picture's id onto both, and each of the
 * two members reaches the photo through theirs. Not found is the one answer for every other
 * case alike -- no such row, somebody else's row, a booking without a picture, a picture that
 * is a motif --, so that nothing tells them apart.
 *
 * Only a row of a transfer between two members, and none made from a link: the same two
 * conditions the booking list names a picture by (backend, TransactionPicture.logic). Today no
 * other row carries a picture -- executeTransaction is the one writer of the column --; said
 * here as well, so that the list and the photo go by one rule whatever is written one day.
 *
 * ⛔ Not by `linked_transaction_id`: on a booking received from another community that number
 * is the other server's (settlePendingReceiveTransaction), and would name an unrelated booking
 * here.
 *
 * The booking is found by its primary key, the photo by its unique key: two rows read.
 */
export async function dbSelectTransactionPictureImageForMember(
  transactionId: number,
  userId: number,
): Promise<Result<Buffer, DBNotFoundError>> {
  const notFound = (): Result<Buffer, DBNotFoundError> => ({
    success: false,
    error: new DBNotFoundError(
      'transaction_picture_images',
      `the picture of booking ${transactionId} as a row of its own member`,
    ),
  })
  // A number that is no row's id asks nothing: no condition may ever go missing over it.
  if (!isRowId(transactionId) || !isRowId(userId)) {
    return notFound()
  }
  const rows = await drizzleDb()
    .select({ image: transactionPictureImagesTable.image })
    .from(transactionPictureImagesTable)
    .innerJoin(
      transactionsTable,
      eq(
        transactionsTable.transactionPictureId,
        transactionPictureImagesTable.transactionPictureId,
      ),
    )
    .where(
      and(
        eq(transactionsTable.id, transactionId),
        eq(transactionsTable.userId, userId),
        inArray(transactionsTable.typeId, [TransactionTypeId.SEND, TransactionTypeId.RECEIVE]),
        isNull(transactionsTable.transactionLinkId),
      ),
    )
    .limit(1)
  const found = rows.at(0)
  return found ? { success: true, value: found.image } : notFound()
}

/**
 * Takes the photo of a picture out and says how many rows went: one, or none for a picture that
 * is a motif. Part of taking a picture back out that no booking carries
 * (dbDeleteTransactionPictureWithoutBooking, which is the caller and has asked first).
 */
export async function dbDeleteTransactionPictureImage(
  transactionPictureId: number,
): Promise<number> {
  if (!isRowId(transactionPictureId)) {
    return 0
  }
  const result = await drizzleDb()
    .delete(transactionPictureImagesTable)
    .where(eq(transactionPictureImagesTable.transactionPictureId, transactionPictureId))
  return result[0]?.affectedRows ?? 0
}
