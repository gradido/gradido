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
 * The two patterns are the ones those components used, so what counted as a link before
 * still does: web addresses only with http, https or ftp -- never `javascript:` -- and e-mail
 * addresses. One correction: the old e-mail pattern wrote its ending as `[A-Z|a-z]`, which
 * lets a `|` in, so `user@example.c|m` became a mail link (coderabbit, #3884). E-mail
 * addresses are looked for only BETWEEN web addresses; the old code ran its second pattern
 * over its own output and could cut an address out of a link it had just built.
 *
 * @param {string} text
 * @returns {{ type: 'text' | 'url' | 'email', value: string }[]}
 */
const URL_PATTERN = /\b(?:https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]/gi
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

// EMAIL_PATTERN in its two halves, taken from the pattern itself, so that there is still one
// rule to change: a sign that may stand before the `@`, and the `@` with all that follows it --
// that half tried at one given place (`y`), not looked for.
const AT = EMAIL_PATTERN.source.indexOf(']+@') + 2
const EMAIL_SIGN = new RegExp(EMAIL_PATTERN.source.slice(2, AT - 1))
const EMAIL_FROM_AT = new RegExp(EMAIL_PATTERN.source.slice(AT), 'y')

/** Whether a word begins or ends at `at`: the pattern's `\b`. */
const wordEdge = (text, at) => /\w/.test(text[at - 1] ?? '') !== /\w/.test(text[at] ?? '')

/**
 * `text` cut at its e-mail addresses: every match of EMAIL_PATTERN, as `matchAll` gives them,
 * found without trying the pattern at every sign.
 *
 * ⚠️ Tried at every sign, the pattern reads a run of letters and dots to its end from each
 * place a word begins or ends in it, to find that no `@` follows: "a.a.a. …" took the square of
 * its length, 26 ms for the 5000 characters a chat message may have (the second reader,
 * 12.10.2026) -- for every wallet that shows it. Whatever place of a run a match starts at, it
 * needs the same: the `@` behind the run, and what the pattern asks for behind that. So the run
 * is read once, and that is asked once; where it holds, the match starts at the run's first
 * word edge, which is where the pattern, going from left to right, would have found it.
 */
const cutAtEmails = (text) => {
  const parts = []
  let last = 0
  let at = 0
  while (at < text.length) {
    if (!EMAIL_SIGN.test(text[at])) {
      at += 1
      continue
    }
    let end = at + 1
    while (end < text.length && EMAIL_SIGN.test(text[end])) end += 1
    let start = at
    while (start < end && !wordEdge(text, start)) start += 1
    EMAIL_FROM_AT.lastIndex = end
    const rest = start < end ? EMAIL_FROM_AT.exec(text) : null
    if (!rest) {
      at = end
      continue
    }
    if (start > last) parts.push({ type: 'text', value: text.slice(last, start) })
    last = end + rest[0].length
    parts.push({ type: 'email', value: text.slice(start, last) })
    at = last
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

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

export const memoParts = (text) => cut(text ?? '', URL_PATTERN, 'url', cutAtEmails)
