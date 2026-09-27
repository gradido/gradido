// AI-GENERATED — not an architecture reference

/**
 * The conversation to come back to (Bernd, 27.09.2026). The wallet on an iPhone's home screen
 * starts over whenever iOS wants its memory for another app -- SwissTransfer's for an upload,
 * Jitsi's for a call -- and a start with the session still running goes on to the overview
 * (routes/guards.js). But the member was in a conversation, and the link from SwissTransfer
 * belongs there.
 *
 * So while a thread is open, the wallet notes on this device WHOM it is with as the page goes out
 * of sight, and lets the note go when the page comes back into sight or the thread closes. A note
 * that is still there when the wallet starts was left by a wallet that did not come back: the
 * start opens that conversation again (`/contacts?with=`, P4c).
 *
 * ⛔ Whom, never what: the words in the field are not written to this device. They are the
 * member's own, for the reason useEntryDraft gives, and a restart loses them.
 *
 * ⛔ Key `chat-return:<gradidoID>` of the member signed in, never one shared key: one browser
 * serves several members (chatVideoApp). Not in the vuex store, which is written whole to
 * localStorage on every mutation.
 */
const KEY_PREFIX = 'chat-return:'

/** A note older than this is let go: the way out to another app and back takes minutes. */
export const CHAT_RETURN_MAX_AGE_MS = 60 * 60 * 1000

const keyOf = (gradidoID) => (gradidoID ? `${KEY_PREFIX}${gradidoID}` : null)

/**
 * @param {string | null | undefined} me the member signed in
 * @param {{ gradidoID: string, communityUuid?: string | null }} partner whom the thread is with
 */
export const noteChatReturn = (me, partner) => {
  const key = keyOf(me)
  if (!key || !partner?.gradidoID) return
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        gradidoID: partner.gradidoID,
        communityUuid: partner.communityUuid ?? null,
        at: Date.now(),
      }),
    )
  } catch {
    // Storage switched off, or full: a start goes to the overview, as without the note.
  }
}

/** @param {string | null | undefined} me the member signed in */
export const forgetChatReturn = (me) => {
  const key = keyOf(me)
  if (!key) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Where nothing could be written, there is nothing to let go of.
  }
}

/**
 * Reads the note and lets it go in one, so a start comes back to it once.
 *
 * @param {string | null | undefined} me the member signed in
 * @returns {{ gradidoID: string, communityUuid: string | null } | null} whom the thread was with;
 *   null where there is no note, where it is too old, or where it is not a note at all
 */
export const takeChatReturn = (me) => {
  const key = keyOf(me)
  if (!key) return null
  let raw
  try {
    raw = window.localStorage.getItem(key)
    window.localStorage.removeItem(key)
  } catch {
    return null
  }
  let note
  try {
    note = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof note?.gradidoID !== 'string' || note.gradidoID === '') return null
  if (typeof note.at !== 'number' || !(Date.now() - note.at <= CHAT_RETURN_MAX_AGE_MS)) return null
  const community = note.communityUuid
  return {
    gradidoID: note.gradidoID,
    communityUuid: typeof community === 'string' && community !== '' ? community : null,
  }
}
