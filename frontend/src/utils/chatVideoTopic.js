// AI-GENERATED — not an architecture reference

/**
 * The topic of a video call, carried in the room's address as Jitsi's own addition to it:
 * `https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Videoanruf%22` (V4a). Jitsi reads the
 * part after `#` as settings for this one meeting and shows the subject as the meeting's title;
 * a server that does not take the setting passes over it, and the room opens all the same. The
 * room's name stays pure chance behind the server's prefix (E-035) -- the topic is not in it.
 *
 * The addition is also what will tell a receiving wallet that a link is a video invitation
 * (V4b): it is always there -- an emptied field falls back to its default (ContactWindow).
 *
 * ⚠️ Whoever has the link can read the topic in it -- the operator of the room's server too, whose
 * page reads it to show it. The hint under the field says so, and the default names nobody.
 */

/** What the field takes: the topic stands encoded in the link, and makes it long otherwise. */
export const CHAT_VIDEO_TOPIC_MAX = 40

/**
 * The five characters Jitsi rewrites between decoding the value and reading it as JSON
 * (`react/features/base/util/parseURLParams.ts`, see the spec): the first `\&` becomes `&`, the
 * curly single quotes a straight `'`, the curly double quotes a straight `"`.
 */
const REWRITTEN_BY_JITSI = /[&\u2018\u2019\u201c\u201d]/g

/** What `encodeURIComponent` leaves as it is, and the wallet's link finder cuts at (memoParts). */
const LEFT_BY_ENCODE_URI_COMPONENT = /[!'()*]/g

const unicodeEscape = (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
const percentEncoded = (character) =>
  `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`

/**
 * The time of a planned call (V5b), after the topic: two settings of Gradido's own, start and end
 * in whole seconds since 1970. Jitsi reads them as numbers (JSON) and uses neither, so the meeting
 * opens as ever. A receiving wallet reads them to offer the call to the member's calendar
 * (`chatVideoPlannedCall`) -- in the member's own time zone, whatever the sender's was.
 */
const SCHEDULE = '&gradido\\.start=(\\d{1,12})&gradido\\.end=(\\d{1,12})'

/** Whole seconds since 1970, as the address carries a time. */
const seconds = (date) => Math.floor(date.getTime() / 1000)

/**
 * The room's address with the topic added -- and, for a planned call (V5b), its time. The topic
 * comes trimmed and never empty (the field falls back to its default) -- that is the caller's to
 * see to, and not checked again here.
 *
 * @param {string} url the room, as the server hands it out (no `#` in it)
 * @param {string} topic
 * @param {{ start: Date, end: Date } | null} [when] the time of a planned call
 * @returns {string}
 */
export const withChatVideoTopic = (url, topic, when = null) => {
  // a) JSON, because Jitsi reads the value as JSON: a quote or a backslash in the topic comes out
  //    escaped. And a lone surrogate -- half an emoji, cut off by the field's length when pasted --
  //    comes out as an escape too (ES2019), so `encodeURIComponent` below does not throw on it.
  const json = JSON.stringify(topic)
  // b) The five characters Jitsi rewrites after decoding, written as `\u` escapes. An escape is
  //    plain ASCII the rewriting passes over, and JSON turns it back into the character. Without
  //    this a topic in curly quotes -- „Momo“ ends on U+201C -- becomes a straight `"` in the
  //    middle of the JSON, the JSON breaks, and Jitsi drops the title without a word. `&` is
  //    written so too: Jitsi turns `\&` into `&`, and a topic with `\&` in it would break the same way.
  const guarded = json.replace(REWRITTEN_BY_JITSI, unicodeEscape)
  // c) Percent-encoded for the address -- and `!'()*` as well, which `encodeURIComponent` leaves
  //    as they are: the link finder (memoParts' URL_PATTERN) ends a link at `'()*`, and the whole
  //    address has to stay one link, in the thread as in the mail. The value always ends on
  //    `%22`, the JSON's closing quote -- a character a link may end with.
  const value = encodeURIComponent(guarded).replace(LEFT_BY_ENCODE_URI_COMPONENT, percentEncoded)
  const time = when ? `&gradido.start=${seconds(when.start)}&gradido.end=${seconds(when.end)}` : ''
  return `${url}#config.subject=${value}${time}`
}

/**
 * ⛔ Exactly one `#`, and what follows it is `config.subject=` and a value without `&` and without
 * `#` -- the addition `withChatVideoTopic` makes and nothing else --, with or without the time of a
 * planned call after it (V5b). A `#` that comes earlier, another setting, anything after the value:
 * the address is somebody else's, and stays whole.
 */
const OWN_ADDITION = new RegExp(`^([^#]*)#config\\.subject=([^&#]*)(?:${SCHEDULE})?$`)

/**
 * The address as the thread SHOWS it: without the topic's encoded addition, which reads as
 * `%22Gespr%C3%A4ch%20%C3%BCber%20B%C3%A4ume%22` and says nothing to anybody -- the invitation
 * names the topic in words above it. The link itself keeps the whole address. Every other address
 * comes back as it is.
 *
 * @param {string} url
 * @returns {string}
 */
export const withoutChatVideoTopic = (url) => url.replace(OWN_ADDITION, '$1')

/**
 * What an address of Gradido's own form carries (V4a, V5b): the room, the topic, and for a planned
 * call its start and end. null for every other address -- another setting, a value that is no
 * JSON string, an end not after its start.
 *
 * @param {string} url
 * @returns {{ room: string, topic: string, start: Date | null, end: Date | null } | null}
 */
export const readChatVideoAddition = (url) => {
  const own = OWN_ADDITION.exec(url)
  if (!own) return null
  const [, room, value, start, end] = own
  let topic
  try {
    topic = JSON.parse(decodeURIComponent(value))
  } catch {
    return null
  }
  if (typeof topic !== 'string') return null
  if (!start) return { room, topic, start: null, end: null }
  if (Number(end) <= Number(start)) return null
  return { room, topic, start: new Date(Number(start) * 1000), end: new Date(Number(end) * 1000) }
}
