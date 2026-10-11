// AI-GENERATED — not an architecture reference

import { MESSAGE_MAX_CHARS } from '@/validationSchemas'

/**
 * What a member has written in a conversation and not sent yet (Bernd, 11.10.2026, after a
 * tester's report: "I write something in the chat or attach a picture, click beside the chat
 * window, go to Matching and come back -- everything I had entered is gone").
 *
 * The bar to write in is made with its window and gone with it (the windows are `lazy`), so
 * whatever stood in it went with every closing. Here it waits instead, one draft a conversation:
 * the words, the picture chosen with what was done to it in the editor, and the box where the
 * member set it themselves. The next bar for that conversation -- in the contact window, in a
 * group's window, in the profile window of the map -- begins with it (ChatComposeBar).
 *
 * ⭐ The words lie on this device (Bernd's choice among three, 11.10.2026: they are to outlast a
 * reload, a closed tab and a session that ran out): `chat-drafts:<gradidoID>` in localStorage,
 * by conversation, each with the time it was last written. What cannot lie there waits in
 * memory, for as long as the wallet runs in this tab: the picture -- a chat picture is never put
 * into the device's storage (E-041, point 5) -- and the box. Not in the vuex store, which is
 * written whole to localStorage on every mutation.
 *
 * ⛔ A draft belongs to the member who wrote it. One browser serves several members, and signing
 * out does not reload the page.
 * - The key names the member, and a draft is read and written only while that member is signed
 *   in -- a bar still stands for a moment after the idle timeout signed its member out.
 * - Signing out by the member's own word ("Abmelden") takes their words off the device. A session
 *   that ran out leaves them there: whoever signs in again finds what they had written. What
 *   waits in memory goes with every sign-out (store.js).
 * - Words not touched for fourteen days are let go, whoever's they are, with the next sign-in or
 *   sign-out on this device: a member who does not come back to a shared computer must not leave
 *   them there for good.
 * - Thirty conversations at most keep words on the device, the ones written in last.
 */
const KEY_PREFIX = 'chat-drafts:'

/** Words nobody touched for this long are let go. */
export const CHAT_DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

/** How many conversations of one member keep their words on the device: the ones written in last. */
export const CHAT_DRAFTS_KEPT_ON_DEVICE = 30

/**
 * How many conversations keep a picture that waits: the ones written in last. A picture waits as
 * it was chosen, whole -- a photo of some megabytes each --, and a phone has little room for a
 * pile of them. An older draft keeps its words.
 */
export const CHAT_DRAFT_PICTURES_KEPT = 3

/**
 * What waits in memory, by place -- the member and the conversation --, the one written in last at
 * the end: `{ words, picture, alsoByEmail }`. `words` only where the device did not take them
 * (storage switched off, or full): then memory says what they are, an emptied field included.
 * Null where it took them: then the device says. (What the device took before it refused, it
 * still holds: once memory is gone, that older state is what comes back.)
 */
const waiting = new Map()

/** Words worth keeping: a field of spaces is an empty field. */
const wordsIn = (text) => (typeof text === 'string' && text.trim() !== '' ? text : '')

const memberOf = (gradidoID) => (typeof gradidoID === 'string' ? gradidoID.toLowerCase() : '')

const keyOf = (owner) => `${KEY_PREFIX}${owner}`

/**
 * A member's words on this device, by conversation: `{ [thread]: { text, at } }` -- only what is
 * still a draft: words, and not older than fourteen days. Null where the storage cannot be read.
 */
const wordsOnDevice = (owner) => {
  let raw
  try {
    raw = window.localStorage.getItem(keyOf(owner))
  } catch {
    return null
  }
  let all
  try {
    all = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!all || typeof all !== 'object' || Array.isArray(all)) return {}
  const now = Date.now()
  const fresh = {}
  for (const [thread, entry] of Object.entries(all)) {
    const words = wordsIn(entry?.text).slice(0, MESSAGE_MAX_CHARS)
    if (!words || typeof entry.at !== 'number') continue
    // A time ahead of this device's clock -- written while the clock was wrong -- counts as now:
    // such words would never grow old, and would stand before everything written since.
    const at = Math.min(entry.at, now)
    if (now - at <= CHAT_DRAFT_MAX_AGE_MS) fresh[thread] = { text: words, at }
  }
  return fresh
}

/** Writes a member's words to the device, the ones written in last; says whether it took them. */
const writeToDevice = (owner, all) => {
  const kept = Object.entries(all)
    .sort(([, one], [, other]) => other.at - one.at)
    .slice(0, CHAT_DRAFTS_KEPT_ON_DEVICE)
  try {
    if (kept.length === 0) window.localStorage.removeItem(keyOf(owner))
    else window.localStorage.setItem(keyOf(owner), JSON.stringify(Object.fromEntries(kept)))
    return true
  } catch {
    return false
  }
}

/**
 * Puts the words of one conversation on the device, or takes them off it where there are none.
 * True where the device holds them now as they are.
 */
const wordsToDevice = (owner, thread, words) => {
  const all = wordsOnDevice(owner)
  if (all === null) return false
  delete all[thread]
  if (!words) return writeToDevice(owner, all)
  // Before the others: among words of the same moment the ones written now are the ones kept.
  return writeToDevice(owner, { [thread]: { text: words, at: Date.now() }, ...all })
}

/** Lets the pictures of the drafts written in longest ago go, down to the number kept. */
const letOldPicturesGo = () => {
  const withPicture = [...waiting].filter(([, draft]) => draft.picture)
  const tooMany = withPicture.length - CHAT_DRAFT_PICTURES_KEPT
  // The rest of the draft stays as it waits: the box, and the words where memory holds them.
  for (const [place, draft] of withPicture.slice(0, Math.max(0, tooMany))) {
    waiting.set(place, { ...draft, picture: null })
  }
}

/**
 * The draft of one conversation, for the bar that writes in it.
 *
 * @param {() => string | null | undefined} signedIn who is signed in at the moment it is asked --
 *   asked anew with every reading and writing, never remembered
 * @param {string} thread the conversation, by the one name every window gives it: a person by
 *   the pair (`chatMemberKey`), a group by `chatGroupDraftKey`. Without one nothing is kept.
 * @returns {{ read: () => ({ text: string, picture: object | null, alsoByEmail: boolean | null }
 *   | null), keep: (draft?: { text?: string, picture?: object | null, alsoByEmail?: boolean |
 *   null }) => void }}
 *   `read`: what waits, or null. `keep`: what stands in the bar now, in place of what waited --
 *   the words as typed, the picture as the bar holds it (`{ source, edit }`), and the box only
 *   where the member set it themselves (else null). Nothing left of it: the draft is gone.
 */
export const chatDraftFor = (signedIn, thread) => {
  const owner = memberOf(signedIn())
  const place = owner && thread ? `${owner}\n${thread}` : null
  const stillTheirs = () => place !== null && memberOf(signedIn()) === owner

  return {
    read: () => {
      if (!stillTheirs()) return null
      const here = waiting.get(place) ?? null
      // The device says what the words are -- another tab of this member may have sent them, or
      // written on --, unless it did not take them: then memory says, an emptied field included.
      const text = here?.words ?? wordsOnDevice(owner)?.[thread]?.text ?? ''
      const picture = here?.picture ?? null
      if (!text && !picture) return null
      return { text, picture, alsoByEmail: here?.alsoByEmail ?? null }
    },
    keep: ({ text = '', picture = null, alsoByEmail = null } = {}) => {
      if (!stillTheirs()) return
      const words = wordsIn(text).slice(0, MESSAGE_MAX_CHARS)
      const onDevice = wordsToDevice(owner, thread, words)
      // Taken out first, so what is kept below stands at the end: the one written in last.
      waiting.delete(place)
      waiting.set(place, {
        words: onDevice ? null : words,
        picture,
        alsoByEmail: typeof alsoByEmail === 'boolean' ? alsoByEmail : null,
      })
      letOldPicturesGo()
    },
  }
}

/** The name a group's conversation has among the drafts; a person's is the pair (`chatMemberKey`). */
export const chatGroupDraftKey = (groupUuid) =>
  groupUuid ? `group/${String(groupUuid).toLowerCase()}` : ''

/**
 * Every member's words on this device that nobody touched for fourteen days are let go. With
 * every sign-in and every sign-out here (store.js): a wallet closed with its tab runs no sign-out,
 * and whoever uses this browser next signs in.
 */
export const letOldChatDraftsGo = () => {
  try {
    const keys = []
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(KEY_PREFIX)) keys.push(key)
    }
    for (const key of keys) {
      const owner = key.slice(KEY_PREFIX.length)
      const fresh = wordsOnDevice(owner)
      if (fresh !== null) writeToDevice(owner, fresh)
    }
  } catch {
    // Where the storage cannot be read, nothing lies in it to let go of.
  }
}

/**
 * Signing out. What waits in memory goes in any case: pictures, and the next member on this
 * browser must not find a draft in a field. The words on the device go where the member signed
 * out by their own word; a session that ran out leaves them for the member to come back to.
 *
 * @param {string | null | undefined} member who is signing out
 * @param {{ fromDevice?: boolean }} [how] `fromDevice`: the member said "Abmelden"
 */
export const forgetChatDrafts = (member, how) => {
  waiting.clear()
  if (how?.fromDevice === true) {
    try {
      window.localStorage.removeItem(keyOf(memberOf(member)))
    } catch {
      // Where nothing could be written, there is nothing to take off.
    }
  }
  letOldChatDraftsGo()
}
