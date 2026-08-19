// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PARKED_AMOUNT_TTL_MS, useParkedAmount } from './useParkedAmount'

/**
 * The amount that survives the jump out of the wallet and back.
 *
 * ⛔ Every case here is about an amount that must NOT turn up: not after ten minutes, not for
 * the next person on a shared till, not a second time after it was used. Those are the ones
 * that stay green forever once they break, because nothing else in the app would notice a
 * stale amount -- it looks exactly like a fresh one.
 */

const state = { gradidoID: 'user-one' }
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

const KEY = 'calculator-parked-amount:user-one'

describe('useParkedAmount', () => {
  beforeEach(() => {
    state.gradidoID = 'user-one'
    window.localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('hands a parked amount back', () => {
    const { park, readParked } = useParkedAmount()
    expect(park(6.3)).toBe(true)
    expect(readParked()).toBe(6.3)
  })

  it('stores the raw number, never a formatted one', () => {
    // ⛔ A stored "1.234,50" would be a different number depending on the interface
    // language, and the language can change between parking and redeeming.
    useParkedAmount().park(1234.5)
    expect(JSON.parse(window.localStorage.getItem(KEY)).amount).toBe(1234.5)
  })

  it('forgets an amount that is older than the window', () => {
    const { park, readParked } = useParkedAmount()
    park(6.3)
    vi.advanceTimersByTime(PARKED_AMOUNT_TTL_MS + 1)
    expect(readParked()).toBeNull()
  })

  it('still offers it just inside the window', () => {
    const { park, readParked } = useParkedAmount()
    park(6.3)
    vi.advanceTimersByTime(PARKED_AMOUNT_TTL_MS - 1000)
    expect(readParked()).toBe(6.3)
  })

  /** On a shared till the next person must not inherit somebody else's total. */
  it('does not hand one member the amount of another', () => {
    useParkedAmount().park(6.3)
    state.gradidoID = 'user-two'
    expect(useParkedAmount().readParked()).toBeNull()
  })

  /**
   * ⛔ No shared fallback key. `gradidoID` really is null between the login and its answer,
   * and one shared key would hand one till's total to whoever signs in next.
   */
  it('remembers nothing at all without an ID', () => {
    state.gradidoID = null
    const { park, readParked } = useParkedAmount()
    expect(park(6.3)).toBe(false)
    expect(readParked()).toBeNull()
    expect(window.localStorage.length).toBe(0)
  })

  it.each([[0], [-5], [Number.NaN], [Number.POSITIVE_INFINITY], [null]])(
    'refuses to park %s',
    (amount) => {
      expect(useParkedAmount().park(amount)).toBe(false)
      expect(window.localStorage.getItem(KEY)).toBeNull()
    },
  )

  it('clears on request without waiting for the window', () => {
    const { park, clearParked, readParked } = useParkedAmount()
    park(6.3)
    clearParked()
    expect(readParked()).toBeNull()
  })

  it.each([['not json'], ['{}'], ['{"amount":"6.30"}'], ['{"amount":6.3}'], ['null']])(
    'gives null for a stored value of %s rather than throwing',
    (stored) => {
      window.localStorage.setItem(KEY, stored)
      expect(useParkedAmount().readParked()).toBeNull()
    },
  )

  /** Storage switched off must cost the payment nothing -- an empty field is the small loss. */
  it('survives storage that refuses to work', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { park, readParked, clearParked } = useParkedAmount()
    expect(park(6.3)).toBe(false)
    expect(readParked()).toBeNull()
    expect(() => clearParked()).not.toThrow()
  })
})
