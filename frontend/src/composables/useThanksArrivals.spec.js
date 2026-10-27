// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { walletStore } from '@test/walletStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import {
  THANKS_ARRIVAL_PAGE_SIZE,
  THANKS_ARRIVAL_PATIENCE_MS,
  useThanksArrivals,
} from './useThanksArrivals'

// What the overview asked, and the two ways an answer can come back.
const asked = vi.hoisted(() => [])
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (document, variables, options) => {
    const question = { document, variables, options, result: null, error: null }
    asked.push(question)
    return {
      onResult: (callback) => {
        question.result = callback
      },
      onError: (callback) => {
        question.error = callback
      },
    }
  },
}))

const MINUTE = 60 * 1000

let wrapper = null

// The composable as the overview uses it: in a component's setup, with a store.
const open = (gradidoID = 'member-1') => {
  let held
  wrapper = mount(
    {
      setup() {
        held = useThanksArrivals()
        return () => null
      },
    },
    { global: { plugins: [walletStore({ gradidoID })] } },
  )
  return held
}

/** A booking as the list carries it; a thank-you received unless said otherwise. */
const booking = (id, extra = {}) => ({
  id,
  typeId: 'RECEIVE',
  amount: '10',
  balanceDate: new Date(Date.now() - id * MINUTE).toISOString(),
  memo: 'Danke',
  linkedUser: { alias: `giver${id}`, gradidoID: `giver-${id}`, communityUuid: 'home-uuid' },
  reaction: null,
  canReact: true,
  ...extra,
})
const answer = (transactions) =>
  asked.at(-1).result({ data: { transactionList: { balance: null, transactions } } })
const ids = (held) => held.thanks.value.map((one) => one.id)

beforeEach(() => {
  vi.useFakeTimers()
  asked.length = 0
  window.localStorage.clear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
})

describe('useThanksArrivals', () => {
  it('asks for the member’s ten newest bookings, past the cache, of the whole account', () => {
    open()

    expect(asked).toHaveLength(1)
    expect(asked[0].document).toBe(transactionsQuery)
    expect(THANKS_ARRIVAL_PAGE_SIZE).toBe(10)
    expect(asked[0].variables).toEqual({ currentPage: 1, pageSize: 10, order: 'DESC' })
    expect(asked[0].options).toEqual({ fetchPolicy: 'no-cache' })
  })

  it('holds the overview back until the answer is in', () => {
    const held = open()
    expect(held.settled.value).toBe(false)

    answer([booking(1)])

    expect(held.settled.value).toBe(true)
    expect(ids(held)).toEqual([1])
  })

  it('chooses them by the rule: received, may be answered, no reaction yet, the newest three', () => {
    const held = open()

    answer([
      booking(1, { typeId: 'SEND', canReact: false }),
      booking(2, { reaction: '❤️' }),
      booking(3),
      booking(4, { canReact: false }),
      booking(5),
      booking(6),
      booking(7),
    ])

    expect(ids(held)).toEqual([3, 5, 6])
  })

  it('settles with nothing to show where there is no thank-you to show', () => {
    const held = open()

    answer([booking(1, { typeId: 'CREATION' })])

    expect(held.settled.value).toBe(true)
    expect(held.thanks.value).toEqual([])
  })

  it('leaves out what the member put aside on this device', () => {
    window.localStorage.setItem('thanks-nudge:member-1:arrival:1', '1')
    const held = open()

    answer([booking(1), booking(2)])

    expect(ids(held)).toEqual([2])
  })

  // The threshold measured from below, too: a wait of no length would pass a case above it alone.
  it('waits no longer than its patience, and then has nothing to show', () => {
    const held = open()

    vi.advanceTimersByTime(THANKS_ARRIVAL_PATIENCE_MS - 1)
    expect(held.settled.value).toBe(false)

    vi.advanceTimersByTime(1)
    expect(held.settled.value).toBe(true)
    expect(held.thanks.value).toEqual([])
  })

  it('waits as long as the layout waits for the balance', () => {
    expect(THANKS_ARRIVAL_PATIENCE_MS).toBe(1500)
  })

  // ⛔ The tiles are painted by then; a tile that came now would push them all down.
  it('changes nothing when the answer comes after its patience', () => {
    const held = open()
    vi.advanceTimersByTime(THANKS_ARRIVAL_PATIENCE_MS)

    answer([booking(1)])

    expect(held.thanks.value).toEqual([])
  })

  it('changes nothing when a second answer comes', () => {
    const held = open()
    answer([])

    answer([booking(1)])

    expect(held.thanks.value).toEqual([])
  })

  it('takes a failed question as nothing to show, and waits no longer', () => {
    const held = open()

    asked.at(-1).error(new Error('Network error'))

    expect(held.settled.value).toBe(true)
    expect(held.thanks.value).toEqual([])
  })

  // Only an answer counts: a report without the list is not "no thank-you".
  it('does not take a report without the list as the answer', () => {
    const held = open()

    asked.at(-1).result({ data: {} })
    asked.at(-1).result({ data: null })

    expect(held.settled.value).toBe(false)
  })

  // Signing out empties the store while the overview still stands.
  it('asks nothing and waits for nothing while nobody is signed in', () => {
    const held = open(null)

    expect(asked).toHaveLength(0)
    expect(held.settled.value).toBe(true)
    expect(held.thanks.value).toEqual([])
  })

  it('lets go of its patience when the overview goes', () => {
    open()
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    wrapper = null

    expect(vi.getTimerCount()).toBe(0)
  })
})
