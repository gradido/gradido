// AI-GENERATED — not an architecture reference

import { MESSAGE_MAX_CHARS } from '@/validationSchemas'

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
 * ⭐ And the words in the field that were not sent yet (Bernd, 27.09.2026: "I write a text and
 * then want to attach a file -- the text would be gone"). They are written with the note, so
 * only while the wallet is out of sight, and go with it: when the page comes back into sight,
 * the thread closes, the member signs out, or the next start takes the note. That start hands
 * them to the field of that conversation IN MEMORY (`holdChatText`), never through the address:
 * they would stand in the browser's history, where they outlive the moment they belonged to
 * (the reason useEntryDraft gives).
 *
 * ⛔ Key `chat-return:<gradidoID>` of the member signed in, never one shared key: one browser
 * serves several members (chatVideoApp). Not in the vuex store, which is written whole to
 * localStorage on every mutation.
 */
const KEY_PREFIX = 'chat-return:'

/** A note older than this is let go: the way out to another app and back takes minutes. */
export const CHAT_RETURN_MAX_AGE_MS = 60 * 60 * 1000

const keyOf = (gradidoID) => (gradidoID ? `${KEY_PREFIX}${gradidoID}` : null)

/** Words worth keeping: a field of spaces is an empty field. */
const wordsIn = (text) => (typeof text === 'string' && text.trim() !== '' ? text : '')

/**
 * @param {string | null | undefined} me the member signed in
 * @param {{ gradidoID: string, communityUuid?: string | null }} partner whom the thread is with
 * @param {string} [text] the words in the field not sent yet, as they stand there
 */
export const noteChatReturn = (me, partner, text = '') => {
  const key = keyOf(me)
  if (!key || !partner?.gradidoID) return
  const words = wordsIn(text).slice(0, MESSAGE_MAX_CHARS)
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        gradidoID: partner.gradidoID,
        communityUuid: partner.communityUuid ?? null,
        at: Date.now(),
        ...(words ? { text: words } : {}),
      }),
    )
  } catch {
    // Storage switched off, or full: a start goes to the overview, as without the note.
  }
}

/**
 * The words the start took from the note, waiting for the field of that conversation: in memory
 * only, for one thread to take. `null` while nothing waits.
 */
let held = null

const samePerson = (a, b) =>
  typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase()

/**
 * Hands the words of a note to the field of that conversation, when the start opens it.
 *
 * @param {{ gradidoID: string, text?: string }} note what `takeChatReturn` gave
 */
export const holdChatText = (note) => {
  const words = wordsIn(note?.text)
  held = words && note?.gradidoID ? { gradidoID: note.gradidoID, text: words } : null
}

/**
 * The words held for the thread with `partner`, once. Whatever thread asks, the words stop
 * waiting: they belong to the first thread after the start, and only if it is theirs.
 *
 * @param {{ gradidoID: string }} partner whom the thread is with
 * @returns {string} the words, or '' where none wait for this conversation
 */
export const takeHeldChatText = (partner) => {
  const words = held && samePerson(held.gradidoID, partner?.gradidoID) ? held.text : ''
  held = null
  return words
}

/**
 * Lets the note on this device go: the page came back into sight, or the thread closed. Words a
 * start holds in memory stay: a thread whose first page failed has not taken them yet, and the
 * next opening of that conversation will (coderabbit, PR #3999).
 *
 * @param {string | null | undefined} me the member signed in
 */
export const dropChatReturnNote = (me) => {
  const key = keyOf(me)
  if (!key) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Where nothing could be written, there is nothing to let go of.
  }
}

/**
 * Signing out: the note goes, and words held in memory with it -- the next member on this browser
 * must not find them in a field.
 *
 * @param {string | null | undefined} me the member signing out
 */
export const forgetChatReturn = (me) => {
  held = null
  dropChatReturnNote(me)
}

/**
 * Reads the note and lets it go in one, so a start comes back to it once.
 *
 * @param {string | null | undefined} me the member signed in
 * @returns {{ gradidoID: string, communityUuid: string | null, text: string } | null} whom the
 *   thread was with, and the words not sent yet ('' where there were none); null where there is
 *   no note, where it is too old, or where it is not a note at all
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
    text: wordsIn(note.text).slice(0, MESSAGE_MAX_CHARS),
  }
}
