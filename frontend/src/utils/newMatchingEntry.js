// AI-GENERATED — not an architecture reference

/**
 * "Make an entry": the way from the overview's matching tile to the form for a new entry,
 * and with how many entries that tile has done its work.
 *
 * The tile invites a member who stands on the map to say what they look for, give and love
 * (components/Overview/MatchingTile). Its button means "let me write one now", so it leads
 * to the form itself and not to the list the form opens from (Bernd, 11.10.2026).
 *
 * In the address, like the yes of "show me on the map" (utils/showMeOnTheMap), and not handed
 * over in memory: a tap twice in a row, or a way there that another one overtakes, leaves
 * nothing behind that would have to be taken back. Unlike that yes it is a wish and not a
 * setting, so the page takes it out of the address once it has opened the form -- a reload,
 * or the way back, must not open the form again over what the member closed
 * (pages/Matching.vue).
 */
export const NEW_MATCHING_ENTRY = { path: '/matching/entries', query: { new: 'entry' } }

/** Whether this route carries that wish. Other tabs never do: the query goes with the tab. */
export const asksForNewEntry = (route) =>
  route?.params?.tab === 'entries' && route?.query?.new === 'entry'

/**
 * With how many entries the member has arrived, and the overview invites no further. Three,
 * because the invitation names three things -- what you look for, what you give, what you
 * love (Bernd, 11.10.2026). Matching stays in the menu.
 *
 * One place, because two ask: the tile, what it shows, and the overview, whether there is
 * anything left to ask the server about (composables/useOwnMatchingEntries).
 */
export const ENTRIES_TO_ARRIVE = 3
