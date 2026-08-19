// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useCalculatorPrefs } from './useCalculatorPrefs'

/** What the till remembers about itself -- on the device, bound to whoever is signed in. */

const state = { gradidoID: 'user-one' }
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

const KEY = 'calculator-prefs:user-one'

describe('useCalculatorPrefs', () => {
  beforeEach(() => {
    state.gradidoID = 'user-one'
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts on the values the PWA starts on', () => {
    const prefs = useCalculatorPrefs()
    expect(prefs.percent.value).toBe(100)
    expect(prefs.factor.value).toBe(1)
    expect(prefs.currency.value).toBe('€')
    expect(prefs.showDankBar.value).toBe(true)
    expect(prefs.sound.value).toBe(true)
  })

  it('writes a change and reads it back next time', async () => {
    const first = useCalculatorPrefs()
    first.percent.value = 60
    first.currency.value = 'THB'
    first.factor.value = 5
    first.sound.value = false
    await nextTick()

    const second = useCalculatorPrefs()
    expect(second.percent.value).toBe(60)
    expect(second.currency.value).toBe('THB')
    expect(second.factor.value).toBe(5)
    expect(second.sound.value).toBe(false)
  })

  it('does not carry one till over to the next member on the same device', async () => {
    const first = useCalculatorPrefs()
    first.percent.value = 60
    await nextTick()

    state.gradidoID = 'user-two'
    expect(useCalculatorPrefs().percent.value).toBe(100)
  })

  it('remembers nothing without an ID', async () => {
    state.gradidoID = null
    const prefs = useCalculatorPrefs()
    prefs.percent.value = 60
    await nextTick()
    expect(window.localStorage.length).toBe(0)
  })

  /**
   * ⚠️ Each value is checked on its own: a file with one unusable entry keeps the rest.
   * All-or-nothing would throw away four good settings for one bad one.
   */
  it('keeps the usable half of a damaged file', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ percent: 'sixty', factor: 5, currency: '', showDankBar: 'yes' }),
    )
    const prefs = useCalculatorPrefs()
    expect(prefs.percent.value).toBe(100)
    expect(prefs.factor.value).toBe(5)
    expect(prefs.currency.value).toBe('€')
    expect(prefs.showDankBar.value).toBe(true)
  })

  it.each([[-1], [101]])('refuses a share of %s from storage', (percent) => {
    window.localStorage.setItem(KEY, JSON.stringify({ percent }))
    expect(useCalculatorPrefs().percent.value).toBe(100)
  })

  it('opens on the defaults when storage refuses to work', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => useCalculatorPrefs()).not.toThrow()
    expect(useCalculatorPrefs().percent.value).toBe(100)
  })
})
