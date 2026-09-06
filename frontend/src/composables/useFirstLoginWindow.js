// AI-GENERATED — not an architecture reference

import { computed, reactive } from 'vue'

/**
 * Which of the windows a member meets on their first logins is the one on screen right now
 * (ES-003).
 *
 * Three of them hang side by side in DashboardLayout and each has its own reason to open:
 * the address is not confirmed yet, the name is still the one the system built, the first
 * creation has not happened. Nothing stopped two of them from opening at the same moment,
 * and two BModals stack -- the one underneath is reachable only by dismissing the one on
 * top, which is not what either of them means.
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
 */
const ORDER = ['email', 'alias', 'firstCreation']

/** Which windows would show if nothing else were in the way. Only these three keys exist. */
const wanted = reactive({ email: false, alias: false, firstCreation: false })

/**
 * The window that has the screen, or null. `'email' | 'alias' | 'firstCreation' | null`.
 */
export const firstLoginWindow = computed(() => ORDER.find((name) => wanted[name]) ?? null)

/**
 * Whether THIS window is the one to show -- what a component binds its `v-model` to.
 *
 * @param {'email'|'alias'|'firstCreation'} name
 */
export const firstLoginWindowOnScreen = (name) => computed(() => firstLoginWindow.value === name)

/**
 * Said by each window: "I would show" / "I am done". Called from a watcher, never from a
 * computed getter -- a getter that writes runs an unknown number of times and in an order
 * nobody controls.
 *
 * @param {'email'|'alias'|'firstCreation'} name
 * @param {boolean} value
 */
export const setFirstLoginWindowWanted = (name, value) => {
  wanted[name] = value
}

/**
 * Forgotten on logout, like the hearts and the open portrait beside it in store.js. Logging
 * out does not reload the page, so this module outlives the session that filled it -- and
 * the next member on this browser must meet their own windows, not the last member's
 * unanswered ones.
 */
export const forgetFirstLoginWindows = () => {
  ORDER.forEach((name) => {
    wanted[name] = false
  })
}
