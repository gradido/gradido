// AI-GENERATED — not an architecture reference
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { OWN_TRANSFER_PAGES_MOST, OWN_TRANSFER_PAGE_SIZE, useOwnTransfers } from './useOwnTransfers'

const MINUTE = 60 * 1000

/** When the call began, in these tests. */
const BEGAN = new Date('2026-11-05T17:00:00.000Z').getTime()
const minutesAfter = (minutes) => new Date(BEGAN + minutes * MINUTE).toISOString()

const CARLA = { communityUuid: 'home-uuid', gradidoID: 'carla-id', alias: 'Carla-Sonne' }

/** A row of the member's own booking list: `n` its id. */
const row = (n, { typeId = 'SEND', at = minutesAfter(10), linkedUser = CARLA } = {}) => ({
  id: n,
  typeId,
  amount: typeId === 'SEND' ? '-10' : '10',
  balanceDate: at,
  memo: `memo ${n}`,
  linkedUser,
})

/** A page of the list as the server answers: `count` the bookings of the whole list. */
const page = (rows, count = rows.length) => ({
  data: { transactionList: { balance: { count }, transactions: rows } },
})

/** A client that answers each page from `pages` (1 first); a missing page is an error. */
const clientWith = (pages) => ({
  query: vi.fn(async ({ variables }) => {
    const answer = pages[variables.currentPage]
    if (!answer) throw new Error(`no page ${variables.currentPage}`)
    return typeof answer === 'function' ? answer() : answer
  }),
})

describe('useOwnTransfers', () => {
  it('asks nothing until it is asked', async () => {
    const client = clientWith({})
    const { transfers, settled, failed } = useOwnTransfers(client)
    await flushPromises()

    expect(client.query).not.toHaveBeenCalled()
    expect(transfers.value).toBeNull()
    expect(settled.value).toBe(false)
    expect(failed.value).toBe(false)
  })

  // ⛔ The whole list of one's own bookings is nothing to keep in the cache beside the booking
  // page's own answer: `no-cache`, and not narrowed to anybody.
  it('asks the member’s own booking list, newest first, a page of 25, past the cache', async () => {
    const client = clientWith({ 1: page([row(1)]) })
    const { ask } = useOwnTransfers(client)

    await ask(BEGAN)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenCalledWith({
      query: transactionsQuery,
      variables: { currentPage: 1, pageSize: 25, order: 'DESC', counterparty: null },
      fetchPolicy: 'no-cache',
    })
    expect(OWN_TRANSFER_PAGE_SIZE).toBe(25)
  })

  it('keeps only what the member sent to a person', async () => {
    const decay = { ...row(-1, { typeId: 'DECAY', at: minutesAfter(60) }), linkedUser: null }
    const client = clientWith({
      1: page([
        decay,
        row(5),
        row(4, { typeId: 'RECEIVE' }),
        row(3, { typeId: 'CREATION', linkedUser: null }),
        row(2, { linkedUser: null }),
        row(1, { linkedUser: { communityUuid: 'home-uuid' } }),
      ]),
    })
    const { ask, transfers } = useOwnTransfers(client)

    await ask(BEGAN)

    expect(transfers.value.map((booking) => booking.id)).toEqual([5])
  })

  // No line stands over a thank-you on its way: nothing is known before every page is in.
  it('knows nothing while the answer is out, and the transfers once it is in', async () => {
    let answer
    const client = clientWith({
      1: () =>
        new Promise((resolve) => {
          answer = () => resolve(page([row(1)]))
        }),
    })
    const { ask, transfers, settled } = useOwnTransfers(client)

    ask(BEGAN)
    await flushPromises()
    expect(transfers.value).toBeNull()
    expect(settled.value).toBe(false)

    answer()
    await flushPromises()
    expect(transfers.value.map((booking) => booking.id)).toEqual([1])
    expect(settled.value).toBe(true)
  })

  describe('another page', () => {
    const full = (from, at) =>
      Array.from({ length: OWN_TRANSFER_PAGE_SIZE }, (_, i) => row(from - i, { at }))

    it('while the oldest booking of the last one is younger than the beginning', async () => {
      const client = clientWith({
        1: page(full(100, minutesAfter(20)), 60),
        2: page([row(75, { at: minutesAfter(15) }), row(74, { at: minutesAfter(-5) })], 60),
      })
      const { ask, transfers } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(client.query).toHaveBeenCalledTimes(2)
      expect(client.query.mock.calls[1][0].variables).toEqual({
        currentPage: 2,
        pageSize: 25,
        order: 'DESC',
        counterparty: null,
      })
      expect(transfers.value).toHaveLength(OWN_TRANSFER_PAGE_SIZE + 2)
    })

    it('not where the oldest booking of the last one is older than the beginning', async () => {
      const rows = [...full(100, minutesAfter(20)).slice(0, 24), row(76, { at: minutesAfter(-1) })]
      const client = clientWith({ 1: page(rows, 60), 2: page([row(75)], 60) })
      const { ask } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(client.query).toHaveBeenCalledTimes(1)
    })

    // A booking at the very moment the call began counts as thanked: the next page may hold more.
    it('where the oldest booking of the last one lies at the very beginning', async () => {
      const client = clientWith({
        1: page(full(100, minutesAfter(0)), 60),
        2: page([row(75, { at: minutesAfter(-1) })], 60),
      })
      const { ask, failed } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(client.query).toHaveBeenCalledTimes(2)
      expect(failed.value).toBe(false)
    })

    it('not where the list holds no more than the pages asked for', async () => {
      const client = clientWith({ 1: page(full(100, minutesAfter(20)), 25), 2: page([row(75)]) })
      const { ask, transfers } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(client.query).toHaveBeenCalledTimes(1)
      expect(transfers.value).toHaveLength(OWN_TRANSFER_PAGE_SIZE)
    })

    it('not after an empty page', async () => {
      const client = clientWith({ 1: page([], 60), 2: page([row(75)], 60) })
      const { ask, transfers } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(client.query).toHaveBeenCalledTimes(1)
      expect(transfers.value).toEqual([])
    })

    it('ten pages at most, and what was loaded counts', async () => {
      const pages = {}
      for (let n = 1; n <= 12; n++) pages[n] = page(full(1000 - n * 25, minutesAfter(30)), 1000)
      const client = clientWith(pages)
      const { ask, transfers, failed } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(OWN_TRANSFER_PAGES_MOST).toBe(10)
      expect(client.query).toHaveBeenCalledTimes(10)
      expect(client.query.mock.calls.at(-1)[0].variables.currentPage).toBe(10)
      expect(transfers.value).toHaveLength(10 * OWN_TRANSFER_PAGE_SIZE)
      expect(failed.value).toBe(false)
    })
  })

  // Where a page did not come, its empty list is not "nobody thanked": nothing is known, and
  // nothing is said about it.
  describe('where a page does not come', () => {
    it('knows nothing, and says it failed', async () => {
      const client = clientWith({})
      const { ask, transfers, settled, failed } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(transfers.value).toBeNull()
      expect(failed.value).toBe(true)
      expect(settled.value).toBe(true)
    })

    it('knows nothing either where an earlier page came', async () => {
      const rows = Array.from({ length: 25 }, (_, i) => row(100 - i, { at: minutesAfter(20) }))
      const client = clientWith({ 1: page(rows, 60) })
      const { ask, transfers, failed } = useOwnTransfers(client)

      await ask(BEGAN)

      expect(client.query).toHaveBeenCalledTimes(2)
      expect(transfers.value).toBeNull()
      expect(failed.value).toBe(true)
    })
  })

  // Read once: while the answer is out, and after it.
  it('asks only once, also when asked again for another beginning', async () => {
    let answer
    const client = clientWith({
      1: () =>
        new Promise((resolve) => {
          answer = () => resolve(page([row(1)]))
        }),
    })
    const { ask } = useOwnTransfers(client)

    ask(BEGAN)
    ask(BEGAN - 60 * MINUTE)
    await flushPromises()
    answer()
    await flushPromises()
    await ask(BEGAN - 120 * MINUTE)

    expect(client.query).toHaveBeenCalledTimes(1)
  })

  it('does not ask again after a page failed', async () => {
    const client = clientWith({})
    const { ask } = useOwnTransfers(client)

    await ask(BEGAN)
    await ask(BEGAN)

    expect(client.query).toHaveBeenCalledTimes(1)
  })
})
