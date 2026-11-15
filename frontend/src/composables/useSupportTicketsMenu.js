// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'

/**
 * What the chat's beat brings of the support (`supportTicketsMenu`, Support-Anfragen K5): whether
 * the community lets its members file new requests, and of the member's own requests how many
 * have a question back (the mark at "Support", SUA-017) and how many are not closed (with the
 * switch off, "Support" stays in the menu for them, SUA-024 point 1 b).
 *
 * ⛔ No question of its own and no timer: one field more in the document of the chat's beat
 * (useChatUpdates), which hands its answer here and does nothing else with it. One state for the
 * app, here in the module and not in the store, for the reason the beat gives: the store is
 * written to `localStorage` in full. Only the switch goes on into the store (DashboardLayout): it
 * is the community's, not the member's, and it has to be known at the next start, before the
 * first answer of the beat -- not known reads as on.
 */

const active = ref(null)
const inProgress = ref(0)
const unfinished = ref(0)

/** Whether new requests are switched on, as the last answer said; null before it. */
export const supportTicketsActiveNow = readonly(active)

/** The member's own requests with a question back: the mark. 0 before the first answer. */
export const supportTicketsInProgress = readonly(inProgress)

/** The member's own requests not closed (open, or with a question back). 0 before the first answer. */
export const supportTicketsUnfinished = readonly(unfinished)

/** Takes what an answer of the beat brought; where the field is missing or empty, what was shown stays. */
export const setSupportTicketsMenu = (menu) => {
  if (!menu) return
  active.value = menu.active
  inProgress.value = menu.inProgress
  unfinished.value = menu.unfinished
}

/** The beat stopped -- the layout gone, or the member signed out: the numbers were theirs. */
export const forgetSupportTicketsMenu = () => {
  active.value = null
  inProgress.value = 0
  unfinished.value = 0
}
