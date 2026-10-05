// AI-GENERATED — not an architecture reference
import { Transaction as DbTransaction, TransactionTypeId } from 'database'

/** What the rules below read of a booking: three columns of its row in `transactions`. */
export type BookingPictureColumns = Pick<
  DbTransaction,
  'typeId' | 'transactionLinkId' | 'transactionPictureId'
>

/**
 * The id of the picture a booking carries (`transaction_pictures`), or null: what a page of
 * bookings asks the pictures' table for.
 *
 * Only the two rows of a transfer between two members can carry one: executeTransaction is the
 * one writer of the column, and it writes the id sendCoins was given for the picture it filed
 * in the same call. A booking made from a link has a greeting or nothing -- the way a link is
 * accepted passes no picture --, so a row that names a link is not asked for one, whatever it
 * carries: a booking shows its greeting or its picture, never both.
 */
export const transactionPictureIdOf = (booking: BookingPictureColumns): number | null => {
  const type = booking.typeId as TransactionTypeId
  if (type !== TransactionTypeId.SEND && type !== TransactionTypeId.RECEIVE) {
    return null
  }
  return booking.transactionPictureId && !booking.transactionLinkId
    ? booking.transactionPictureId
    : null
}

/**
 * The ids of the pictures of a page of bookings, each once. Empty for a page without a picture
 * -- and then the pictures' table is asked nothing (dbSelectTransactionPictureHeads).
 */
export const transactionPictureIdsOf = (bookings: BookingPictureColumns[]): number[] => [
  ...new Set(
    bookings
      .map((booking) => transactionPictureIdOf(booking))
      .filter((id): id is number => id !== null),
  ),
]

/**
 * How many photos one HTTP request is served by transactionPicture, over every alias of the
 * field and every operation of a batch (RequestBudget): as many as a chat's pictures and a
 * greeting's (CHAT_IMAGES_MAX_PER_REQUEST). The wallet asks for one in a request.
 */
export const TRANSACTION_PICTURES_MAX_PER_REQUEST = 10
