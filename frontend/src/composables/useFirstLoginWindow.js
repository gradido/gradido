// AI-GENERATED — not an architecture reference

import { computed, reactive, ref } from 'vue'

/**
 * Which of the windows a member meets on their first logins is the one on screen right now
 * (ES-003).
 *
 * Four of them hang side by side in DashboardLayout and each has its own reason to open:
 * the address is not confirmed yet, the name is still the one the system built, the member
 * came in by an event link and is not on the map yet, the first creation has not happened.
 * Nothing stopped two of them from opening at the same moment, and two BModals stack -- the
 * one underneath is reachable only by dismissing the one on top, which is not what either of
 * them means.
 *
 * ⛔ DERIVED, not claimed. The obvious build is a token each window sets on open and clears
 * on close; it was rejected for a measured reason. This wallet's store is persisted whole
 * into localStorage (`vuex-persistedstate` in store.js, no `paths`), so a token written
 * there survives a closed tab -- and a token left behind by a window that never got to
 * clear it would lock out all three windows for good, silently. Here there is nothing to
 * leave behind: each window says only whether it WOULD show, and who is on screen follows
 * from that plus the order below. A window that goes away takes its own claim with it,
 * because the claim was never a separate thing.
 *
 * ★ And the order lives HERE, in one line, rather than in the order the layout happens to
 * render the three components in. Their order in that template is arbitrary today -- the
 * modals teleport, so nothing on screen depends on it -- and a rule that reads off it would
 * be changed by a move that looks like tidying.
 */

/**
 * ⚠️ First is FIRST on screen, and the order is not decoration.
 *
 * The address reminder comes before the name because it can be waved away ("Später") while
 * the other two want an answer, and inside the 24-hour grace period the account is on a
 * clock the member has to be told about (EM-013). The name comes before the first creation
 * because the creation message greets them by it (ES-003): asked in the other order, the
 * community would thank somebody by a name they are in the middle of replacing.
 *
 * The invitation onto the map after an event link (`'home'`, EventMatchingHomeInvitation)
 * comes right after the name and before the first creation (Bernd, 16.10.2026, KA-015): who
 * came for the people of a congress is shown the way to them first, and thanked by the
 * community at the next start.
 *
 * Before all of them comes a window that is none of them: the conversation an address opens
 * (`/contacts?with=…`, pages/Contacts.vue). Somebody who has just accepted a thank-you and
 * taps "… antworten" arrives in the wallet for the first time through that address, and what
 * they came for is the conversation -- the others wait, and come in their order once it is
 * closed. `'contact'` takes part in the same rule instead of a rule of its own, so "only one
 * at a time" still stands in this one line. Nothing shows by it: no component binds to it.
 */
const ORDER = ['contact', 'email', 'alias', 'home', 'firstCreation']

/** Which windows would show if nothing else were in the way. Only these five keys exist. */
const wanted = reactive({
  contact: false,
  email: false,
  alias: false,
  home: false,
  firstCreation: false,
})

/**
 * A window that cannot say yet whether it would show, because its answer is on its way: it
 * holds back the ones after it, and none of them gets the screen in the meantime. Without
 * this a window further down took the screen for the moment of the round trip and was pushed
 * off it again when the answer came -- a window that flashes in and away: the first creation
 * before the invitation onto the map, and the invitation (or the first creation) before the
 * question of the name, whose answer is often the slower one. The ones before it are not
 * held: they come first anyway.
 */
const undecided = reactive({ alias: false, home: false })

/**
 * Once the invitation onto the map was due in this session, the first creation waits for the
 * next start -- a new sign-in, or the page loaded anew (KA-015: "erst beim nächsten Neustart").
 * Whatever the member answered the invitation, and wherever they stood when it was due (on
 * the home tab it does not open, it leads there): one ask at a time, and not two in the first
 * minutes. A ref in this module, so a reload ends it; the logout and a new sign-in end it as
 * well (store.js).
 */
const firstCreationHeld = ref(false)

/**
 * The window that has the screen, or null.
 * `'contact' | 'email' | 'alias' | 'home' | 'firstCreation' | null`.
 */
export const firstLoginWindow = computed(() => {
  for (const name of ORDER) {
    if (undecided[name]) return null
    if (name === 'firstCreation' && firstCreationHeld.value) return null
    if (wanted[name]) return name
  }
  return null
})

/**
 * Whether THIS window is the one to show -- what a component binds its `v-model` to.
 *
 * @param {'email'|'alias'|'home'|'firstCreation'} name
 */
export const firstLoginWindowOnScreen = (name) => computed(() => firstLoginWindow.value === name)

/**
 * Said by each window: "I would show" / "I am done". Called from a watcher, never from a
 * computed getter -- a getter that writes runs an unknown number of times and in an order
 * nobody controls.
 *
 * @param {'contact'|'email'|'alias'|'home'|'firstCreation'} name
 * @param {boolean} value
 */
export const setFirstLoginWindowWanted = (name, value) => {
  wanted[name] = value
}

/**
 * Said by the invitation onto the map the moment it is due -- a member who came by an event
 * link and does not stand on the map -- whether it can open where the member stands or not:
 * the first creation waits for the next start.
 */
export const holdFirstCreationForThisSession = () => {
  firstCreationHeld.value = true
}

/**
 * A new start, at a sign-in (store.js, `login`): the first creation no longer waits for the
 * invitation of a session before. Only that -- which windows would show, the windows say
 * themselves, mounted with the layout, and resetting it from outside would leave a mounted one
 * believing what is no longer written here.
 */
export const endFirstCreationHold = () => {
  firstCreationHeld.value = false
}

/**
 * Said by a window whose answer is on its way ("I cannot say yet"), and again when it is in:
 * the question of the name, and the invitation onto the map.
 *
 * @param {'alias'|'home'} name
 * @param {boolean} value
 */
export const setFirstLoginWindowUndecided = (name, value) => {
  undecided[name] = value
}

/**
 * Forgotten on logout, like the hearts and the open portrait beside it in store.js. Logging
 * out does not reload the page, so this module outlives the session that filled it -- and
 * the next member on this browser must meet their own windows, not the last member's
 * unanswered ones. (A sign-in ends only the hold, `endFirstCreationHold`.)
 */
export const forgetFirstLoginWindows = () => {
  ORDER.forEach((name) => {
    wanted[name] = false
  })
  undecided.alias = false
  undecided.home = false
  firstCreationHeld.value = false
}
