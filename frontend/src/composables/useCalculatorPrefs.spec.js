// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { useCalculatorPrefs } from './useCalculatorPrefs'

/** What the till remembers about itself -- on the device, bound to whoever is signed in. */

/**
 * ⚠️ `reactive`, not a plain object: vuex hands out a reactive state, and the composable
 * watches `gradidoID` on it. A plain stand-in would never fire that watcher -- the tests
 * below would pass against a version that reads the ID exactly once, which is the fault
 * they exist for.
 */
const state = reactive({ gradidoID: 'user-one' })
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

  /**
   * ⛔ The route guard lets anybody with a `token` through, while `gradidoID` arrives with
   * the login answer. Opening the calculator in that gap used to read nothing -- and the
   * first change would then write defaults over settings the till had had for weeks.
   */
  it('picks the stored settings up when the ID arrives late', async () => {
    state.gradidoID = null
    window.localStorage.setItem(KEY, JSON.stringify({ percent: 60, currency: 'THB' }))

    const prefs = useCalculatorPrefs()
    expect(prefs.percent.value).toBe(100)

    state.gradidoID = 'user-one'
    await nextTick()

    expect(prefs.percent.value).toBe(60)
    expect(prefs.currency.value).toBe('THB')
  })

  it('does not overwrite what was stored before the ID arrived', async () => {
    state.gradidoID = null
    window.localStorage.setItem(KEY, JSON.stringify({ percent: 60, currency: 'THB' }))

    const prefs = useCalculatorPrefs()
    state.gradidoID = 'user-one'
    await nextTick()
    prefs.sound.value = false
    await nextTick()

    const stored = JSON.parse(window.localStorage.getItem(KEY))
    expect(stored.percent).toBe(60)
    expect(stored.currency).toBe('THB')
    expect(stored.sound).toBe(false)
  })

  it('lets go of one member settings when another signs in', async () => {
    const prefs = useCalculatorPrefs()
    prefs.percent.value = 60
    await nextTick()

    state.gradidoID = 'user-two'
    await nextTick()

    expect(prefs.percent.value).toBe(100)
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
