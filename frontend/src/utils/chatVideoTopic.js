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
 * The room's address with the topic added. The topic comes trimmed and never empty (the field
 * falls back to its default) -- that is the caller's to see to, and not checked again here.
 *
 * @param {string} url the room, as the server hands it out (no `#` in it)
 * @param {string} topic
 * @returns {string}
 */
export const withChatVideoTopic = (url, topic) => {
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
  return `${url}#config.subject=${value}`
}

/**
 * ⛔ Exactly one `#`, and what follows it is `config.subject=` and a value without `&` and without
 * `#` -- the addition `withChatVideoTopic` makes and nothing else. A `#` that comes earlier, a
 * second setting, anything after the value: the address is somebody else's, and stays whole.
 */
const OWN_ADDITION = /^([^#]*)#config\.subject=[^&#]*$/

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
