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

  it('lets an older page that failed say so, keeping what it holds', async () => {
    const client = clientAnswering(answer([booking(20)], 30), new Error('Network error'))
    const { transfers, loadOlderTransfers } = useChatTransfers(client, LENA)
    await flushPromises()
    await expect(loadOlderTransfers()).rejects.toThrow('Network error')
    expect(transfers.value.map((b) => b.id)).toEqual([20])
  })
})
