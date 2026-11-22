// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'

/**
 * What the chat's beat brings of the moderation (`moderationWaiting`, "Meine Gruppen" MG3): how
 * many creations and how many support requests wait for the moderation in the member's own groups
 * -- the two numbers at "Admin" in the menu, the lines "n warten auf die Moderation" of the
 * admin's start page. 0 for whoever moderates nothing: the server answers them null.
 *
 * ⛔ No question of its own and no timer, as useContributionsInProgress: one field more in the
 * document of the chat's beat (useChatUpdates), which hands its answer here. Not in the store
 * either: the store is written to `localStorage` in full, and the numbers would stay on the device
 * for the next member.
 */

const creations = ref(0)
const supportTickets = ref(0)

/** Creations waiting for the moderation: the upper mark. 0 before the first answer. */
export const moderationCreationsWaiting = readonly(creations)

/** Support requests waiting for the moderation: the lower mark. 0 before the first answer. */
export const moderationSupportTicketsWaiting = readonly(supportTickets)

/**
 * Takes what an answer of the beat brought. Where the field is null or missing -- the server
 * could not count, or the answer came without it -- what was shown stays; a number null within it
 * is not the member's to count (the support without the tick), and shows nothing.
 */
export const setModerationWaiting = (waiting) => {
  if (!waiting) return
  creations.value = waiting.creations ?? 0
  supportTickets.value = waiting.supportTickets ?? 0
}

/** The beat stopped -- the layout gone, or the member signed out: the numbers were theirs. */
export const forgetModerationWaiting = () => {
  creations.value = 0
  supportTickets.value = 0
}
