// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { transactionsQuery } from '@/graphql/transactions.graphql'

/** How many bookings a page holds: the booking list's own page size. */
export const OWN_TRANSFER_PAGE_SIZE = 25

/**
 * How many pages are asked at most: 250 bookings back. A member thanked more than 250 bookings
 * ago and yet within the seven days a line holds is hardly there; what was loaded counts.
 */
export const OWN_TRANSFER_PAGES_MOST = 10

/** A moment as milliseconds; NaN for a time nobody can read. */
const at = (value) => new Date(value).getTime()

/**
 * What the member sent to a person: the only booking that thanks somebody among the members.
 * The decay row of the first page, what came in, creations and a booking that names nobody on the
 * other side are left out.
 */
const isSentToSomebody = (booking) =>
  booking?.typeId === 'SEND' && Boolean(booking.linkedUser?.gradidoID)

/**
 * The member's own transfers since a moment, for the line after a video call in a group (E-043 B,
 * utils/thanksNudge `membersToThank`): who was thanked since the call began is who was booked, on
 * every device. The booking list unnarrowed (`counterparty: null`), newest first, a page at a time
 * -- another page only while the oldest booking of the last one is not older than the moment and
 * the list holds more (`balance.count`), ten pages at most.
 *
 * ⛔ `no-cache`: the whole list of one's own bookings is nothing to keep beside the booking page's
 * own answer until logout. ⛔ Nothing in the store or on the device: it is read again with the
 * next opening. ⛔ `renewSession: false`: the asking is never the member's own doing -- a line
 * turned due on the thread's clock, or while the page was out of sight -- and must not move the
 * idle logout on (plugins/apolloProvider.js); the thread's own page renews it on opening.
 *
 * Read once, on the first `ask`; a later one does nothing, also for another moment -- the thread
 * that asks is made anew with every opening of its window, and asks then.
 *
 * `transfers` null until every page asked for is in, and again where one did not come (`failed`):
 * then nothing is known, and the line stays away, as in a conversation of two. Nothing is said
 * about it. `settled` once the asking is over, either way.
 *
 * @param apolloClient
 */
export const useOwnTransfers = (apolloClient) => {
  const transfers = ref(null)
  const settled = ref(false)
  const failed = ref(false)
  let asked = false

  const askPage = async (currentPage) => {
    const { data } = await apolloClient.query({
      query: transactionsQuery,
      variables: {
        currentPage,
        pageSize: OWN_TRANSFER_PAGE_SIZE,
        order: 'DESC',
        counterparty: null,
      },
      fetchPolicy: 'no-cache',
      context: { renewSession: false },
    })
    return data?.transactionList
  }

  /**
   * The transfers back to `since` (milliseconds): the beginning of the earliest call whose line
   * is due. A booking at that very moment counts as thanked, so a page that ends there asks the
   * next one too.
   */
  const ask = async (since) => {
    if (asked) return
    asked = true
    const sent = []
    try {
      for (let currentPage = 1; currentPage <= OWN_TRANSFER_PAGES_MOST; currentPage++) {
        const list = await askPage(currentPage)
        const rows = list?.transactions ?? []
        sent.push(...rows.filter(isSentToSomebody))
        const times = rows.map((booking) => at(booking.balanceDate)).filter((t) => !Number.isNaN(t))
        const listHoldsMore = currentPage * OWN_TRANSFER_PAGE_SIZE < (list?.balance?.count ?? 0)
        if (!times.length || !listHoldsMore || !(Math.min(...times) >= since)) break
      }
      transfers.value = sent
    } catch {
      failed.value = true
    } finally {
      settled.value = true
    }
  }

  return { transfers, settled, failed, ask }
}
