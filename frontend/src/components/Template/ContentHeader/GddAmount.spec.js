import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GddAmount from './GddAmount'
import { updateUserInfos } from '@/graphql/mutations'
import { nextTick, ref } from 'vue'
import { BBadge, BCol, BRow } from 'bootstrap-vue-next'

// Mock vuex store
const mockHideAmountGDD = ref(false)
const mockCommit = vi.fn((mutation, value) => {
  if (mutation === 'hideAmountGDD') {
    mockHideAmountGDD.value = value
  }
})
const mockStore = {
  state: {
    get hideAmountGDD() {
      return mockHideAmountGDD.value
    },
  },
  commit: mockCommit,
}
vi.mock('vuex', () => ({
  useStore: () => mockStore,
}))

// Mock vue-i18n
const mockT = vi.fn((key) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}))

// Mock apollo
const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
}))

// Mock toast
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

// Mock GDD filter
const mockGDDFilter = vi.fn((value) => `${value} GDD`)
vi.mock('@/filters/GDDFilter', () => ({
  GDD: mockGDDFilter,
}))

describe('GddAmount', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(GddAmount, {
      props: {
        path: 'string',
        balance: 123.45,
        badgeShow: false,
        showStatus: false,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $store: mockStore,
          $filters: {
            GDD: mockGDDFilter,
          },
        },
        components: {
          BBadge,
          BCol,
          BRow,
        },
        stubs: {
          IBiLayers: true,
          IBiEyeSlash: true,
          IBiEye: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockHideAmountGDD.value = false
    wrapper = createWrapper()
  })

  /**
   * ⛔ The control is an icon and nothing else, and the balance it switches is a plain
   * v-if pair outside any live region -- so without a name and a state it announced as a
   * bare "button" and its result was never announced at all. The success toast used to
   * cover that; removing the toast laid it bare rather than causing it.
   */
  /**
   * ⛔ Two quick clicks are what this switch invites, and they used to leave the server and
   * the device on different values: `!hideAmount.value` was read once for the request and
   * again for the commit, so both clicks sent "hide" and the two commits then ran in turn and
   * landed back on "visible". The balance stayed on screen and came back hidden at the next
   * login, with nothing saying so.
   *
   * ⚠️ What this does NOT promise is that two clicks return you to where you started. The
   * second one reads a state the first has not reached yet, so it repeats the same request
   * and lands on the same value. Consistent, and one round trip more than necessary --
   * serialising the clicks would be a separate change to the control, not to this read.
   */
  it('leaves the server and the device on the same value after two quick clicks', async () => {
    const landed = []
    mockMutate.mockImplementation((args) => {
      landed.push(args.hideAmountGDD)
      return Promise.resolve({ data: { updateUserInfos: { validValues: 1 } } })
    })

    const button = wrapper.find('[data-test="toggle-hide-amount-gdd"]')
    // Both before either answer arrives.
    const first = button.trigger('click')
    const second = button.trigger('click')
    await first
    await second
    await nextTick()

    expect(landed).toHaveLength(2)
    expect(mockHideAmountGDD.value).toBe(landed[landed.length - 1])
  })

  describe('the eye is a named toggle, not a bare button', () => {
    const toggle = () => wrapper.find('[data-test="toggle-hide-amount-gdd"]')

    it('carries a name that says what it does', () => {
      expect(toggle().attributes('aria-label')).toBe('settings.hide-amount')
    })

    it('carries the state, so the result is audible', async () => {
      expect(toggle().attributes('aria-pressed')).toBe('false')

      mockMutate.mockResolvedValue({ data: { updateUserInfos: { validValues: 1 } } })
      await toggle().trigger('click')
      await nextTick()

      expect(toggle().attributes('aria-pressed')).toBe('true')
    })
  })

  it('renders the component gdd-amount', () => {
    expect(wrapper.find('div.gdd-amount').exists()).toBe(true)
  })

  describe('API calls', () => {
    it('handles API exception', async () => {
      mockMutate.mockRejectedValue({ message: 'Ouch' })

      await wrapper.find('div.border-start button').trigger('click')
      await nextTick()

      expect(mockToastError).toHaveBeenCalledWith('Ouch')
    })

    it('handles successful API call when hideAmountGDD is false', async () => {
      mockMutate.mockResolvedValue({
        data: {
          updateUserInfos: {
            validValues: 1,
          },
        },
      })

      await wrapper.find('div.border-start button').trigger('click')
      await nextTick()

      expect(mockMutate).toHaveBeenCalledWith({
        hideAmountGDD: true,
      })
      expect(mockCommit).toHaveBeenCalledWith('hideAmountGDD', true)
      // ⛔ No toast: the whole result of this switch is on screen the moment it lands, and
      // switched quickly back and forth they piled up. What the screen cannot show is a
      // FAILED save -- that is why toastError stays, and it has a test of its own above.
      expect(mockToastSuccess).not.toHaveBeenCalled()

      // Verify that the component updates its display
      expect(wrapper.find('.gradido-global-color-accent').text()).toBe('asterisks')
    })

    it('handles successful API call when hideAmountGDD is true', async () => {
      mockHideAmountGDD.value = true
      await nextTick()
      wrapper = createWrapper()

      mockMutate.mockResolvedValue({
        data: {
          updateUserInfos: {
            validValues: 1,
          },
        },
      })

      await wrapper.find('div.border-start button').trigger('click')
      await nextTick()

      expect(mockMutate).toHaveBeenCalledWith({
        hideAmountGDD: false,
      })
      expect(mockCommit).toHaveBeenCalledWith('hideAmountGDD', false)
      // ⛔ No toast: the whole result of this switch is on screen the moment it lands, and
      // switched quickly back and forth they piled up. What the screen cannot show is a
      // FAILED save -- that is why toastError stays, and it has a test of its own above.
      expect(mockToastSuccess).not.toHaveBeenCalled()

      // Verify that the component updates its display
      expect(wrapper.find('.gradido-global-color-accent').text()).toBe('123.45 GDD')
    })
  })
})
