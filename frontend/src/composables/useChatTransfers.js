// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { transactionsQuery } from '@/graphql/transactions.graphql'

/** How many bookings a page holds: the booking list's own page size. */
export const CHAT_TRANSFER_PAGE_SIZE = 25

/**
 * Only what went between the two: a transfer one way or the other. The first page of the list
 * carries a virtual decay row, and nothing else in a list narrowed to a person names them.
 */
const isTransfer = (booking) => booking.typeId === 'SEND' || booking.typeId === 'RECEIVE'

/**
 * The transfers between the member and one other person, for their conversation (Bernd,
 * 28.09.2026: "bei einer Gradido-Transaktion ebenfalls eine Nachricht im Chat-Faden") -- the
 * booking list narrowed to that person (`counterparty`, the pair the contact window holds),
 * newest first, a page at a time. Nothing is stored for the conversation: its bubbles are the
 * bookings themselves, so earlier transfers stand in it too, each side reads them in their own
 * language, and a transfer across the border needs nothing new from the federation.
 *
 * ⛔ `no-cache`: a list narrowed to one person is nothing the booking page reads back, and in the
 * cache it would stand beside that page's own answer until logout.
 *
 * `transfers` oldest first, as the thread reads its messages; `settled` once the first page
 * answered or failed -- a failure leaves the conversation as it was without transfers, and says
 * nothing. `hasMore` where the list holds older bookings than the pages asked for.
 *
 * `enabled`: the member's own switch (Einstellungen › Nachrichten, "Überweisungen im Chat und per
 * E-Mail", on by default). Off, nothing is asked, and the conversation keeps to its messages.
 *
 * @param apolloClient
 * @param {{ gradidoID: string, communityUuid: string | null }} member
 * @param {{ enabled?: boolean }} [options]
 */
export const useChatTransfers = (apolloClient, member, { enabled = true } = {}) => {
  const transfers = ref([])
  const settled = ref(!enabled)
  const hasMore = ref(false)
  let pages = 0

  /** The next older page, in front of what is there; a booking already there is not taken twice. */
  const askNextPage = async () => {
    const { data } = await apolloClient.query({
      query: transactionsQuery,
      variables: {
        currentPage: pages + 1,
        pageSize: CHAT_TRANSFER_PAGE_SIZE,
        order: 'DESC',
        counterparty: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
      },
      fetchPolicy: 'no-cache',
    })
    const list = data?.transactionList
    pages += 1
    const held = new Set(transfers.value.map((booking) => booking.id))
    const older = (list?.transactions ?? [])
      .filter((booking) => isTransfer(booking) && !held.has(booking.id))
      .reverse()
    transfers.value = [...older, ...transfers.value]
    // The list's own count: narrowed, the number of bookings shared with that person.
    hasMore.value = pages * CHAT_TRANSFER_PAGE_SIZE < (list?.balance?.count ?? 0)
  }

  if (enabled) {
    askNextPage()
      .catch(() => {})
      .finally(() => {
        settled.value = true
      })
  }

  /** The next older page; throws where it did not come, for the thread to say so. */
  const loadOlderTransfers = () => askNextPage()

  return { transfers, settled, hasMore, loadOlderTransfers }
}
