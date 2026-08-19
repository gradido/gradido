// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'
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

/**
 * ⛔ Every instance is made inside a scope that is thrown away afterwards. The composable
 * registers two watchers on the shared `state`, and without a scope nothing ever stops
 * them: by the end of the file a dozen instances from finished tests would still be
 * listening, and each of them would answer the next `gradidoID` change by writing storage
 * the test never asked for.
 */
const scopes = []
const makePrefs = () => {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useCalculatorPrefs())
}

describe('useCalculatorPrefs', () => {
  beforeEach(() => {
    state.gradidoID = 'user-one'
    window.localStorage.clear()
  })

  afterEach(() => {
    while (scopes.length) {
      scopes.pop().stop()
    }
    vi.restoreAllMocks()
  })

  it('starts on the values the PWA starts on', () => {
    const prefs = makePrefs()
    expect(prefs.percent.value).toBe(100)
    expect(prefs.factor.value).toBe(1)
    expect(prefs.currency.value).toBe('€')
    expect(prefs.showDankBar.value).toBe(true)
    expect(prefs.sound.value).toBe(true)
  })

  it('writes a change and reads it back next time', async () => {
    const first = makePrefs()
    first.percent.value = 60
    first.currency.value = 'THB'
    first.factor.value = 5
    first.sound.value = false
    await nextTick()

    const second = makePrefs()
    expect(second.percent.value).toBe(60)
    expect(second.currency.value).toBe('THB')
    expect(second.factor.value).toBe(5)
    expect(second.sound.value).toBe(false)
  })

  it('does not carry one till over to the next member on the same device', async () => {
    const first = makePrefs()
    first.percent.value = 60
    await nextTick()

    state.gradidoID = 'user-two'
    expect(makePrefs().percent.value).toBe(100)
  })

  /**
   * ⛔ The route guard lets anybody with a `token` through, while `gradidoID` arrives with
   * the login answer. Opening the calculator in that gap used to read nothing -- and the
   * first change would then write defaults over settings the till had had for weeks.
   */
  it('picks the stored settings up when the ID arrives late', async () => {
    state.gradidoID = null
    window.localStorage.setItem(KEY, JSON.stringify({ percent: 60, currency: 'THB' }))

    const prefs = makePrefs()
    expect(prefs.percent.value).toBe(100)

    state.gradidoID = 'user-one'
    await nextTick()

    expect(prefs.percent.value).toBe(60)
    expect(prefs.currency.value).toBe('THB')
  })

  it('does not overwrite what was stored before the ID arrived', async () => {
    state.gradidoID = null
    window.localStorage.setItem(KEY, JSON.stringify({ percent: 60, currency: 'THB' }))

    const prefs = makePrefs()
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
    const prefs = makePrefs()
    prefs.percent.value = 60
    await nextTick()

    state.gradidoID = 'user-two'
    await nextTick()

    expect(prefs.percent.value).toBe(100)
  })

  it('remembers nothing without an ID', async () => {
    state.gradidoID = null
    const prefs = makePrefs()
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
    const prefs = makePrefs()
    expect(prefs.percent.value).toBe(100)
    expect(prefs.factor.value).toBe(5)
    expect(prefs.currency.value).toBe('€')
    expect(prefs.showDankBar.value).toBe(true)
  })

  it.each([[-1], [101]])('refuses a share of %s from storage', (percent) => {
    window.localStorage.setItem(KEY, JSON.stringify({ percent }))
    expect(makePrefs().percent.value).toBe(100)
  })

  /**
   * ⛔ The guard that holds the save watcher off while the settings are being reloaded. It
   * only works because that watcher is `flush: 'sync'` -- on Vue's default flush the
   * callback runs after `restore` has set the flag back, sees `false`, and writes. What it
   * writes is a full blob of DEFAULTS under the new member's key, for somebody who has never
   * opened the settings.
   *
   * ⚠️ Measured by removing `{ flush: 'sync' }`: this test falls, the others stay green.
   */
  it('writes nothing for a member who has stored nothing when the ID changes', async () => {
    const first = makePrefs()
    first.percent.value = 60
    await nextTick()
    expect(window.localStorage.getItem(KEY)).not.toBeNull()

    state.gradidoID = 'user-two'
    await nextTick()

    expect(window.localStorage.getItem('calculator-prefs:user-two')).toBeNull()
    expect(first.percent.value).toBe(100)
  })

  it('opens on the defaults when storage refuses to work', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => makePrefs()).not.toThrow()
    expect(makePrefs().percent.value).toBe(100)
  })
})
