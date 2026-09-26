// AI-GENERATED — not an architecture reference
import { memoParts } from '@/utils/memoParts'

/**
 * A chat message, cut into the pieces the thread shows: plain text, bold runs, web addresses
 * and e-mail addresses (E-015).
 *
 * ⛔ The text is written by the OTHER side of the conversation, and none of it may reach the
 * page as markup. Every piece goes out as text or as an attribute value, both of which Vue
 * escapes -- the reason memoParts exists, and it finds the addresses here too, so a link in a
 * chat is exactly what a link in a memo is.
 *
 * `**…**` is bold, and it is looked for only in the stretches of plain text memoParts leaves
 * between the addresses: a pair of stars never reaches across a link, so `**https://x.org**`
 * stays a link with two stars on either side of it. A star without its partner stays a star.
 * The pattern is the one the moderator thread uses (ParseMessage.vue): across line breaks,
 * the shortest run -- so a message reads the same wherever it is shown. What differs is how
 * the run gets there: a piece of its own here, never a `<strong>` spliced into escaped HTML.
 *
 * @param {string} text
 * @returns {{ type: 'text' | 'bold' | 'url' | 'email', value: string }[]}
 */
const BOLD_PATTERN = /\*\*([\s\S]+?)\*\*/g

/** One stretch of plain text, cut at its bold runs; the stars themselves are dropped. */
const boldParts = (text) => {
  const parts = []
  let last = 0
  for (const match of text.matchAll(BOLD_PATTERN)) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
    parts.push({ type: 'bold', value: match[1] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

export const chatTextParts = (text) =>
  memoParts(text).flatMap((part) => (part.type === 'text' ? boldParts(part.value) : [part]))
