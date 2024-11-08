import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import SessionLogoutTimeout from './SessionLogoutTimeout.vue'
import { useLazyQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { useModal } from 'bootstrap-vue-next'

// Mock external dependencies
vi.mock('vuex', () => ({
  useStore: vi.fn(),
}))

vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: vi.fn(() => ({
    load: vi.fn(),
    loading: ref(false),
    error: ref(null),
  })),
}))

// Mock bootstrap-vue-next
const mockHide = vi.fn()
vi.mock('bootstrap-vue-next', () => ({
  useModal: vi.fn(() => ({
    hide: mockHide,
  })),
  BModal: { template: '<div><slot></slot><slot name="modal-footer"></slot></div>' },
  BCard: { template: '<div><slot></slot></div>' },
  BCardText: { template: '<div><slot></slot></div>' },
  BRow: { template: '<div><slot></slot></div>' },
  BCol: { template: '<div><slot></slot></div>' },
  BButton: { template: '<button><slot></slot></button>' },
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
        tokenTime: tokenTime,
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

  beforeEach(() => {
    vi.useFakeTimers()
    mockHide.mockClear()
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
      wrapper = createWrapper(setTokenTime(76))
      await nextTick()

      vi.runOnlyPendingTimers()
      await nextTick()

      const modal = wrapper.findComponent({ name: 'BModal' })
      expect(modal.props('modelValue')).toBe(false)
    })

    it('emits logout when time expires', async () => {
      wrapper = createWrapper(setTokenTime(1))
      await nextTick()

      vi.runAllTimers()
      await nextTick()

      expect(wrapper.emitted('logout')).toBeTruthy()
    })
  })

  describe('handleOk', () => {
    it('hides modal and continues session on successful verification', async () => {
      const mockLoad = vi.fn().mockResolvedValue({})
      vi.mocked(useLazyQuery).mockReturnValue({
        load: mockLoad,
        loading: ref(false),
        error: ref(null),
      })

      wrapper = createWrapper()
      await wrapper.findComponent({ name: 'BButton' }).trigger('click')
      await nextTick()

      expect(mockLoad).toHaveBeenCalled()
      expect(mockHide).toHaveBeenCalledWith('modalSessionTimeOut')
      expect(wrapper.emitted('logout')).toBeFalsy()
    })

    it('emits logout on verification failure', async () => {
      const mockLoad = vi.fn().mockResolvedValue({})
      vi.mocked(useLazyQuery).mockReturnValue({
        load: mockLoad,
        loading: ref(false),
        error: ref(new Error('Verification failed')),
      })

      wrapper = createWrapper()
      await wrapper.findComponent({ name: 'BButton' }).trigger('click')
      await nextTick()

      expect(mockLoad).toHaveBeenCalled()
      expect(wrapper.emitted('logout')).toBeTruthy()
    })

    it('emits logout when verification throws an error', async () => {
      const mockLoad = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(useLazyQuery).mockReturnValue({
        load: mockLoad,
        loading: ref(false),
        error: ref(null),
      })

      wrapper = createWrapper()
      await wrapper.findComponent({ name: 'BButton' }).trigger('click')
      await nextTick()

      expect(mockLoad).toHaveBeenCalled()
      expect(wrapper.emitted('logout')).toBeTruthy()
    })
  })

  describe('time formatting', () => {
    it('formats remaining time correctly', async () => {
      wrapper = createWrapper(setTokenTime(65))
      await nextTick()

      const warningText = wrapper.find('.text-warning')
      expect(warningText.text()).toContain('65')
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
