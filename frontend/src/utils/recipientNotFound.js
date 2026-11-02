// AI-GENERATED — not an architecture reference

/**
 * How the wallet tells "nobody has that account" from every other failure of a send: by the words
 * the server says it in. There are no codes for it, and the wallet asks in two ways.
 *
 * recipientNotFound.drift.spec.js holds the three sentences against the server's sources. The
 * line of the send error page that waited for 'recipient not known' never fired again once the
 * server had changed its words, and nothing noticed.
 */

// `user`, the question "Jetzt prüfen" asks (UserResolver).
const USER_NOT_FOUND = 'User not found'
// sendCoins to a member of this community (TransactionResolver), and sendEmail.
const RECIPIENT_NOT_FOUND = 'The recipient user was not found'
// sendCoins to a member of another community: what that community answers to the vote, before
// anything is booked on either side. It reaches the wallet wrapped in what the servers between
// add to it. ⛔ The vote's own words, not the bare "unknown recipientUserIdentifier": the later
// steps of a transfer say that as well, and by then the recipient had been found.
const VOTE_RECIPIENT_UNKNOWN = 'voteForSendCoins with unknown recipientUserIdentifier'

/**
 * Whether the answer to `user` says there is no such member. An error of the line or of the server
 * is not that: ⛔ never "no account" because the network was gone.
 *
 * @param {{ graphQLErrors?: { message: string }[] }} error what the query rejected with
 * @returns {boolean}
 */
export const isUserNotFoundAnswer = (error) =>
  error?.graphQLErrors?.some(({ message }) => message === USER_NOT_FOUND) === true

/**
 * Whether the message a send failed with says the recipient has no account.
 *
 * @param {string} message the message of the error, as the error pages get it
 * @returns {boolean}
 */
export const isRecipientNotFoundError = (message) =>
  String(message ?? '').includes(RECIPIENT_NOT_FOUND) ||
  String(message ?? '').includes(VOTE_RECIPIENT_UNKNOWN)
