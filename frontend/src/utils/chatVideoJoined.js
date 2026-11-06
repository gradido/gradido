// AI-GENERATED — not an architecture reference
import { reactive } from 'vue'
import { withoutChatVideoTopic } from '@/utils/chatVideoTopic'
import { THANKS_NUDGE_HOLDS_MS } from '@/utils/thanksNudge'

/**
 * Which video invitations of others the member went into the room of from this wallet, and when
 * (E-043 C, Bernd 05.11.2026): a click on the link of the invitation in the thread -- on a phone
 * the link itself, on a computer "Anruf beitreten" in the question it asks, anywhere a click with
 * a key held. Half an hour after that click the line "Möchtest Du Dich bei … für das Gespräch
 * bedanken?" stands under that invitation too (utils/thanksNudge, `callNudgeStart`).
 *
 * ⛔ The invitation, never the room (Bernd, 06.11.2026): the room's address is the call's secret
 * -- whoever has it can join -- and goes into no storage (ChatVideoCall). The device keeps the
 * invitation's message uuid and the time of the click, nothing that leads into a room. A click
 * knows only its link: the window asks its thread which invitation carries that room
 * (`chatVideoRoomOf`), and notes that one.
 *
 * - The first click counts (Festlegung 1): a second click into the same invitation's room does
 *   not move the time -- else every look into the room after the call would push the line further
 *   out. A call duplicated for the next week is a message of its own (E-058), with a click of its
 *   own.
 * - Seven days, as the line holds (THANKS_NUDGE_HOLDS_MS): an older click counts as none, and
 *   goes when the next one is written.
 * - ⛔ Key `chat-video-joined:<gradidoID>`, never one without the member: one browser serves
 *   several members (chatVideoApp, useThanksNudges). Without the member nothing is read or written.
 * - ⛔ Not in the store (store.js writes the whole store to localStorage on every change), not in
 *   the address, not in `history.state`.
 * - Signing out takes nothing off the device, as for "Nicht jetzt" (useThanksNudges): a session
 *   runs out after ten minutes without a request, and the line must not go with it.
 */
const KEY_PREFIX = 'chat-video-joined:'

const storageKey = (gradidoID) => (gradidoID ? `${KEY_PREFIX}${gradidoID}` : null)

/** A message uuid as it is kept: in lower case, as the server compares them. '' for none. */
const idOf = (messageUuid) => (messageUuid ? String(messageUuid).toLowerCase() : '')

/**
 * What this page noted, by key: `{ entries, unwritten }`. Set anew with every note, and read by
 * `videoJoinedAt` -- so whatever is drawn from it follows a note at once, not only at its next
 * minute. Where the device would not keep a note (`unwritten`: storage switched off, or full),
 * this holds it for as long as the page stands; else what the device keeps is what counts.
 */
const page = reactive(new Map())

/** What the device keeps under a key: uuid → milliseconds. Nothing where it cannot be read. */
const kept = (key) => {
  try {
    const read = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    return read && typeof read === 'object' && !Array.isArray(read) ? read : {}
  } catch {
    // Storage switched off, or what stands there is no list of ours: nothing kept.
    return {}
  }
}

/** The invitations noted under a key, by uuid: what the device keeps, and what it would not. */
const noted = (key) => {
  const here = page.get(key)
  return here?.unwritten ? { ...kept(key), ...here.entries } : kept(key)
}

/** Whether a click at `at` still counts at `now`: within the seven days, and a time at all. */
const counts = (at, now) => Number.isFinite(at) && now - at <= THANKS_NUDGE_HOLDS_MS

/**
 * The room a link leads into, as a click and an invitation are compared by it: the address
 * without Gradido's addition (the topic, and for a planned call its time, withoutChatVideoTopic),
 * in lower case. An invitation's `room` carries no addition and comes back as it is, in lower case.
 *
 * @param {string} url
 * @returns {string}
 */
export const chatVideoRoomOf = (url) => withoutChatVideoTopic(String(url ?? '')).toLowerCase()

/**
 * The member went into the room of an invitation from this wallet, now. The first click counts;
 * clicks older than seven days go as this one is written. Nothing without the member or without
 * the invitation.
 *
 * @param {string | null | undefined} gradidoID the member signed in
 * @param {string | null | undefined} messageUuid the invitation whose room it was
 * @param {number} [now] milliseconds
 */
export const noteChatVideoJoined = (gradidoID, messageUuid, now = Date.now()) => {
  const key = storageKey(gradidoID)
  const id = idOf(messageUuid)
  if (!key || !id) return
  const entries = Object.fromEntries(Object.entries(noted(key)).filter(([, at]) => counts(at, now)))
  if (entries[id] !== undefined) return
  entries[id] = now
  let unwritten = false
  try {
    window.localStorage.setItem(key, JSON.stringify(entries))
  } catch {
    // Storage switched off, or full: this page holds the click while it stands.
    unwritten = true
  }
  page.set(key, { entries, unwritten })
}

/**
 * When the member went into the room of an invitation from this wallet: the time of the first
 * click, in milliseconds -- null where there was none on this device, or none within the seven
 * days, and where nobody is signed in.
 *
 * @param {string | null | undefined} gradidoID the member signed in
 * @param {string | null | undefined} messageUuid the invitation
 * @param {number} [now] milliseconds
 * @returns {number | null}
 */
export const videoJoinedAt = (gradidoID, messageUuid, now = Date.now()) => {
  const key = storageKey(gradidoID)
  const id = idOf(messageUuid)
  if (!key || !id) return null
  const at = noted(key)[id]
  return counts(at, now) ? at : null
}
