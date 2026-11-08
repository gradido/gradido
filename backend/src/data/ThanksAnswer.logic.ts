// AI-GENERATED — not an architecture reference
import { Transaction as DbTransaction } from 'database'
import { canReactToBooking } from './TransactionReaction.logic'

/**
 * Whether the recipient of a thank-you answered it (W3b, F E-046). Bernd, 08.11.2026: a message
 * to the giver after the thank-you came -- through "Antworten" on the overview's tile or in the
 * chat itself -- is a sign it was taken in and answered, whatever the way; and so is Gradido sent
 * back to the giver after it. The tile "Dein Dank ist da." leaves such a thank-you out.
 *
 * Derived from what the server holds anyway, the messages and the bookings: no state of its own,
 * no table, no setting. Asked for the bookings of a page at once, where the list is built.
 */

/** What the rules below read of a booking: five columns of its row in `transactions`. */
export type BookingAnswerColumns = Pick<
  DbTransaction,
  'id' | 'typeId' | 'linkedUserId' | 'linkedTransactionId' | 'balanceDate'
>

/**
 * When the member last answered each giver, by the giver's `users` id: the member's own newest
 * message in the direct conversation of the two (dbSelectLastOwnDirectMessageAtByPartner), and the
 * member's newest sending of Gradido to them (dbSelectLastSentToByUser). A giver the member never
 * wrote to, or never sent to, is missing from the map.
 */
export interface ThanksAnswers {
  lastOwnMessageAt: ReadonlyMap<number, Date>
  lastSentAt: ReadonlyMap<number, Date>
}

/**
 * The givers of the thank-yous on a page whose answer is asked for: the counterparty of each row
 * the member may react to (canReactToBooking -- their own RECEIVE row of a transfer from a member
 * of this server), each once. Empty where the page holds no such row, and then nothing is asked
 * of the messages or of the sendings.
 */
export const thanksPartnerIdsOf = (
  bookings: BookingAnswerColumns[],
  membersHere: ReadonlySet<number>,
): number[] => [
  ...new Set(
    bookings
      .filter((booking) => canReactToBooking(booking, membersHere))
      // canReactToBooking takes only a row that names a member of this server there.
      .map((booking) => booking.linkedUserId as number),
  ),
]

/**
 * Whether the member whose list a booking is on answered it: true only on a row they may react to
 * (canReactToBooking -- the set the tile "Dein Dank ist da." shows, and the set a first reaction
 * mails the giver about, W1), where they wrote the giver a message in their direct conversation,
 * or sent the giver Gradido, STRICTLY after the booking's time. False on every other row.
 *
 * Not an answer (F E-046): opening the conversation -- that is "seen" (Chat E-086), a column of
 * its own --, a message in a group, a message of the giver's, a message or a sending from before
 * the thank-you came. A reaction is not decided here either: it is a field of its own
 * (reactionOfBooking), and the tile leaves out both.
 *
 * ⚠️ The times compare only because both sides of the comparison are UTC. The booking's comes
 * through TypeORM, which reads a `datetime` as the process's local time; the message's and the
 * sending's come through Drizzle, which reads one as UTC (database/src/queries/transactions.ts says
 * the same of the contact list, which relies on it too). The two agree because the services run
 * with TZ=UTC (deployment/bare_metal/start.sh, and every package's test script) -- and a message's
 * time is the database's own clock (`current_timestamp(3)`), which is UTC on a server set up as
 * deployment/bare_metal/setup.md says. A process or a database that lost that would put the two
 * times hours apart.
 */
export const answeredOfBooking = (
  booking: BookingAnswerColumns,
  membersHere: ReadonlySet<number>,
  answers: ThanksAnswers,
): boolean => {
  if (!canReactToBooking(booking, membersHere)) {
    return false
  }
  const giver = booking.linkedUserId as number
  const came = booking.balanceDate.getTime()
  return [answers.lastOwnMessageAt.get(giver), answers.lastSentAt.get(giver)].some(
    (answeredAt) => answeredAt !== undefined && answeredAt.getTime() > came,
  )
}
