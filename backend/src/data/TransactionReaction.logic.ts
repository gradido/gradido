// AI-GENERATED — not an architecture reference
import {
  Transaction as DbTransaction,
  TransactionReactionOfBooking,
  TransactionTypeId,
} from 'database'

/**
 * How many reactions to transfers one HTTP request may set or take back
 * (setTransactionReaction), over every alias -- counted in RequestBudget (server/context.ts): a
 * document may repeat the field any number of times. The wallet sends one a request; ten rather
 * than one for the reason CHAT_REACTIONS_MAX_PER_REQUEST gives.
 */
export const TRANSACTION_REACTIONS_MAX_PER_REQUEST = 10

/** What the rules below read of a booking: four columns of its row in `transactions`. */
export type BookingReactionColumns = Pick<
  DbTransaction,
  'id' | 'typeId' | 'linkedUserId' | 'linkedTransactionId'
>

/**
 * Whether a booking is one half of a transfer between two members of THIS server: a SEND or a
 * RECEIVE row whose counterparty is one of `membersHere` -- the ids of this community's own
 * members among the counterparties of the page (their `users` rows are not `foreign`).
 *
 * ⛔ By this server's own rows, as senderIdOf in Transaction.logic has it, and not by anything
 * the booking says of a community: on a booking from afar that is what another server's request
 * named. And a `linkedUserId` alone is no proof either: `users` holds rows for members of other
 * communities as well (`foreign`), and a booking may name one of those.
 *
 * A creation is none: it carries the confirming moderator's id in that column, and is booked
 * with nobody.
 */
export const isTransferAmongMembersHere = (
  booking: BookingReactionColumns,
  membersHere: ReadonlySet<number>,
): boolean => {
  const type = booking.typeId as TransactionTypeId
  return (
    (type === TransactionTypeId.SEND || type === TransactionTypeId.RECEIVE) &&
    booking.linkedUserId !== null &&
    booking.linkedUserId !== undefined &&
    membersHere.has(booking.linkedUserId)
  )
}

/**
 * The RECEIVE booking the reaction to a booking's transfer hangs on (migration 0159), by its id
 * -- what a page of bookings asks the reactions' table with -- or null for a booking that can
 * have none: the recipient's own row for a RECEIVE, the row it names for a SEND.
 *
 * Only for a transfer between two members of this server. A booking with another community is
 * this server's half of the transfer alone: there is no second row here, and whatever its
 * `linkedTransactionId` holds -- the federation copies the column from the pending booking, which
 * names none today -- is no booking of this transfer in this table. It is not asked for.
 */
export const reactionKeyOf = (
  booking: BookingReactionColumns,
  membersHere: ReadonlySet<number>,
): number | null => {
  if (!isTransferAmongMembersHere(booking, membersHere)) {
    return null
  }
  return (booking.typeId as TransactionTypeId) === TransactionTypeId.RECEIVE
    ? booking.id
    : (booking.linkedTransactionId ?? null)
}

/**
 * The bookings a page asks the reactions' table with, each once. Empty where the page holds no
 * transfer between two members here -- and then the table is asked nothing
 * (dbSelectTransactionReactions).
 */
export const reactionKeysOf = (
  bookings: BookingReactionColumns[],
  membersHere: ReadonlySet<number>,
): number[] => [
  ...new Set(
    bookings
      .map((booking) => reactionKeyOf(booking, membersHere))
      .filter((id): id is number => id !== null),
  ),
]

/**
 * The emoji the recipient of a booking's transfer answered it with, out of the reactions of the
 * page -- on both rows, the recipient's and the sender's -- or null.
 *
 * ⛔ A sender is shown a reaction only where the RECEIVE row it hangs on names the sender's own
 * row back. The number on the sender's row alone says nothing: the two rows of a transfer name
 * EACH OTHER, and only a pair that does is one transfer.
 */
export const reactionOfBooking = (
  booking: BookingReactionColumns,
  membersHere: ReadonlySet<number>,
  reactions: ReadonlyMap<number, TransactionReactionOfBooking>,
): string | null => {
  const key = reactionKeyOf(booking, membersHere)
  const found = key === null ? undefined : reactions.get(key)
  if (!found) {
    return null
  }
  if (
    (booking.typeId as TransactionTypeId) === TransactionTypeId.SEND &&
    found.linkedTransactionId !== booking.id
  ) {
    return null
  }
  return found.emoji
}

/**
 * Whether the member whose list a booking is on may react to it: their own RECEIVE row of a
 * transfer from a member of this server -- only the recipient reacts (Bernd, 11.10.2026), and
 * a reaction has no way to another community yet. What setTransactionReaction itself asks of
 * the database (dbSelectReceivedTransferOfUser), said to the wallet with the booking.
 */
export const canReactToBooking = (
  booking: BookingReactionColumns,
  membersHere: ReadonlySet<number>,
): boolean =>
  (booking.typeId as TransactionTypeId) === TransactionTypeId.RECEIVE &&
  isTransferAmongMembersHere(booking, membersHere)
