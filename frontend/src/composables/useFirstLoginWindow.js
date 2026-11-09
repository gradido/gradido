// AI-GENERATED — not an architecture reference

import { computed, reactive } from 'vue'

/**
 * Which of the windows a member meets on their first logins is the one on screen right now
 * (ES-003).
 *
 * Four of them hang side by side in DashboardLayout and each has its own reason to open:
 * the address is still not confirmed when its 24 hours are over (inside them a strip on the
 * page says so, EmailConfirmationStrip), the name is still the one the system built, the member
 * came in by an event link and is not on the map yet, the first creation has not happened.
 * Nothing stopped two of them from opening at the same moment, and two BModals stack -- the
 * one underneath is reachable only by dismissing the one on top, which is not what either of
 * them means.
 *
 * ⛔ DERIVED, not claimed. The obvious build is a token each window sets on open and clears
 * on close; it was rejected for a measured reason. This wallet's store is persisted whole
 * into localStorage (store.js saves it whole), so a token written
 * there survives a closed tab -- and a token left behind by a window that never got to
 * clear it would lock out all three windows for good, silently. Here there is nothing to
 * leave behind: each window says only whether it WOULD show, and who is on screen follows
 * from that plus the order below. A window that goes away takes its own claim with it,
 * because the claim was never a separate thing.
 *
 * ⛔ For the same reason, what waits for the next start waits in this module and not in the
 * store (`held`, below): a hold written there would outlive the session it was said in and
 * keep a window away for good. Here a reload ends it, a sign-in ends it (store.js, `login`), the
 * page "Schöpfen" ends it (pages/Contributions.tsx, E-045), and the logout forgets it.
 *
 * ★ And the order lives HERE, in one line, rather than in the order the layout happens to
 * render the three components in. Their order in that template is arbitrary today -- the
 * modals teleport, so nothing on screen depends on it -- and a rule that reads off it would
 * be changed by a move that looks like tidying.
 */

/**
 * ⚠️ First is FIRST on screen, and the order is not decoration.
 *
 * The address reminder comes before the name because it is a window only past the 24-hour
 * grace period (EM-013, EM-014): then the account is narrowed down until the address is
 * confirmed, the window cannot be closed, and no other window may stand in front of the one
 * way out. Inside the grace period the clock is told by a strip on the page
 * (EmailConfirmationStrip) that covers nothing and takes no part in this order -- so inside the
 * 24 hours the first window a member meets is the name's.
 *
 * The name comes before the first creation because the creation message greets them by it
 * (ES-003): asked in the other order, the community would thank somebody by a name they are in
 * the middle of replacing.
 *
 * The invitation onto the map after an event link (`'home'`, EventMatchingHomeInvitation)
 * comes right after the name and before the first creation (Bernd, 16.10.2026, KA-015): who
 * came for the people of a congress is shown the way to them first, and thanked by the
 * community at the next start.
 *
 * Before all of them comes a window that is none of them: the conversation an address opens
 * (`/contacts?with=…`, pages/Contacts.tsx). Somebody who has just accepted a thank-you and
 * taps "Antworten" on the overview's tile, or the reply button of a mail, arrives in the
 * conversation through that address, and what they came for is the conversation -- the others
 * wait, and come in their order once it is closed. `'contact'` takes part in the same rule instead of a rule of its own, so "only one
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
 * Windows that wait for the next start -- a new sign-in, or the page loaded anew --, whatever
 * they would say in the session they were held in, or until the member opens "Schöpfen" (E-045:
 * whoever goes there wants to create). Two say so:
 *
 * - The invitation onto the map holds the first creation once it was due in this session
 *   (KA-015: "erst beim nächsten Neustart"). Whatever the member answered the invitation, and
 *   wherever they stood when it was due (on the home tab it does not open, it leads there): one
 *   ask at a time, and not two in the first minutes.
 * - The page where a thank-you opened the account holds the name and the first creation (E-044,
 *   ES-024, NU-025): whoever came for a thank-you meets it first, and the windows about
 *   themselves at the next start, the name before the first creation (ES-003). The address is
 *   not held: it is the one thing that must be said -- the account is on a clock of 24 hours,
 *   and on this way the guest typed the address themselves (E-044) --, and inside those hours it
 *   is said by a strip on the page, not by a window (EM-014). Past them its window is the way
 *   out of a narrowed account.
 *
 * A held window is passed over, not waited for: it is neither wanted nor undecided in this
 * session, so it holds back none of the windows after it.
 */
const held = reactive({ alias: false, firstCreation: false })

/**
 * The window that has the screen, or null.
 * `'contact' | 'email' | 'alias' | 'home' | 'firstCreation' | null`.
 */
export const firstLoginWindow = computed(() => {
  for (const name of ORDER) {
    if (held[name]) continue
    if (undecided[name]) return null
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
  held.firstCreation = true
}

/**
 * Said by the page where a thank-you opened the account (pages/TransactionLink.vue), once the
 * sign-in is through: the windows about the member themselves -- the name and the first
 * creation -- wait for the next start, and the thank-you comes first (E-044, ES-024, NU-025).
 *
 * ⛔ After the sign-in, never before it: the sign-in ends every hold (store.js, `login`), so a
 * hold said before it would be gone by the time the member meets the windows.
 */
export const holdAccountWindowsForThisSession = () => {
  held.alias = true
  held.firstCreation = true
}

/**
 * A new start, at a sign-in (store.js, `login`): no window waits any longer for a session
 * before -- neither the first creation behind an invitation onto the map nor the name and the
 * first creation behind a thank-you. Only that -- which windows would show, the windows say
 * themselves, mounted with the layout, and resetting it from outside would leave a mounted one
 * believing what is no longer written here.
 *
 * And the page "Schöpfen" (pages/Contributions.tsx, E-045), when it is built: whoever opens it
 * wants to create, so what waited comes now, in its order -- the name before the first creation
 * (ES-003). Every hold, as the sign-in: one rule, not one per hold.
 */
export const endFirstLoginHolds = () => {
  held.alias = false
  held.firstCreation = false
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
 * unanswered ones. (A sign-in ends only the holds, `endFirstLoginHolds`.)
 */
export const forgetFirstLoginWindows = () => {
  ORDER.forEach((name) => {
    wanted[name] = false
  })
  undecided.alias = false
  undecided.home = false
  endFirstLoginHolds()
}
