// AI-GENERATED — not an architecture reference
import { onBeforeUnmount, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { useThanksNudges } from '@/composables/useThanksNudges'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import { arrivalItems } from '@/utils/thanksNudge'

/**
 * The thank-yous received for the tile "Dein Dank ist da." at the top of the overview (W3,
 * components/Overview/ThanksArrivalTile): up to three of the last seven days that have no
 * reaction yet (utils/thanksNudge, `arrivalItems`).
 *
 * ## The answer must not arrive late
 *
 * The tile stands above every other one. Painted after them, it would push them all down under a
 * finger. So the overview decides ONCE, before its tiles are painted, which thank-yous the tile
 * shows -- the way it decides the number on the map (useMapMemberCount) and the member's entries
 * (useOwnMatchingEntries) -- and that stands for as long as the overview does:
 *
 * - The overview holds its tiles back until the answer is in: one round trip to our own server,
 *   on every opening of the overview, and no longer than THANKS_ARRIVAL_PATIENCE_MS.
 * - No answer in time, or a failed one: the other tiles come, and the thank-you tile stays away
 *   for this visit.
 * - An answer that comes later changes nothing.
 *
 * ⛔ Nothing of the answer is kept on the device. Unlike a number of entries, these are bookings:
 * who thanked, how much, what they wrote. A device that remembered them could show a thank-you
 * long answered elsewhere, and keeps what is nobody's business on a shared one. So every opening
 * of the overview asks, and waits.
 *
 * Only for a member who is signed in. Signing out empties the store while the overview stands:
 * nothing is asked, nothing waited for.
 */

/**
 * How many of the member's newest bookings are read: the tile shows three, and a few bookings of
 * other kinds in between -- a creation, a link, a transfer sent -- must not push a thank-you of the
 * last days out of its sight. More belong in the booking list.
 */
export const THANKS_ARRIVAL_PAGE_SIZE = 10

/**
 * How long the overview waits for them: as long as the layout gives the answer to its own question
 * about the newest bookings -- the one that brings the balance above the page -- before it stops
 * showing its skeleton in the balance's place (DashboardLayout: "normally skeleton should be
 * visible less than 1500ms"). So the tiles come no later than the balance does. Past it the
 * overview stands without the thank-yous, this once.
 */
export const THANKS_ARRIVAL_PATIENCE_MS = 1500

/**
 * For the overview: `settled` says when its tiles may be painted, `thanks` which thank-yous the
 * tile shows -- newest first, the bookings as the list carries them.
 *
 * `thanks` is written at most once, on the way to `settled`, and never after it.
 */
export function useThanksArrivals() {
  const store = useWalletStore()
  const thanks = ref([])
  const settled = ref(true)

  if (!store.gradidoID) {
    return { settled, thanks }
  }

  // "Später" on this device: asked when the answer is in, of the member who is signed in then.
  const { isSeen } = useThanksNudges()

  settled.value = false
  const settle = (answer) => {
    if (settled.value) return
    if (answer) thanks.value = answer
    settled.value = true
  }
  // Set before the question is asked, so that nothing the question does can leave the overview
  // waiting for ever.
  const patience = setTimeout(() => settle(undefined), THANKS_ARRIVAL_PATIENCE_MS)
  onBeforeUnmount(() => clearTimeout(patience))

  // ⚠️ A question of its own, beside the one the layout asks whenever the overview is opened (the
  // newest eight bookings, for the column beside it, DashboardLayout). That one is the column's --
  // eight, where Bernd wants them for now -- and its answer can land before this page is set up or
  // after it (the page comes in once the old one has faded out), so the overview could not tell
  // which of its answers is this visit's. One request more per opening of the overview, the
  // column's size.
  //
  // `no-cache`: the next opening asks again, and the variables are the same for every member --
  // a cached answer would be one key for all of them on a shared device.
  const { onResult, onError } = useQuery(
    transactionsQuery,
    { currentPage: 1, pageSize: THANKS_ARRIVAL_PAGE_SIZE, order: 'DESC' },
    { fetchPolicy: 'no-cache' },
  )
  onResult(({ data }) => {
    // Only an answer counts. A report without the list is not "no thank-you".
    const transactions = data?.transactionList?.transactions
    if (!Array.isArray(transactions)) return
    settle(arrivalItems({ transactions, now: Date.now(), seen: isSeen }))
  })
  // No answer is not "none": the tiles come without it, and the next opening asks again.
  onError(() => settle(undefined))

  return { settled, thanks }
}
