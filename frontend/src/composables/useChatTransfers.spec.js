// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { CHAT_TRANSFER_PAGE_SIZE, useChatTransfers } from './useChatTransfers'
import { transactionsQuery } from '@/graphql/transactions.graphql'

const LENA = { gradidoID: 'lena-id', communityUuid: 'home-uuid' }

/** The narrowed booking list as the server answers: newest first, `count` of the whole list. */
const answer = (rows, count = rows.length) => ({
  data: { transactionList: { balance: { count }, transactions: rows } },
})
const booking = (id, typeId = 'RECEIVE') => ({
  id,
  typeId,
  amount: typeId === 'SEND' ? '-10' : '10',
  balanceDate: `2026-09-${String(id).padStart(2, '0')}T10:00:00.000Z`,
  memo: `memo ${id}`,
})

const clientAnswering = (...answers) => {
  const query = vi.fn()
  for (const next of answers) {
    query.mockImplementationOnce(async () => {
      if (next instanceof Error) throw next
      return next
    })
  }
  return { query }
}

describe('useChatTransfers', () => {
  it('asks the booking list narrowed to the person, newest first, past the cache', async () => {
    const client = clientAnswering(answer([]))
    useChatTransfers(client, LENA)
    expect(client.query).toHaveBeenCalledWith({
      query: transactionsQuery,
      variables: {
        currentPage: 1,
        pageSize: CHAT_TRANSFER_PAGE_SIZE,
        order: 'DESC',
        counterparty: LENA,
      },
      fetchPolicy: 'no-cache',
    })
  })

  it('names a member of this community without a community as the server reads it: null', () => {
    const client = clientAnswering(answer([]))
    useChatTransfers(client, { gradidoID: 'lena-id' })
    expect(client.query.mock.calls[0][0].variables.counterparty).toEqual({
      gradidoID: 'lena-id',
      communityUuid: null,
    })
  })

  it('keeps the transfers either way, oldest first, and nothing else', async () => {
    const client = clientAnswering(
      answer([booking(9, 'DECAY'), booking(8, 'SEND'), booking(5), booking(3, 'CREATION')]),
    )
    const { transfers, settled, hasMore } = useChatTransfers(client, LENA)
    expect(settled.value).toBe(false)
    await flushPromises()

    expect(settled.value).toBe(true)
    expect(transfers.value.map((b) => b.id)).toEqual([5, 8])
    expect(hasMore.value).toBe(false)
  })

  it('knows of older pages by the list’s count, and puts them in front, each booking once', async () => {
    const newest = Array.from({ length: CHAT_TRANSFER_PAGE_SIZE }, (_, i) => booking(40 - i))
    const client = clientAnswering(
      answer(newest, CHAT_TRANSFER_PAGE_SIZE + 2),
      // A booking arrived meanwhile: the second page repeats the last one of the first.
      answer([booking(16), booking(15), booking(14)], CHAT_TRANSFER_PAGE_SIZE + 3),
    )
    const { transfers, hasMore, loadOlderTransfers } = useChatTransfers(client, LENA)
    await flushPromises()
    expect(hasMore.value).toBe(true)

    await loadOlderTransfers()
    expect(client.query.mock.calls[1][0].variables.currentPage).toBe(2)
    expect(transfers.value.map((b) => b.id)).toEqual([
      14,
      15,
      ...Array.from({ length: CHAT_TRANSFER_PAGE_SIZE }, (_, i) => 16 + i),
    ])
    expect(hasMore.value).toBe(false)
  })

  it('leaves the conversation without transfers, and quiet, where the first page fails', async () => {
    const client = clientAnswering(new Error('Network error'))
    const { transfers, settled, hasMore } = useChatTransfers(client, LENA)
    await flushPromises()
    expect(settled.value).toBe(true)
    expect(transfers.value).toEqual([])
    expect(hasMore.value).toBe(false)
  })

  // The member's own switch (Einstellungen › Nachrichten): off, nothing is asked.
  it('asks nothing where the member switched transfers off, and is settled at once', () => {
    const client = clientAnswering(answer([booking(20)]))
    const { transfers, settled, hasMore } = useChatTransfers(client, LENA, { enabled: false })
    expect(client.query).not.toHaveBeenCalled()
    expect(settled.value).toBe(true)
    expect(transfers.value).toEqual([])
    expect(hasMore.value).toBe(false)
  })

  it('lets an older page that failed say so, keeping what it holds', async () => {
    const client = clientAnswering(answer([booking(20)], 30), new Error('Network error'))
    const { transfers, loadOlderTransfers } = useChatTransfers(client, LENA)
    await flushPromises()
    await expect(loadOlderTransfers()).rejects.toThrow('Network error')
    expect(transfers.value.map((b) => b.id)).toEqual([20])
  })

  /**
   * The reaction to a transfer (Bernd, 11.10.2026): the member set it or took it back, at the
   * booking's bubble or in the booking list -- the booking the conversation holds gets it.
   */
  describe('takeReaction', () => {
    it('puts the reaction on the booking with that id, and on no other', async () => {
      const client = clientAnswering(answer([booking(8, 'SEND'), booking(5), booking(3)]))
      const { transfers, takeReaction } = useChatTransfers(client, LENA)
      await flushPromises()

      takeReaction(5, '👍')

      expect(transfers.value.map((b) => [b.id, b.reaction])).toEqual([
        [3, undefined],
        [5, '👍'],
        [8, undefined],
      ])
      // Everything else of the booking stays.
      expect(transfers.value[1]).toEqual({ ...booking(5), reaction: '👍' })
    })

    it('takes a reaction off again: none', async () => {
      const client = clientAnswering(answer([{ ...booking(5), reaction: '👍' }]))
      const { transfers, takeReaction } = useChatTransfers(client, LENA)
      await flushPromises()

      takeReaction(5, null)

      expect(transfers.value[0].reaction).toBeNull()
    })

    // The list is replaced, not changed in place: what was drawn from it is drawn again.
    it('hands out a new list, and a new booking, for what changed', async () => {
      const client = clientAnswering(answer([booking(5), booking(3)]))
      const { transfers, takeReaction } = useChatTransfers(client, LENA)
      await flushPromises()
      const before = transfers.value

      takeReaction(5, '👍')

      expect(transfers.value).not.toBe(before)
      expect(transfers.value[1]).not.toBe(before[1])
      expect(transfers.value[0]).toBe(before[0])
      expect(before[1].reaction).toBeUndefined()
    })

    it('passes over a booking the conversation does not hold, and leaves its list as it is', async () => {
      const client = clientAnswering(answer([booking(5)]))
      const { transfers, takeReaction } = useChatTransfers(client, LENA)
      await flushPromises()
      const before = transfers.value

      takeReaction(99, '👍')

      expect(transfers.value).toBe(before)
    })

    // An older page asked for meanwhile must not put the earlier state back.
    it('keeps the reaction when an older page arrives after it', async () => {
      const client = clientAnswering(
        answer([booking(20)], 30),
        // The older page repeats the booking, as it stood before the reaction.
        answer([booking(20), booking(19)], 30),
      )
      const { transfers, loadOlderTransfers, takeReaction } = useChatTransfers(client, LENA)
      await flushPromises()

      const older = loadOlderTransfers()
      takeReaction(20, '👍')
      await older

      expect(transfers.value.map((b) => [b.id, b.reaction])).toEqual([
        [19, undefined],
        [20, '👍'],
      ])
    })
  })
})
