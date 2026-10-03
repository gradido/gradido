// AI-GENERATED — not an architecture reference
import { Transaction as DbTransaction, TransactionTypeId } from 'database'
import { isSameCommunity } from './Community.logic'

/** What the rule below reads of a booking: four columns of its row in `transactions`. */
export type BookingLinkColumns = Pick<
  DbTransaction,
  'typeId' | 'transactionLinkId' | 'userCommunityUuid' | 'linkedUserCommunityUuid'
>

/**
 * The id of the transaction link whose thank-you greeting belongs to a booking -- an id of
 * THIS server's `transaction_links` --, or null where the booking has no such link.
 *
 * `transactions.transaction_link_id` is written in three places, and the number means this
 * server's link in two of them:
 *
 * - on a SEND row: the link is the sender's own, made on this server (executeTransaction;
 *   across the border settlePendingSenderTransaction).
 * - on a RECEIVE row within the community: the same link (executeTransaction).
 * - on a RECEIVE row from ANOTHER community it is the id the sender's server gave its link
 *   (federation: SendCoinsResolver takes it from the request, settlePendingReceiveTransaction
 *   writes it). On this server that number names an unrelated link or none, so the row
 *   answers null here. The sender's community is the booking's `linkedUserCommunityUuid`;
 *   where either uuid is missing the two cannot be called the same (isSameCommunity).
 *
 * ⛔ From the row's `transactionLinkId`, not from the `linkId` of the GraphQL model: for a
 * creation that field answers with the id of its CONTRIBUTION link -- a second range of
 * numbers in one field. A creation has no transaction link, and answers null here whatever
 * its row carries.
 */
export const greetingLinkIdOf = (booking: BookingLinkColumns): number | null => {
  if (!booking.transactionLinkId) {
    return null
  }
  switch (booking.typeId as TransactionTypeId) {
    case TransactionTypeId.SEND:
      return booking.transactionLinkId
    case TransactionTypeId.RECEIVE:
      return isSameCommunity(booking.userCommunityUuid, booking.linkedUserCommunityUuid)
        ? booking.transactionLinkId
        : null
    default:
      return null
  }
}

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
