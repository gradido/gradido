// AI-GENERATED — not an architecture reference

/**
 * Text a person typed, cut into the pieces a mail shows: plain text, web addresses and e-mail
 * addresses -- so that the addresses can be links WITHOUT the text ever being read as markup.
 *
 * ⛔ The text is somebody else's: a chat message, a moderator's question, the memo of a
 * booking. Nothing here builds HTML. The mail template (`emails/templates/includes/
 * humanText.pug`) writes every piece through pug's escaping, as text or as an attribute value,
 * so whatever markup the text carries reaches the mail as text.
 *
 * The rules are the wallet's (`frontend/src/utils/memoParts.js`), so an address is a link in
 * the mail exactly where it is one in the wallet: web addresses only with http, https or ftp --
 * never `javascript:` --, e-mail addresses looked for only BETWEEN web addresses. The link text
 * is always the address itself: nobody can put a harmless word on a link to somewhere else.
 * `HumanText.logic.test.ts` holds the patterns to the wallet's.
 */
export type HumanTextPart = { type: 'text' | 'url' | 'email'; value: string }

export const URL_PATTERN = /\b(?:https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]/gi
export const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

/**
 * Cuts `text` at every match of `pattern`: a match becomes the part `found` makes of it, what
 * lies between goes through `between`.
 */
const cut = (
  text: string,
  pattern: RegExp,
  found: (match: RegExpMatchArray) => HumanTextPart,
  between: (text: string) => HumanTextPart[],
): HumanTextPart[] => {
  const parts: HumanTextPart[] = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) {
      parts.push(...between(text.slice(last, index)))
    }
    parts.push(found(match))
    last = index + match[0].length
  }
  if (last < text.length) {
    parts.push(...between(text.slice(last)))
  }
  return parts
}

const plain = (text: string): HumanTextPart[] => [{ type: 'text', value: text }]

/** Nothing for null or undefined: a mail without a memo shows no memo, not "undefined". */
export const humanTextParts = (text: unknown): HumanTextPart[] =>
  cut(
    text === null || text === undefined ? '' : String(text),
    URL_PATTERN,
    (match) => ({ type: 'url', value: match[0] }),
    (between) =>
      cut(between, EMAIL_PATTERN, (match) => ({ type: 'email', value: match[0] }), plain),
  )
