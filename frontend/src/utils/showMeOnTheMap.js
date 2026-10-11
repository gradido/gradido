// AI-GENERATED — not an architecture reference
import CONFIG from '@/config'
import { mayFind } from '@/utils/matchingPosition'

/**
 * "Show me on the map": the way from an invitation to the home tab, and how that tab knows
 * the member arrived having said yes.
 *
 * Two places invite a member who is not on the map -- the tile on the overview and the
 * window behind "find on the map" -- and both end on the home tab. What they hand over is
 * the yes itself: the tab opens with "findable" switched on, and after saving it opens the
 * map (Bernd, 11.10.2026). One address for both, here, so the two cannot come to mean
 * different things.
 *
 * In the address and not in memory: it survives a reload, it needs no owner and no
 * clean-up on logout, and it gives nothing away -- the yes is a setting the page shows,
 * not something it has saved. Whoever opens the address still has to pick a home and
 * press save.
 */
export const SHOW_ME_ON_THE_MAP = { path: '/matching/position', query: { findable: 'yes' } }

/** Whether this route carries that yes. Other tabs never do: the query goes with the tab. */
export const saidShowMe = (route) =>
  route?.params?.tab === 'position' && route?.query?.findable === 'yes'

/**
 * Who the invitation is for: a member who is not on the map, by the one rule that says who
 * is -- a position AND the permission to be found (`mayFind`).
 *
 * And only on a wallet that has a map. The matching routes exist only where matching is
 * switched on, and routes.js reads the switch the same way; an invitation that led to a page
 * this wallet does not have would be an invitation to a 404.
 *
 * One place, because two ask: the tile, whether it shows, and the overview, whether there is
 * a number to fetch for it (composables/useMapMemberCount).
 */
export const invitedOntoTheMap = (state) => Boolean(CONFIG.MATCHING_ACTIVE) && !mayFind(state)
