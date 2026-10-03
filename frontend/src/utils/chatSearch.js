// AI-GENERATED — not an architecture reference

/**
 * The search in a conversation's thread (Bernd, 30.09.2026, E-057): on the device, over what the
 * thread holds -- older pages are loaded for it --, in the messages' words, subjects and captions
 * and in the transfers' memos. The words searched for never leave the device.
 *
 * Compared as a reader expects: without regard to case, and without regard to accents -- "cafe"
 * finds "Café", "gruße" finds "Grüße". A letter stands for itself otherwise: "ss" does not find
 * "ß", and "ue" does not find "ü".
 */

/** What the thread provides to the words of its bubbles: the needle, '' while nothing is searched. */
export const CHAT_SEARCH = Symbol('chatSearch')

/** Fewer letters than this search nothing: a single letter stands in nearly every message. */
export const CHAT_SEARCH_MIN = 2

/**
 * How many messages the search reads at most, older pages loaded for it (Bernd: "bis zu etwa 1000
 * je Gespräch"). Twenty pages of the thread's fifty.
 */
export const CHAT_SEARCH_MAX_MESSAGES = 1000

/** One piece of text as the search compares it: decomposed, without its marks, in lower case. */
const fold = (piece) => piece.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * The text as the search compares it, and for every character of that where it came from in the
 * text: the start and the end of the character (a code point, so an emoji is one) it stems from.
 */
const folded = (text) => {
  let out = ''
  const from = []
  const to = []
  let index = 0
  for (const character of text) {
    const piece = fold(character)
    out += piece
    for (let k = 0; k < piece.length; k += 1) {
      from.push(index)
      to.push(index + character.length)
    }
    // A mark on its own (an accent written as a character of its own) folds to nothing: it
    // belongs to the letter before it, so a hit ending on that letter takes the mark with it
    // rather than cut the letter from its accent.
    if (!piece.length && to.length) to[to.length - 1] = index + character.length
    index += character.length
  }
  return { out, from, to }
}

/**
 * The needle for what was typed: folded and trimmed, or '' where it is shorter than
 * `CHAT_SEARCH_MIN` -- then nothing is searched.
 *
 * @param {string} typed
 * @returns {string}
 */
export const chatSearchNeedle = (typed) => {
  const needle = fold(String(typed ?? '').trim())
  return needle.length >= CHAT_SEARCH_MIN ? needle : ''
}

/**
 * Where a needle stands in a text: `[start, end)` in the text's own indices, left to right, one
 * after another and never overlapping. None for an empty needle or text.
 *
 * @param {string} text
 * @param {string} needle as `chatSearchNeedle` makes it
 * @returns {Array<[number, number]>}
 */
export const chatSearchRanges = (text, needle) => {
  if (!needle || !text) return []
  const { out, from, to } = folded(text)
  const ranges = []
  let at = out.indexOf(needle)
  while (at !== -1) {
    ranges.push([from[at], to[at + needle.length - 1]])
    at = out.indexOf(needle, at + needle.length)
  }
  return ranges
}

/**
 * A text cut at the needle: the pieces in order, each `{ text, hit }`. The whole text as one piece
 * that is no hit where the needle is not in it.
 *
 * @param {string} text
 * @param {string} needle
 * @returns {Array<{ text: string, hit: boolean }>}
 */
export const chatSearchPieces = (text, needle) => {
  const ranges = chatSearchRanges(text, needle)
  if (!ranges.length) return [{ text, hit: false }]
  const pieces = []
  let at = 0
  for (const [start, end] of ranges) {
    if (start > at) pieces.push({ text: text.slice(at, start), hit: false })
    pieces.push({ text: text.slice(start, end), hit: true })
    at = end
  }
  if (at < text.length) pieces.push({ text: text.slice(at), hit: false })
  return pieces
}

/**
 * Whether a thread's item holds the needle: a message in its subject or its words (a picture's
 * caption is its words), a transfer in the words over it or its memo.
 *
 * @param {{ subject?: string | null, body?: string | null }} item
 * @param {string} needle
 * @returns {boolean}
 */
export const chatSearchHolds = (item, needle) =>
  Boolean(needle) &&
  (chatSearchRanges(item.subject ?? '', needle).length > 0 ||
    chatSearchRanges(item.body ?? '', needle).length > 0)
