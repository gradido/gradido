// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { useShowFriendsSeen } from './useShowFriendsSeen'

const KEY = 'show-friends-seen:'

const host = (store) => {
  let api
  const wrapper = mount(
    {
      template: '<div />',
      setup() {
        api = useShowFriendsSeen()
        return {}
      },
    },
    { global: { plugins: [store] } },
  )
  return { wrapper, api: () => api }
}

const storeWith = (gradidoID) =>
  createStore({
    state: { gradidoID },
    mutations: {
      gradidoID(state, value) {
        state.gradidoID = value
      },
    },
  })

beforeEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('useShowFriendsSeen', () => {
  it('has not seen it on a device that remembers nothing', () => {
    const { api } = host(storeWith('member-1'))

    expect(api().seen.value).toBe(false)
  })

  it('remembers under this member, on this device', () => {
    const { api } = host(storeWith('member-1'))

    api().markSeen()

    expect(api().seen.value).toBe(true)
    expect(window.localStorage.getItem(`${KEY}member-1`)).toBe('1')
  })

  it('reads back what an earlier visit left', () => {
    window.localStorage.setItem(`${KEY}member-1`, '1')

    const { api } = host(storeWith('member-1'))

    expect(api().seen.value).toBe(true)
  })

  // ⛔ The whole reason the id is in the key: a shared device must not hand the next
  // person the previous one's tile.
  it('does not carry one member answer over to another', async () => {
    window.localStorage.setItem(`${KEY}member-1`, '1')
    const store = storeWith('member-1')
    const { wrapper, api } = host(store)
    expect(api().seen.value).toBe(true)

    store.commit('gradidoID', 'member-2')
    await wrapper.vm.$nextTick()

    expect(api().seen.value).toBe(false)
  })

  it('writes nothing while nobody is named', () => {
    const { api } = host(storeWith(null))

    api().markSeen()

    expect(window.localStorage.length).toBe(0)
  })

  /**
   * ⛔ The route guard admits on the token, and `gradidoID` arrives with the login answer.
   * A visit made in that gap has no key to go under -- and it must not be undone the
   * moment the name lands.
   */
  it('writes a visit made before the name arrived, once it does', async () => {
    const store = storeWith(null)
    const { wrapper, api } = host(store)

    api().markSeen()
    expect(api().seen.value).toBe(true)

    store.commit('gradidoID', 'member-1')
    await wrapper.vm.$nextTick()

    expect(api().seen.value).toBe(true)
    expect(window.localStorage.getItem(`${KEY}member-1`)).toBe('1')
  })

  it('survives storage being switched off', () => {
    const blow = () => {
      throw new Error('storage disabled')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blow)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blow)

    const { api } = host(storeWith('member-1'))
    expect(api().seen.value).toBe(false)
    expect(() => api().markSeen()).not.toThrow()
    // The tile stays large -- the harmless end of the mistake.
    expect(api().seen.value).toBe(true)
  })
})
