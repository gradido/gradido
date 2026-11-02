// AI-GENERATED — not an architecture reference

/**
 * The words of a thank-you greeting, on their way into a link's memo and back out of it.
 *
 * A greeting is a transaction link (ZE-016). Its memo -- what goes into the booking and stays
 * there -- is the first line, ONE line break, and the sender's own words; or one of the two
 * alone. The line stands a second time in the greeting itself, so that the card can set it in
 * handwriting and the words under it. The server refuses a greeting whose memo does not begin
 * with its line (shared/src/data/ThankYouGreeting.logic.ts, `memoBeginsWithLine`); the two
 * functions here are the wallet's side of that rule, and thankYouGreeting.drift.spec.js holds
 * them against the server's.
 */

/** As on the server; the drift test holds the two together. */
export const THANK_YOU_LINE_MAX_CHARS = 80
export const THANK_YOU_RECIPIENT_NAME_MAX_CHARS = 40

/**
 * The memo of a greeting: the line, a line break, the words -- or the one of them there is.
 * Both are taken trimmed, as the server stores the line.
 */
export const greetingMemo = (line, words) =>
  [line, words]
    .map((part) => (part ?? '').trim())
    .filter((part) => part !== '')
    .join('\n')

/**
 * What the card shows of a link: the line of its greeting and, apart from it, the words.
 *
 * Where the memo does not begin with the line -- no wallet writes such a greeting, and the
 * server takes none -- the memo stands whole as the words and there is no line: nothing is
 * shown twice, and nothing of the memo is lost.
 *
 * @param {string} memo the memo of the link
 * @param {string | null | undefined} line the line of its greeting, where it has one
 * @returns {{ line: string | null, words: string }}
 */
export const greetingParts = (memo, line) => {
  const text = memo ?? ''
  if (!line) return { line: null, words: text }
  if (text === line) return { line, words: '' }
  const words = text.slice(line.length + 1)
  return text.startsWith(`${line}\n`) && words !== '' && !words.startsWith('\n')
    ? { line, words }
    : { line: null, words: text }
}

/** As on the server: no control character, and neither of Unicode's own line separators. */
const isOneLine = (text) => !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(text)

/**
 * The line of a greeting that is made out of a message as it stands (the send form, ZE-037): the
 * first line of the message, where the server takes it as the greeting's line -- or null, and the
 * greeting goes without one. The message itself is never rewritten.
 *
 * ⛔ The server trims the line FIRST and then holds the UNTRIMMED memo against it
 * (backend/src/data/ThankYouGreeting.schema.ts). A first line with a space at its end would pass
 * here without the trim check and be refused there: no link, and no mail. The drift test holds
 * every answer of this function against the server's rule.
 *
 * @param {string} memo the message as the member wrote it
 * @returns {string | null}
 */
export const lineFromMemo = (memo) => {
  const lineEnd = memo.indexOf('\n')
  const candidate = lineEnd === -1 ? memo : memo.slice(0, lineEnd)
  return candidate === candidate.trim() &&
    isOneLine(candidate) &&
    candidate.length <= THANK_YOU_LINE_MAX_CHARS &&
    greetingParts(memo, candidate).line !== null
    ? candidate
    : null
}
