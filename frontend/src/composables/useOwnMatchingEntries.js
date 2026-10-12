// AI-GENERATED — not an architecture reference
import { onBeforeUnmount, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { FIRST_ANSWER_PATIENCE_MS } from '@/composables/useMapMemberCount'
import { listMatchingEntries } from '@/graphql/queries'
import { ENTRIES_TO_ARRIVE } from '@/utils/newMatchingEntry'
import { standsOnTheMap } from '@/utils/showMeOnTheMap'

/**
 * How many matching entries the member has, for the matching tile on the overview: none
 * invites to the first one, one or two offer another, and with three the tile is gone
 * (Bernd, 11.10.2026 -- components/Overview/MatchingTile).
 *
 * ## The answer must not arrive late
 *
 * The three have three heights. A tile that learned the answer after it was painted would
 * change shape, and take its own button and the tiles below it along under a finger. So the
 * overview decides ONCE what the tile is, the way it does for the number of people on the
 * map (composables/useMapMemberCount), and that stands for as long as the overview does:
 *
 * - This device has heard about this member before: the tile is what it heard, at once. The
 *   question is asked again in the background, and its answer is for the next visit -- that
 *   is how entries made on another device get here.
 * - It has not: the overview holds its tiles back until the answer is in -- one round trip
 *   to our own server, which reads the member's own rows -- and no longer than the patience
 *   it has for the number. Nothing stands there yet, so nothing moves. Once per member and
 *   device, and usually not even that: the matching page tells this memory whenever it
 *   loads the list, and a member comes onto the map through that page.
 * - No answer in time: no tile for this visit. Not known is not "none".
 *
 * Only for a member who stands on the map. Everybody else is asked nothing and waits for
 * nothing; the two waits of the overview never add up, because nobody is both invited onto
 * the map and on it.
 *
 * ## Why the member is in the key
 *
 * Unlike the number of people on the map this is one member's own, so it follows the house
 * rule for what a browser keeps (utils/matchingPrefs.js, composables/useShowFriendsSeen):
 * one key per gradidoID, never a shared one. On a shared device the next member would
 * otherwise be told about the previous one's entries.
 */

const KEY_PREFIX = 'own-matching-entries:'

const storageKey = (gradidoID) => (gradidoID ? `${KEY_PREFIX}${gradidoID}` : null)

/** A number of entries: whole, and not below none. Asked of the answer and of the storage alike. */
const isCount = (value) => Number.isSafeInteger(value) && value >= 0

/** The device keeps no more than the tile asks: none, one, two -- or arrived. */
const kept = (count) => Math.min(count, ENTRIES_TO_ARRIVE)

/**
 * What this device last heard about this member:
 *   undefined -- nothing yet (never asked, nobody named, or the storage cannot be read)
 *   a number  -- how many entries, counted no further than "arrived"
 */
const remembered = (gradidoID) => {
  const key = storageKey(gradidoID)
  if (!key) return undefined
  try {
    const raw = window.localStorage?.getItem(key)
    if (raw === null || raw === undefined) return undefined
    const value = JSON.parse(raw)
    return isCount(value) ? kept(value) : undefined
  } catch {
    return undefined
  }
}

/**
 * Tell this device how many entries `gradidoID` has. For whoever knows: the overview's own
 * question below, and the matching page -- with every list it loads and with every entry it
 * saves or deletes. It is the one place entries are made and deleted, so the overview is
 * right the moment the member comes back from there.
 *
 * Says nothing without a member to say it about, and nothing for what is not a number of
 * entries.
 */
export const rememberOwnMatchingEntries = (gradidoID, count) => {
  const key = storageKey(gradidoID)
  if (!key || !isCount(count)) return
  try {
    window.localStorage?.setItem(key, JSON.stringify(kept(count)))
  } catch {
    // Storage can refuse (private mode, quota). The device then hears nothing, and the
    // overview waits for the answer again next time -- with the same patience.
  }
}

/**
 * For the overview: `settled` says when its tiles may be painted, `entries` how many
 * entries the member has -- a number up to "arrived", or null where nobody could say.
 *
 * `entries` is written at most once, on the way to `settled`, and never after it.
 */
export function useOwnMatchingEntries() {
  const store = useStore()
  const entries = ref(null)
  const settled = ref(true)

  // Decided when the overview is set up, and not looked at again: the tile reads the store
  // once as well, so that a save still under way on another page cannot change it later.
  if (!standsOnTheMap(store.state)) {
    return { settled, entries }
  }

  // Whose entries are asked about. Held here and not read when the answer comes: signing
  // out empties the store while the overview still stands, and an answer on its way then
  // is still this member's and nobody else's.
  const member = store.state.gradidoID
  const heard = remembered(member)
  entries.value = heard ?? null

  // Arrived: the tile has nothing left to say, so there is nothing to ask either. Should
  // entries go again, the matching page says so here -- it is where they are deleted.
  if (heard !== undefined && heard >= ENTRIES_TO_ARRIVE) {
    return { settled, entries }
  }

  settled.value = heard !== undefined
  const settle = (answer) => {
    if (settled.value) return
    if (answer !== undefined) entries.value = answer
    settled.value = true
  }
  // Set before the question is asked, so that nothing the question does can leave the
  // overview waiting for ever.
  const patience = setTimeout(() => settle(undefined), FIRST_ANSWER_PATIENCE_MS)
  onBeforeUnmount(() => clearTimeout(patience))

  // From the network every time: what the cache holds is what the matching page last saw,
  // and this question is asked to learn what happened elsewhere.
  const { onResult, onError } = useQuery(listMatchingEntries, null, { fetchPolicy: 'network-only' })
  onResult(({ data }) => {
    // Only an answer counts. A report without the list, should one ever come, is not "none".
    if (!Array.isArray(data?.listMatchingEntries)) return
    const answer = kept(data.listMatchingEntries.length)
    rememberOwnMatchingEntries(member, answer)
    settle(answer)
  })
  // No answer is not "none": nothing is remembered, and the next visit asks again.
  onError(() => settle(undefined))

  return { settled, entries }
}
