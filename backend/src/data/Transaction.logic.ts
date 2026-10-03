// AI-GENERATED — not an architecture reference
import { Transaction as DbTransaction, TransactionTypeId } from 'database'

/** What the rules below read of a booking: four columns of its row in `transactions`. */
export type BookingLinkColumns = Pick<
  DbTransaction,
  'typeId' | 'transactionLinkId' | 'userId' | 'linkedUserId'
>

/** A link's greeting and the member who made the link (dbSelectThankYouGreetingsByLinkIds). */
export type GreetingOfLink<Greeting> = { linkUserId: number; greeting: Greeting }

/**
 * The member of THIS server who sent a booking, by id -- or null where no member here did.
 *
 * - A SEND row belongs to its sender: `userId`.
 * - A RECEIVE row names its sender in `linkedUserId` where the sender is a member here
 *   (executeTransaction). A booking received from another community has none: federation
 *   writes that row without it (voteForSendCoins, settlePendingReceiveTransaction), and no
 *   request of another server can fill the column.
 * - Every other kind of booking -- a creation, the virtual rows of the list -- has no sender
 *   in this sense.
 *
 * ⛔ Not by the community uuids of the row. `linked_user_community_uuid` of a booking from
 * afar is what the other server's request names as its community -- not something this server
 * knows. A row that names this very community there is a row from afar all the same.
 */
export const senderIdOf = (booking: BookingLinkColumns): number | null => {
  switch (booking.typeId as TransactionTypeId) {
    case TransactionTypeId.SEND:
      return booking.userId ?? null
    case TransactionTypeId.RECEIVE:
      return booking.linkedUserId ?? null
    default:
      return null
  }
}

/**
 * The id of the transaction link whose thank-you greeting a booking MAY carry -- an id of this
 * server's `transaction_links` --, or null: what a page of bookings asks the greetings' table
 * for.
 *
 * Only a booking sent by a member of this server (senderIdOf) has such a link. On a RECEIVE row
 * from another community `transaction_link_id` is the id the sender's server gave ITS link
 * (federation: SendCoinsResolver takes it from the request); here that number names an
 * unrelated link or none, and is not even asked for.
 *
 * ⛔ From the row's `transactionLinkId`, not from the `linkId` of the GraphQL model: for a
 * creation that field answers with the id of its CONTRIBUTION link -- a second range of
 * numbers in one field. A creation has no transaction link, and answers null here whatever
 * its row carries.
 */
export const greetingLinkIdOf = (booking: BookingLinkColumns): number | null =>
  booking.transactionLinkId && senderIdOf(booking) !== null ? booking.transactionLinkId : null

/**
 * The ids of the transaction links a page of bookings may have a greeting from, each once.
 * Empty where no booking of the page came from a link of this server -- and then the
 * greetings' table is asked nothing (dbSelectThankYouGreetingsByLinkIds).
 */
export const greetingLinkIdsOf = (bookings: BookingLinkColumns[]): number[] => [
  ...new Set(
    bookings.map((booking) => greetingLinkIdOf(booking)).filter((id): id is number => id !== null),
  ),
]

/**
 * The thank-you greeting of a booking, out of the greetings of the page's links: that of the
 * booking's link, where the link was made BY THE BOOKING'S SENDER. Null for every other
 * booking.
 *
 * A greeting is what the maker of a link wrote to whoever accepts it, and may name a third
 * person (`recipientName`). It is shown to the two the booking is between -- the sender on
 * their SEND row, the recipient on their RECEIVE row -- and that is only certain where the
 * link is the sender's own.
 *
 * ⛔ The id on the row alone does not say so. A row is written from what a request names, and
 * across the border that request is another server's (federation: the disbursement of a link
 * takes the sender and the link's code from it). Here the two are held against each other: a
 * link that is not the sender's own shows no greeting.
 */
export const greetingOfBooking = <Greeting>(
  booking: BookingLinkColumns,
  greetings: ReadonlyMap<number, GreetingOfLink<Greeting>>,
): Greeting | null => {
  const linkId = greetingLinkIdOf(booking)
  if (linkId === null) {
    return null
  }
  const ofLink = greetings.get(linkId)
  return ofLink && ofLink.linkUserId === senderIdOf(booking) ? ofLink.greeting : null
}
