import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SessionLogoutTimeout from './SessionLogoutTimeout.vue'
import { useLazyQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'

// Mock external dependencies
vi.mock('vuex', () => ({
  useStore: vi.fn(),
}))

vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: vi.fn(() => ({
    load: vi.fn(),
    loading: false,
    error: { value: null },
  })),
}))

// Mock bootstrap-vue-next
const mockShow = vi.fn()
const mockHide = vi.fn()
vi.mock('bootstrap-vue-next', () => ({
  useModal: vi.fn(() => ({
    show: mockShow,
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
    mockShow.mockClear()
    mockHide.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component div.session-logout-timeout', () => {
    wrapper = createWrapper()
    expect(wrapper.find('div.session-logout-timeout').exists()).toBe(true)
  })

  describe('tokenExpiresInSeconds computed property', () => {
    it('returns 0 when token is expired', async () => {
      wrapper = createWrapper(setTokenTime(-60))
      await nextTick()
      expect(wrapper.vm.tokenExpiresInSeconds).toBe(0)
    })

    it('returns remaining seconds when token is not expired', async () => {
      wrapper = createWrapper(setTokenTime(120))
      await nextTick()
      expect(wrapper.vm.tokenExpiresInSeconds).toBeGreaterThan(0)
      expect(wrapper.vm.tokenExpiresInSeconds).toBeLessThanOrEqual(120)
    })
  })

  describe('checkExpiration', () => {
    it('shows modal when token expires in less than 75 seconds', async () => {
      wrapper = createWrapper(setTokenTime(74))
      await nextTick()

      vi.runAllTimers()

      await nextTick()
      expect(mockShow).toHaveBeenCalled()
    })

    it('emits logout when token is expired', async () => {
      wrapper = createWrapper(setTokenTime(-1))
      await nextTick()
      expect(wrapper.emitted('logout')).toBeTruthy()
    })
  })

  describe('handleOk', () => {
    it('hides modal and does not emit logout on successful verification', async () => {
      const mockLoad = vi.fn().mockResolvedValue({})
      vi.mocked(useLazyQuery).mockReturnValue({
        load: mockLoad,
        loading: false,
        error: { value: null },
      })

      wrapper = createWrapper()
      await wrapper.vm.handleOk({ preventDefault: vi.fn() })

      expect(mockLoad).toHaveBeenCalled()
      expect(mockHide).toHaveBeenCalledWith('modalSessionTimeOut')
      expect(wrapper.emitted('logout')).toBeFalsy()
    })

    it('emits logout on failed verification', async () => {
      const mockLoad = vi.fn().mockRejectedValue(new Error('Verification failed'))
      vi.mocked(useLazyQuery).mockReturnValue({
        load: mockLoad,
        loading: false,
        error: { value: new Error('Verification failed') },
      })

      wrapper = createWrapper()
      await wrapper.vm.handleOk({ preventDefault: vi.fn() })

      expect(mockLoad).toHaveBeenCalled()
      expect(wrapper.emitted('logout')).toBeTruthy()
    })
  })
})
