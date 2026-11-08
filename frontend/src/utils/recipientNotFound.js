// AI-GENERATED — not an architecture reference

/**
 * How the wallet tells "nobody has that account" from every other failure of a send: by the words
 * the backend says it in. There are no codes for it, and the wallet asks in two ways.
 *
 * The wallet has no dependency on `shared`, so it keeps its own copy of each sentence;
 * recipientNotFound.drift.spec.js holds them against shared/src/const/frontendReadable.ts, where
 * the backend takes them from.
 */

// `user`, the question "Jetzt prüfen" asks.
export const USER_NOT_FOUND = 'User not found'
// sendCoins and sendEmail, to a member of this community or of another one, with what was looked
// for behind a colon.
export const RECIPIENT_NOT_FOUND = 'The recipient user was not found'

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
  String(message ?? '').includes(RECIPIENT_NOT_FOUND)
