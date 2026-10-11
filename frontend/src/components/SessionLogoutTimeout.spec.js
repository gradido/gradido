import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import SessionLogoutTimeout from './SessionLogoutTimeout.vue'
import { useLazyQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'

vi.mock('vuex', () => ({
  useStore: vi.fn(),
}))

vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: vi.fn(() => ({
    load: vi.fn().mockResolvedValue({}),
    refetch: vi.fn().mockResolvedValue({}),
  })),
}))

vi.mock('bootstrap-vue-next', () => ({
  BModal: {
    name: 'BModal',
    props: ['modelValue'],
    template: '<div><slot></slot><slot name="footer"></slot></div>',
  },
  BCard: { name: 'BCard', template: '<div><slot></slot></div>' },
  BCardText: { name: 'BCardText', template: '<div><slot></slot></div>' },
  BButton: { name: 'BButton', template: '<button><slot></slot></button>' },
}))

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError, toastSuccess: vi.fn() }),
}))

const setTokenTime = (seconds) => {
  const now = new Date()
  return Math.floor(new Date(now.setSeconds(now.getSeconds() + seconds)).getTime() / 1000)
}

describe('SessionLogoutTimeout', () => {
  let wrapper

  const createWrapper = (tokenTime = setTokenTime(120)) => {
    vi.mocked(useStore).mockReturnValue({
      state: {
        tokenTime,
      },
    })
    return mount(SessionLogoutTimeout, {
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
    })
  }

  // The mocked BButton renders a plain <button>; buttons carry their i18n key as text.
  const clickButton = (text) =>
    wrapper
      .findAll('button')
      .find((button) => button.text() === text)
      .trigger('click')

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('renders the component div.session-logout-timeout', () => {
    wrapper = createWrapper()
    expect(wrapper.find('div.session-logout-timeout').exists()).toBe(true)
  })

  describe('token expiration', () => {
    it('shows modal when remaining time is 75 seconds or less', async () => {
      wrapper = createWrapper(setTokenTime(74))
      await nextTick()
      vi.runOnlyPendingTimers()
      await nextTick()

      const modal = wrapper.findComponent({ name: 'BModal' })
      expect(modal.props('modelValue')).toBe(true)
    })

    it('does not show modal when remaining time is more than 75 seconds', async () => {
      wrapper = createWrapper(setTokenTime(77))
      await nextTick()

      const modal = wrapper.findComponent({ name: 'BModal' })
      expect(modal.props('modelValue')).toBe(false)
    })

    /**
     * Not the member's own word: the layout signs out without taking what they wrote in a
     * conversation and did not send off the device (utils/chatDraft).
     */
    it('emits logout when time expires, as a session that ran out', async () => {
      wrapper = createWrapper(setTokenTime(2))
      await nextTick()
      vi.runAllTimers()
      await nextTick()

      expect(wrapper.emitted('logout')).toBeTruthy()
      expect(wrapper.emitted('logout')[0]).toEqual([{ ranOut: true }])
    })
  })

  describe('session renewal', () => {
    it('renews the session and keeps the user signed in on "extend"', async () => {
      const load = vi.fn().mockResolvedValue({})
      const refetch = vi.fn().mockResolvedValue({})
      vi.mocked(useLazyQuery).mockReturnValue({ load, refetch })

      wrapper = createWrapper(setTokenTime(60))
      await clickButton('session.extend')
      await flushPromises()

      expect(load).toHaveBeenCalled()
      expect(wrapper.emitted('logout')).toBeFalsy()
    })

    it('emits logout when renewal fails', async () => {
      const load = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(useLazyQuery).mockReturnValue({ load, refetch: vi.fn() })

      wrapper = createWrapper(setTokenTime(60))
      await clickButton('session.extend')
      await flushPromises()

      expect(wrapper.emitted('logout')).toBeTruthy()
      // The member asked to stay: this sign-out is not their word either.
      expect(wrapper.emitted('logout')[0]).toEqual([{ ranOut: true }])
      expect(toastError).toHaveBeenCalled()
    })

    // "Abmelden" in the question is the member's own word: nothing goes with it.
    it('emits logout on the logout button, as the member’s own word', async () => {
      wrapper = createWrapper(setTokenTime(60))
      await clickButton('navigation.logout')
      await flushPromises()

      expect(wrapper.emitted('logout')).toBeTruthy()
      expect(wrapper.emitted('logout')[0]).toEqual([])
    })
  })

  describe('time formatting', () => {
    it('formats remaining time correctly', async () => {
      wrapper = createWrapper(setTokenTime(65))
      await nextTick()

      const warningText = wrapper.find('.text-warning')
      expect(warningText.text()).toContain('64')
    })

    it('shows 00 when time is expired', async () => {
      wrapper = createWrapper(setTokenTime(-1))
      await nextTick()

      const warningText = wrapper.find('.text-warning')
      expect(warningText.text()).toContain('00')
    })
  })

  describe('cleanup', () => {
    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
      wrapper = createWrapper()
      wrapper.unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})
