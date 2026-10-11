// AI-GENERATED — not an architecture reference
import { onBeforeUnmount, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { mapMemberCount } from '@/graphql/queries'
import { invitedOntoTheMap } from '@/utils/showMeOnTheMap'

/**
 * How many people stand on the map, for the heading of the invitation on the overview
 * ("773 people on the Gradido map" -- Bernd, 11.10.2026).
 *
 * ## The number must not arrive late
 *
 * With the number the tile's heading has a line more than without it. A tile that learned
 * the number after it was painted would grow by that line, and push its own button and the
 * tiles below it down under a finger. So the overview decides ONCE what the tile says, and
 * that stands for as long as the overview does:
 *
 * - This device has heard an answer before: the tile says what it heard, at once. The
 *   question is asked again in the background and its answer is for the next visit.
 * - This device has never heard one: the overview holds its tiles back until the answer is
 *   in -- one round trip to our own server, which reads the number from memory -- and no
 *   longer than FIRST_ANSWER_PATIENCE_MS. Nothing stands there yet, so nothing moves. That
 *   wait happens once per device.
 *
 * Only for a member the invitation is for. Everybody else is asked nothing and waits for
 * nothing.
 *
 * ## Why the device remembers, and not the member
 *
 * The house rule keys what a browser keeps by the member, or clears it at sign-out
 * (utils/matchingPrefs.js). This is the exception that rule allows: the number is the same
 * for everybody on this server, it says nothing about who asked, and it is the newcomer --
 * whose device may have been somebody else's a minute ago -- who should see it first.
 */

/** Where the device keeps what it last heard. Outside the store's blob, which sign-out removes. */
export const MAP_MEMBER_COUNT_STORAGE_KEY = 'gradido-map-member-count'

/**
 * How long the overview waits for the first answer this device has ever asked for. Long
 * enough for a round trip on a phone, short enough that an overview without its tiles does
 * not read as broken. Past it the tile stands without the number, this once.
 */
export const FIRST_ANSWER_PATIENCE_MS = 300

/** A number of people: whole, and not below nobody. Asked of the answer and of the storage alike. */
const isCount = (value) => Number.isSafeInteger(value) && value >= 0

/**
 * What this device last heard:
 *   undefined -- nothing yet (never asked, or the storage cannot be read)
 *   null      -- it asked, and the server had no number
 *   a number  -- what the server said
 */
const remembered = () => {
  try {
    const raw = window.localStorage?.getItem(MAP_MEMBER_COUNT_STORAGE_KEY)
    if (raw === null || raw === undefined) return undefined
    const value = JSON.parse(raw)
    if (value === null) return null
    return isCount(value) ? value : undefined
  } catch {
    return undefined
  }
}

const remember = (count) => {
  try {
    window.localStorage?.setItem(MAP_MEMBER_COUNT_STORAGE_KEY, JSON.stringify(count))
  } catch {
    // Storage can refuse (private mode, quota). The device then hears nothing, and the
    // overview waits for the answer again next time -- with the same patience.
  }
}

/**
 * For the overview: `settled` says when its tiles may be painted, `count` what the
 * invitation says -- a number, or null for the heading without one.
 *
 * `count` is written at most once, on the way to `settled`, and never after it.
 */
export function useMapMemberCount() {
  const store = useStore()
  const heard = remembered()
  const count = ref(heard ?? null)
  const settled = ref(true)

  // Decided when the overview is set up, and not looked at again: the tile reads the store
  // once as well, so that a save still under way on another page cannot change it later.
  if (!invitedOntoTheMap(store.state)) {
    return { settled, count }
  }

  settled.value = heard !== undefined
  const settle = (answer) => {
    if (settled.value) return
    if (answer !== undefined) count.value = answer
    settled.value = true
  }
  // Set before the question is asked, so that nothing the question does can leave the
  // overview waiting for ever.
  const patience = setTimeout(() => settle(undefined), FIRST_ANSWER_PATIENCE_MS)
  onBeforeUnmount(() => clearTimeout(patience))

  // From the network every time: the number is this server's to say, and the Apollo cache is
  // emptied with every sign-in anyway.
  const { onResult, onError } = useQuery(mapMemberCount, null, { fetchPolicy: 'network-only' })
  onResult(({ data }) => {
    // Only an answer counts. Asked past the cache, the library reports nothing but the
    // network's answer today; a report without data, should one ever come, is not "no number".
    if (!data) return
    const answer = isCount(data.mapMemberCount) ? data.mapMemberCount : null
    remember(answer)
    settle(answer)
  })
  // No answer is not "no number": nothing is remembered, and the next visit asks again.
  onError(() => settle(undefined))

  return { settled, count }
}
