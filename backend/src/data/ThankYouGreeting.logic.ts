// AI-GENERATED — not an architecture reference

/**
 * The rules of a thank-you greeting: a transaction link with a motif, a first line and the
 * name of whom it is for.
 *
 * ⛔ Dependency-free on purpose. The wallet keeps the same motifs and the same two lengths
 * (frontend/src/utils/thankYouMotifs.js, frontend/src/utils/thankYouGreeting.js) and has no
 * dependency on the backend; its drift tests import this file directly to hold the two
 * together, the way useMemberAvatars.drift.spec.js does. They can only do that as long as
 * nothing here imports type-graphql, zod or `shared`.
 */

/**
 * The motifs a greeting may carry, by the key the wallet finds the picture under
 * (frontend/public/img/thank-you-greeting/<key>.svg).
 *
 * Plain strings, not a GraphQL enum: a hyphen is no valid enum name, and a wallet older than
 * the server should read a motif it does not know as a text it has no picture for -- not as
 * an answer that fails to validate.
 */
export const THANK_YOU_MOTIFS = [
  'heart-leaves',
  'giving-hands',
  'bouquet',
  'glowing-swirl',
  'morning-light',
] as const

export type ThankYouMotif = (typeof THANK_YOU_MOTIFS)[number]

export const isThankYouMotif = (value: string): value is ThankYouMotif =>
  (THANK_YOU_MOTIFS as readonly string[]).includes(value)

/**
 * The first line of the card, at most this long. The longest of the twelve suggestions has 62
 * characters in German. The column is wider (migration 0152), so this can move without one.
 */
export const THANK_YOU_LINE_MAX_CHARS = 80

/** "Für wen?": a name written freely, at most this long. */
export const THANK_YOU_RECIPIENT_NAME_MAX_CHARS = 40

/**
 * Whether a text is one line of plain characters: no control character -- a line break and a
 * tab are two -- and neither of Unicode's own line and paragraph separators.
 */
export const isOneLine = (text: string): boolean => !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(text)

/**
 * Whether the memo of the link begins with the line of its greeting: the memo is exactly the
 * line, or the line, ONE line break, and the words after it.
 *
 * The memo is what goes into the booking and stays there; the line stands a second time in
 * the greeting's own row, so that the card can set it in handwriting and show the words under
 * it. Held together here, card and booking cannot say two different things, and the card can
 * cut the line off the memo without guessing where it ends.
 */
export const memoBeginsWithLine = (memo: string, line: string): boolean => {
  if (memo === line) {
    return true
  }
  const words = memo.slice(line.length + 1)
  return memo.startsWith(`${line}\n`) && words.length > 0 && !words.startsWith('\n')
}
