// AI-GENERATED — not an architecture reference

import { readonly, ref } from 'vue'

/**
 * What the chat's beat brings of the member's contributions (`countContributionsInProgress`):
 * how many have a question back from the moderation -- the mark at "Schöpfen", and with the
 * chat's and the support's the dot at the phone's menu opener (Bernd, 16.11.2026). A
 * contribution counts until the member answers or the moderation settles it, as a request counts
 * at "Support" (SUA-017).
 *
 * ⛔ No question of its own and no timer, as useSupportTicketsMenu: one field more in the
 * document of the chat's beat (useChatUpdates), which hands its answer here. Not in the store
 * either: the store is written to `localStorage` in full.
 */

const inProgress = ref(0)

/** The member's contributions with a question back: the mark. 0 before the first answer. */
export const contributionsInProgress = readonly(inProgress)

/** Takes what an answer of the beat brought; where the server could not count, what was shown stays. */
export const setContributionsInProgress = (count) => {
  if (typeof count !== 'number') return
  inProgress.value = count
}

/** The beat stopped -- the layout gone, or the member signed out: the number was theirs. */
export const forgetContributionsInProgress = () => {
  inProgress.value = 0
}
