// AI-GENERATED — not an architecture reference
import type { Moderator } from './Moderator.schema'

/**
 * Whether the support is the signed-in moderator's to see (Support-Anfragen K6): an administrator
 * always, a moderator or KI-moderator with the tick. The menu, the start page and the route ask
 * this one question; the server's rights stay the final word (askOpenSupportTickets).
 *
 * ⛔ The role first, not the tick alone: a state kept from before K6 carries no tick, and an
 * administrator must not lose the support until they come in through the wallet again.
 */
export const supportIsTheirs = (moderator: Moderator | null): boolean =>
  moderator?.role === 'ADMIN' || moderator?.handlesSupportTickets === true
