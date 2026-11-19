// AI-GENERATED — not an architecture reference

/**
 * How the wallet tells "nobody has that account" from every other failure of a send: by the words
 * the backend says it in. There are no codes for it, and the wallet asks in two ways.
 * The sentences are the backend's own, from `shared`: USER_NOT_FOUND for `user`, the question
 * "Jetzt prüfen" asks, and RECIPIENT_NOT_FOUND for sendCoins and sendEmail, with what was looked
 * for behind a colon.
 */
import { RECIPIENT_NOT_FOUND, USER_NOT_FOUND } from 'shared/browser'

export { RECIPIENT_NOT_FOUND, USER_NOT_FOUND }

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
