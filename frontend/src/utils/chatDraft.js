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
 * In memory: a draft is there for as long as the wallet runs in this tab and its member stays
 * signed in.
 *
 * ⛔ A draft belongs to the member who wrote it. One browser serves several members, and signing
 * out does not reload the page. So a draft is kept under the member signed in and handed to
 * nobody else; it is not kept at all once that member is signed in no longer -- a bar still
 * stands for a moment after the idle timeout signed its member out --; and the sign-out forgets
 * them all (store.js).
 */

/**
 * How many conversations keep a picture that waits: the ones written in last. A picture waits as
 * it was chosen, whole -- a photo of some megabytes each --, and a phone has little room for a
 * pile of them. An older draft keeps its words.
 */
export const CHAT_DRAFT_PICTURES_KEPT = 3

/** Draft by place -- the member and the conversation --, the one written in last at the end. */
const drafts = new Map()

/** Words worth keeping: a field of spaces is an empty field. */
const wordsIn = (text) => (typeof text === 'string' && text.trim() !== '' ? text : '')

const memberOf = (gradidoID) => (typeof gradidoID === 'string' ? gradidoID.toLowerCase() : '')

/** Lets the pictures of the drafts written in longest ago go, down to the number kept. */
const letOldPicturesGo = () => {
  const withPicture = [...drafts].filter(([, draft]) => draft.picture)
  const tooMany = withPicture.length - CHAT_DRAFT_PICTURES_KEPT
  for (const [place, draft] of withPicture.slice(0, Math.max(0, tooMany))) {
    // Written over in place: the draft keeps its turn among the others.
    if (draft.text) drafts.set(place, { ...draft, picture: null })
    else drafts.delete(place)
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
    read: () => (stillTheirs() ? (drafts.get(place) ?? null) : null),
    keep: ({ text = '', picture = null, alsoByEmail = null } = {}) => {
      if (!stillTheirs()) return
      const words = wordsIn(text).slice(0, MESSAGE_MAX_CHARS)
      // Taken out first, so what is kept below stands at the end: the one written in last.
      drafts.delete(place)
      if (!words && !picture) return
      drafts.set(place, {
        text: words,
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

/** Signing out: every draft goes -- the next member on this browser must not find one in a field. */
export const forgetChatDrafts = () => {
  drafts.clear()
}
