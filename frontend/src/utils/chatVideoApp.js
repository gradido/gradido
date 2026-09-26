// AI-GENERATED — not an architecture reference
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

/**
 * A video call's second way on a computer (V4b): the same room in the Jitsi app for the desktop
 * (jitsi/jitsi-meet-electron), which takes `jitsi-meet://<server>/<room>` and opens that room on
 * that server. It stands beside the way into the browser, never instead of it. No setting and
 * nothing remembered: whoever clicks chooses, where the call is opened (E-020).
 *
 * Whether the app is installed, no page can learn -- browsers keep it from pages on purpose
 * (Notiz §12). Without it a click on the app's link does nothing, or shows the browser's own
 * error, and the link into the browser stands right beside it.
 */

/**
 * ⛔ An invitation of our own and nothing else: the room as the server hands it out (V1: `https`,
 * the server, its path, the room; no `?`), and after its one `#` exactly the addition V4a makes --
 * `config.subject=` and a value without `&` and without `#`, the rule the thread shortens the
 * address by (`withoutChatVideoTopic`). A `#` before it, a second setting, `http`, a query:
 * somebody else's address, and it gets no second way.
 *
 * The path has to end on a room: the app takes what follows its LAST `/` as the room. With only the
 * addition after it the app shows the server's front page instead of a room, and with no `/` at all
 * it takes the whole as a room name on its own default server (meet.jit.si, unless changed in its
 * settings) -- not on the server the link names.
 */
const OWN_INVITATION = /^https:\/\/([^/?#]+)(\/[^?#]*[^/?#])#config\.subject=([^&#]*)$/

/**
 * The two curly double quotes, made straight for the app.
 *
 * ⚠️ In the browser the topic keeps them: V4a writes them as `\u` escapes, which Jitsi's page
 * passes over. The app does not pass that on. It reads the addition and hands the topic to its
 * bundled copy of Jitsi's external API (`external_api.js`), which writes it into the address of
 * the meeting it embeds anew, as `encodeURIComponent(JSON.stringify(topic))` -- the curly quotes as
 * they are. Jitsi's page turns them into a straight `"` before it reads the JSON
 * (`parseURLParams.ts`, see chatVideoTopic), the JSON breaks, and the meeting goes without its
 * title: „Momo“ ends on U+201C. Made straight here, they leave the JSON escaped, and the app shows
 * „Momo" with a straight closing quote. The single curly quotes the page turns into `'`, which
 * breaks nothing.
 */
const CURLY_DOUBLE_QUOTES = /[\u201c\u201d]/g

/**
 * The address for the Jitsi app, for an invitation of our own; `null` for every other address.
 * Server and path are the invitation's, character for character -- nothing is made up, looked up
 * or put right -- and the topic goes on in the same addition the browser's address carries
 * (`withChatVideoTopic`).
 *
 * @param {string} url an address as the thread found it (chatTextParts)
 * @returns {string | null}
 */
export const chatVideoAppUrl = (url) => {
  const own = OWN_INVITATION.exec(url)
  if (!own) return null
  const [, server, path, value] = own
  let topic
  try {
    topic = JSON.parse(decodeURIComponent(value))
  } catch {
    // No valid percent-encoding, or no JSON: not the addition V4a makes.
    return null
  }
  if (typeof topic !== 'string') return null
  return withChatVideoTopic(
    `jitsi-meet://${server}${path}`,
    topic.replace(CURLY_DOUBLE_QUOTES, '"'),
  )
}

/** A computer's pointer: a mouse or a touchpad, which can hover. */
const FINE_POINTER_THAT_HOVERS = '(pointer: fine) and (hover: hover)'
/** What a browser on a phone or a tablet says of itself, whatever its pointer. */
const PHONE_OR_TABLET = /Android|iPhone|iPad/

/**
 * Whether to offer the second way on this device: a computer, with a mouse or a touchpad. The app
 * is one for the desktop; on a phone and a tablet Jitsi's own page offers its app, and nothing
 * changes there.
 *
 * ⛔ No where `matchMedia` is missing -- the safe side: then only the second way is missing. No
 * where the browser names a phone or a tablet, whatever its pointer: an Android phone with a
 * mouse is still no computer the app runs on. And no for a "Macintosh" with points to touch:
 * Safari on an iPad has called itself a Mac since iPadOS 13 (Notiz §12, question 1).
 *
 * Read at every call, with nobody listening and nothing kept: the kind of pointer hardly ever
 * changes within a session, and the next drawing follows it.
 *
 * @returns {boolean}
 */
export const offersJitsiApp = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  const userAgent = window.navigator?.userAgent ?? ''
  if (PHONE_OR_TABLET.test(userAgent)) return false
  if (userAgent.includes('Macintosh') && (window.navigator?.maxTouchPoints ?? 0) > 0) return false
  return window.matchMedia(FINE_POINTER_THAT_HOVERS)?.matches === true
}
