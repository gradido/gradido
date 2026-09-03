// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import { createStore } from 'vuex'
import { useRightSidePref } from './useRightSidePref'

const POSITIONS = ['bookings', 'contacts']

/**
 * A component, because the composable reads the vuex store and watches it -- calling it
 * outside a setup scope would test something the wallet never runs.
 */
const mountPref = (gradidoID, routeKey = '/overview', fallback = 'bookings') => {
  const store = createStore({ state: { gradidoID } })
  const key = ref(routeKey)
  const back = ref(fallback)
  let api
  const wrapper = mount(
    {
      template: '<div>{{ choice }}</div>',
      setup() {
        api = useRightSidePref(
          computed(() => key.value),
          computed(() => back.value),
          POSITIONS,
        )
        return api
      },
    },
    { global: { plugins: [store] } },
  )
  return { wrapper, store, key, back, api: () => api }
}

describe('useRightSidePref', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("stands on the route's own default while nothing is remembered", () => {
    const { wrapper } = mountPref('member-1', '/overview', 'bookings')
    expect(wrapper.text()).toBe('bookings')
    wrapper.unmount()
  })

  it('lets what is remembered beat the default', () => {
    window.localStorage.setItem('right-side:member-1:/overview', 'contacts')
    const { wrapper } = mountPref('member-1')
    expect(wrapper.text()).toBe('contacts')
    wrapper.unmount()
  })

  it('writes the choice under member and route', async () => {
    const { wrapper, api } = mountPref('member-1', '/transactions', 'contacts')
    api().choose('bookings')
    await nextTick()

    expect(window.localStorage.getItem('right-side:member-1:/transactions')).toBe('bookings')
    expect(wrapper.text()).toBe('bookings')
    wrapper.unmount()
  })

  /**
   * ⛔ One answer per route. Somebody who wants bookings beside the overview and contacts
   * beside the send form is expressing two wishes, not one -- a single key would make the
   * second overwrite the first.
   */
  it('keeps the routes apart', async () => {
    const { wrapper, key, api } = mountPref('member-1', '/overview', 'bookings')
    api().choose('contacts')
    await nextTick()

    key.value = '/transactions'
    await nextTick()

    // The other route has nothing stored, so its own default answers.
    expect(wrapper.text()).toBe('bookings')
    expect(window.localStorage.getItem('right-side:member-1:/overview')).toBe('contacts')
    expect(window.localStorage.getItem('right-side:member-1:/transactions')).toBeNull()
    wrapper.unmount()
  })

  /**
   * ⛔ Nothing is written and nothing is read without a member. `gradidoID` is null before
   * the login answer arrives and again after signing out; one shared key would hand the
   * next person on a shared device the previous one's column.
   */
  it('remembers nothing while nobody is named', async () => {
    window.localStorage.setItem('right-side:null:/overview', 'contacts')
    const { wrapper, api } = mountPref(null)

    expect(wrapper.text()).toBe('bookings')

    api().choose('contacts')
    await nextTick()

    // Still turns for this visit -- refusing to remember is not refusing to work.
    expect(wrapper.text()).toBe('contacts')
    expect(window.localStorage.getItem('right-side:null:/overview')).toBe('contacts')
    expect(window.localStorage.length).toBe(1)
    wrapper.unmount()
  })

  /**
   * ⛔ The two halves in SEQUENCE, which is where the defect lived: each was tested alone
   * and both passed. A switch flicked inside the login gap could not be written, and the
   * watcher then ran `read()` the moment the id landed, found nothing stored, and put the
   * column back on the route's default -- under the member's hand, and unremembered.
   */
  it('keeps a choice made before the member was named, and writes it when they are', async () => {
    const { wrapper, store, api } = mountPref(null, '/send', 'contacts')

    api().choose('bookings')
    await nextTick()
    expect(wrapper.text()).toBe('bookings')

    store.state.gradidoID = 'member-1'
    await nextTick()

    expect(wrapper.text()).toBe('bookings')
    expect(window.localStorage.getItem('right-side:member-1:/send')).toBe('bookings')
    wrapper.unmount()
  })

  /**
   * ⛔ And the click WINS over what the device remembers. Adopting it only where nothing
   * was stored helped exactly the members who had never used the switch on that route --
   * everybody else still watched the column snap back under their hand, which is the whole
   * symptom this exists to remove. The stored value is older than the gesture.
   */
  it('lets the gap click beat what the device already held', async () => {
    window.localStorage.setItem('right-side:member-1:/send', 'contacts')
    const { wrapper, store, api } = mountPref(null, '/send', 'contacts')

    api().choose('bookings')
    await nextTick()

    store.state.gradidoID = 'member-1'
    await nextTick()

    expect(wrapper.text()).toBe('bookings')
    expect(window.localStorage.getItem('right-side:member-1:/send')).toBe('bookings')
    wrapper.unmount()
  })

  /**
   * ⚠️ Reading once at setup is not enough: the route guard lets anybody with a token
   * through, while `gradidoID` arrives with the login answer. A column mounted inside that
   * gap would show the default and never catch up.
   */
  it('picks the choice up when the member arrives after the mount', async () => {
    window.localStorage.setItem('right-side:member-1:/overview', 'contacts')
    const { wrapper, store } = mountPref(null)

    expect(wrapper.text()).toBe('bookings')

    store.state.gradidoID = 'member-1'
    await nextTick()

    expect(wrapper.text()).toBe('contacts')
    wrapper.unmount()
  })

  /**
   * ⛔ A value that came back from the device is checked against the list. A stale or
   * hand-edited one would name a slot the column does not have -- a quarter of the screen
   * rendering nothing, with nothing to say why.
   */
  it('ignores a stored value that names no position', () => {
    window.localStorage.setItem('right-side:member-1:/overview', 'somethingElse')
    const { wrapper } = mountPref('member-1')
    expect(wrapper.text()).toBe('bookings')
    wrapper.unmount()
  })

  it('refuses to store a position it was not given', async () => {
    const { wrapper, api } = mountPref('member-1')
    api().choose('somethingElse')
    await nextTick()

    expect(wrapper.text()).toBe('bookings')
    expect(window.localStorage.getItem('right-side:member-1:/overview')).toBeNull()
    wrapper.unmount()
  })
})
