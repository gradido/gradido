// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
import { useThanksNudges } from './useThanksNudges'

// The real sign-out of the wallet's store, below: what it reaches beyond the store is stood in
// for, as store.test.js does it.
vi.mock('@/i18n', () => ({ default: { global: { locale: { value: 'de' } } } }))
vi.mock('@/plugins/apolloCache', () => ({ clearApolloCache: vi.fn(async () => {}) }))

const KEY = 'thanks-nudge:'
const UUID = 'A1B2C3D4-0000-4000-8000-00000000000A'

const host = (store) => {
  let api
  const wrapper = mount(
    {
      template: '<div />',
      setup() {
        api = useThanksNudges()
        return {}
      },
    },
    { global: { plugins: [store] } },
  )
  return { wrapper, api: () => api }
}

const storeWith = (gradidoID) => walletStore({ gradidoID })

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useThanksNudges', () => {
  it('has answered nothing on a device that remembers nothing', () => {
    const { api } = host(storeWith('member-1'))

    expect(api().isSeen('call', UUID)).toBe(false)
    expect(api().isSeen('pass-on', 7)).toBe(false)
  })

  it('remembers an answer under this member and this occasion, on this device', () => {
    const { api } = host(storeWith('member-1'))

    api().markSeen('call', UUID)
    api().markSeen('pass-on', 7)

    expect(window.localStorage.getItem(`${KEY}member-1:call:${UUID.toLowerCase()}`)).toBe('1')
    expect(window.localStorage.getItem(`${KEY}member-1:pass-on:7`)).toBe('1')
    expect(api().isSeen('call', UUID)).toBe(true)
    expect(api().isSeen('pass-on', 7)).toBe(true)
  })

  it('reads back what an earlier visit left', () => {
    window.localStorage.setItem(`${KEY}member-1:pass-on:7`, '1')

    const { api } = host(storeWith('member-1'))

    expect(api().isSeen('pass-on', 7)).toBe(true)
    expect(api().isSeen('pass-on', 8)).toBe(false)
  })

  it('keeps the two occasions apart: a call and a booking of the same name', () => {
    const { api } = host(storeWith('member-1'))

    api().markSeen('pass-on', 7)

    expect(api().isSeen('call', 7)).toBe(false)
  })

  // The server compares uuids without regard to case: one occasion, whichever way it is written.
  it('takes a uuid in either case for the same occasion', () => {
    const { api } = host(storeWith('member-1'))

    api().markSeen('call', UUID)

    expect(api().isSeen('call', UUID.toLowerCase())).toBe(true)
  })

  // The line goes at once: what is drawn from `isSeen` follows the answer.
  it('is followed by what is drawn from it', async () => {
    const { wrapper, api } = host(storeWith('member-1'))
    const shown = computed(() => !api().isSeen('call', UUID))
    expect(shown.value).toBe(true)

    api().markSeen('call', UUID)
    await wrapper.vm.$nextTick()

    expect(shown.value).toBe(false)
  })

  // ⛔ The whole reason the member is in the key: a shared device must not hand the next person
  // the answers of the one before -- nor take theirs away.
  it('does not carry one member’s answer over to another', async () => {
    const store = storeWith('member-1')
    const { wrapper, api } = host(store)
    api().markSeen('call', UUID)

    useWalletStore(store).setGradidoID('member-2')
    await wrapper.vm.$nextTick()
    expect(api().isSeen('call', UUID)).toBe(false)

    useWalletStore(store).setGradidoID('member-1')
    await wrapper.vm.$nextTick()
    expect(api().isSeen('call', UUID)).toBe(true)
  })

  // A sign-out empties the store while the page still stands: no line may come up for a moment.
  it('suggests nothing while nobody is signed in, and writes nothing', () => {
    const { api } = host(storeWith(null))

    expect(api().isSeen('call', UUID)).toBe(true)
    api().markSeen('call', UUID)

    expect(window.localStorage.length).toBe(0)
  })

  /**
   * ⛔ What a sign-out leaves on the device (the store's own `logout`): the answers stay, under the
   * member's key, as the map's look and the right column's choice do. A session runs out after
   * ten minutes without a request, and every such sign-out would otherwise bring back a line the
   * member had answered with "Nicht jetzt".
   */
  it('keeps the answers on the device through a sign-out', async () => {
    const store = storeWith('member-1')
    const { wrapper, api } = host(store)
    api().markSeen('call', UUID)

    await useWalletStore(store).logout()
    await wrapper.vm.$nextTick()
    expect(api().isSeen('call', UUID)).toBe(true)
    expect(window.localStorage.getItem(`${KEY}member-1:call:${UUID.toLowerCase()}`)).toBe('1')

    // Signed in again, on another day: the answer holds.
    const again = host(storeWith('member-1'))
    expect(again.api().isSeen('call', UUID)).toBe(true)
  })

  it('suggests nothing for an occasion that has no name yet', () => {
    const { api } = host(storeWith('member-1'))

    for (const id of [null, undefined, '']) {
      expect(api().isSeen('call', id)).toBe(true)
      api().markSeen('call', id)
    }
    expect(window.localStorage.length).toBe(0)
  })

  // A kind nobody wrote is the caller's mistake, and says so at once.
  it('refuses an occasion it does not know', () => {
    const { api } = host(storeWith('member-1'))

    expect(() => api().isSeen('chat', UUID)).toThrow('no occasion "chat"')
    expect(() => api().markSeen('chat', UUID)).toThrow('no occasion "chat"')
  })

  describe('without a device to remember on', () => {
    it('has answered nothing where the device cannot be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })
      const { api } = host(storeWith('member-1'))

      expect(api().isSeen('call', UUID)).toBe(false)
    })

    it('still lets the line go once answered, for as long as the page stands', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const { api } = host(storeWith('member-1'))

      expect(() => api().markSeen('call', UUID)).not.toThrow()

      expect(api().isSeen('call', UUID)).toBe(true)
    })
  })
})
