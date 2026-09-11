// AI-GENERATED — not an architecture reference

/**
 * A memo, cut into the pieces the wallet shows: plain text, web addresses and e-mail
 * addresses -- so that the addresses can be links WITHOUT the memo ever being read as markup.
 *
 * ⛔ Why this exists: three components turned the memo into HTML (`v-html`) to make its
 * addresses clickable, and a memo is written by somebody else -- the sender of a booking. Any
 * markup it carried was built into the recipient's page as markup. Cut into parts, every
 * piece reaches the page as text or as an attribute value, and Vue escapes both.
 *
 * The two patterns are the ones those components used, unchanged, so what counted as a link
 * before still does: web addresses only with http, https or ftp -- never `javascript:` -- and
 * e-mail addresses. E-mail addresses are looked for only BETWEEN web addresses; the old code
 * ran its second pattern over its own output and could cut an address out of a link it had
 * just built.
 *
 * @param {string} text
 * @returns {{ type: 'text' | 'url' | 'email', value: string }[]}
 */
const URL_PATTERN = /\b(?:https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]/gi
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

const plain = (text) => [{ type: 'text', value: text }]

/** Cuts `text` at every match of `pattern`; what lies between goes through `between`. */
const cut = (text, pattern, type, between) => {
  const parts = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push(...between(text.slice(last, match.index)))
    parts.push({ type, value: match[0] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(...between(text.slice(last)))
  return parts
}

export const memoParts = (text) =>
  cut(text ?? '', URL_PATTERN, 'url', (between) => cut(between, EMAIL_PATTERN, 'email', plain))
