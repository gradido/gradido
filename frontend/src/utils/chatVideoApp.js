// AI-GENERATED — not an architecture reference
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

/**
 * A video call's second way on a computer (V4b): the same room in the Jitsi app for the desktop
 * (jitsi/jitsi-meet-electron), which takes `jitsi-meet://<server>/<room>` and opens that room on
 * that server. It stands beside the way into the browser, never instead of it: a box by the call's
 * start button chooses it, and the box keeps what it was left at (Bernd, 26.09.2026) -- a switch
 * where it is used, remembered on the device (E-020), as the right-hand column's is.
 *
 * Whether the app is installed, no page can learn -- browsers keep it from pages on purpose
 * (Notiz §12). Without it the app's address does nothing, or shows the browser's own error; the
 * invitation in the thread still carries the room for the browser.
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
 * ⚠️ The app as released in 2026.8.0 drops the addition, and the topic with it, when a link starts
 * it: its list of recent rooms cuts `?…` and `#…` off the room of the very object it then opens
 * the meeting with (read in the installed app, 26.09.2026). The meeting shows the room's name
 * instead. Fixed in jitsi-meet-electron d30d2f0bdb (17.08.2026), not yet in a release on
 * 26.09.2026. The address stays as it is: the next release takes it, and a link that reaches the
 * app while a meeting is open in it goes past that list and keeps the topic already.
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

/**
 * The box "Start in the Jitsi app" by the call's start button: ticked, a call goes into the app,
 * and the box keeps what it was left at -- for the member, on this device.
 *
 * ⛔ Key `chat-video-in-app:<gradidoID>`, never one shared key: one browser serves several members,
 * and the next one would find the previous one's choice. Without the id (before the login answer,
 * after signing out) nothing is read and nothing written -- the box starts empty, and a tick made
 * then holds for that call only.
 *
 * ⛔ Not in the vuex store: `createPersistedState` writes the whole store to localStorage on every
 * mutation (useRightSidePref).
 */
const IN_APP_KEY_PREFIX = 'chat-video-in-app:'

const inAppKey = (gradidoID) => (gradidoID ? `${IN_APP_KEY_PREFIX}${gradidoID}` : null)

/**
 * @param {string | null | undefined} gradidoID the member signed in
 * @returns {boolean} whether the member left the box ticked on this device
 */
export const readChatVideoInApp = (gradidoID) => {
  const key = inAppKey(gradidoID)
  if (!key) return false
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    // Storage switched off: the box starts empty, and the call goes the browser's way.
    return false
  }
}

/**
 * @param {string | null | undefined} gradidoID the member signed in
 * @param {boolean} inApp whether the box is ticked now
 */
export const rememberChatVideoInApp = (gradidoID, inApp) => {
  const key = inAppKey(gradidoID)
  if (!key) return
  try {
    if (inApp) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch {
    // Storage switched off, or full: the box does what it says for this call, only it is not
    // remembered.
  }
}

/**
 * The room handed to the Jitsi app: the page follows a link to the app's address, and the browser
 * passes it on to the app -- in Chrome after asking, until it is told to always allow it. The page
 * itself stays: an app's address loads nothing into it. Where no app takes the address, Chrome
 * does nothing at all -- no question, no message (measured 26.09.2026); `watchJitsiAppOpening`
 * is what notices.
 *
 * A link of its own rather than `location`, so that it goes the way a click on a link goes.
 *
 * @param {string} appUrl the address from `chatVideoAppUrl`
 */
export const openInJitsiApp = (appUrl) => {
  const link = document.createElement('a')
  link.href = appUrl
  link.click()
}

/** How long the question waits for the sign that the app came up. */
export const JITSI_APP_WAIT_MS = 3000

/**
 * Whether the Jitsi app came up after the room was handed to it: it takes the focus from the
 * browser's window (`blur`), or the page is hidden behind it. Neither within `wait`: `onMissed`.
 * A sign, not a proof -- whether an app is installed stays hidden from a page (Notiz §12).
 *
 * Where the page does not have the focus when the room is handed over, no sign can come, and the
 * app is taken to have come up: `onOpened` at once.
 *
 * @param {{ onOpened: () => void, onMissed: () => void, wait?: number }} handlers
 * @returns {() => void} stops watching; nothing is called after it
 */
export const watchJitsiAppOpening = ({ onOpened, onMissed, wait = JITSI_APP_WAIT_MS }) => {
  if (!document.hasFocus()) {
    onOpened()
    return () => {}
  }
  let timer = null
  const stop = () => {
    clearTimeout(timer)
    window.removeEventListener('blur', left)
    document.removeEventListener('visibilitychange', hidden)
  }
  function left() {
    stop()
    onOpened()
  }
  function hidden() {
    if (document.visibilityState === 'hidden') left()
  }
  window.addEventListener('blur', left)
  document.addEventListener('visibilitychange', hidden)
  timer = setTimeout(() => {
    stop()
    onMissed()
  }, wait)
  return stop
}

/** Where the Jitsi app is to be had: Jitsi's own page of downloads. */
export const JITSI_APP_DOWNLOADS = 'https://jitsi.org/downloads/'

/**
 * Where the thread hands a click on a video invitation's link (V4b): the contact window provides
 * the question "Join call", with the same box, and the link calls it instead of opening the room
 * straight away. Without a provider the link stays a plain link.
 */
export const CHAT_VIDEO_JOIN = Symbol('chatVideoJoin')
