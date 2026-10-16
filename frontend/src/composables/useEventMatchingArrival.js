// AI-GENERATED — not an architecture reference
import { computed, reactive } from 'vue'

/**
 * Who opened an event link in this session and got its entry from it -- for the invitation onto
 * the map that follows the question of the name (KA-015, components/EventMatchingHomeInvitation).
 *
 * This is the half the wallet sees with its own eyes: a member who opens the link signed in, or
 * signs in after opening it, gets the entry on the entries page (pages/Matching.vue,
 * `acceptEventEntry`), and the page says it here. The other half -- the newcomer whose mail was
 * confirmed on another device, or long after the link -- only the account knows; the window asks
 * the server for it (`eventMatchingArrival`).
 *
 * Only where the link MADE the entry. A link opened again finds the entry there and says nothing
 * (KA-014), and so does this: whoever taps the link in every mail of a congress is invited once,
 * not with every mail.
 *
 * ⛔ In this module and not in the store: the store is persisted whole into localStorage, and this
 * belongs to one session. The next start knows it no more -- which is the point, because that is
 * when the first creation comes (KA-015).
 */
const state = reactive({
  /** Whose sentence it is: the gradidoID that opened the link. */
  member: null,
  /** "Kongress Frequency Healing" -- the words of the entry the link made, without "I love". */
  sentence: null,
  /** The answers still on their way, one token each: until they are in, nobody knows yet. */
  underway: new Set(),
})

/**
 * The entries page asks the server to make the entry of a link for `member`. Until the answer is
 * in, the windows after the invitation wait (useFirstLoginWindow, `undecided`): a first creation
 * that took the screen for the moment of the round trip would be pushed off it again.
 *
 * @param {string} member the gradidoID that opened the link
 * @returns {(sentence: string | null) => void} called once with the answer: the words of the entry
 *   the link made, or null where it made none (there already, refused, no connection)
 */
export const eventLinkUnderway = (member) => {
  const token = {}
  state.underway.add(token)
  return (sentence) => {
    // Gone where the member signed out in the meantime: that answer is nobody's any more.
    if (!state.underway.delete(token)) return
    if (sentence) {
      state.member = member
      state.sentence = sentence
    }
  }
}

/** The sentence a link gave `member` in this session, or null. */
export const eventLinkSentence = (member) =>
  computed(() => (member.value && state.member === member.value ? state.sentence : null))

/** Whether an answer of the entries page is still on its way. */
export const eventLinkAnswerUnderway = computed(() => state.underway.size > 0)

/**
 * Forgotten on logout, like the windows of the first logins beside it (store.js). Logging out does
 * not reload the page, and the next member on this browser did not open that link.
 */
export const forgetEventLinkArrival = () => {
  state.member = null
  state.sentence = null
  state.underway.clear()
}
