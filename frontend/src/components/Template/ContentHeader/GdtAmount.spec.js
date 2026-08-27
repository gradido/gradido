import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GdtAmount from './GdtAmount'
import { updateUserInfos } from '@/graphql/mutations'
import { nextTick, ref, toRef } from 'vue'
import { BBadge, BCol, BRow } from 'bootstrap-vue-next'

// Mock vuex store
const mockHideAmountGDT = ref(false)
const mockCommit = vi.fn((mutation, value) => {
  if (mutation === 'hideAmountGDT') {
    mockHideAmountGDT.value = value
  }
})
const mockStore = {
  state: {
    get hideAmountGDT() {
      return mockHideAmountGDT.value
    },
  },
  commit: mockCommit,
}
vi.mock('vuex', () => ({
  useStore: () => mockStore,
}))

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    n: (num) => num,
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

describe('GdtAmount', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(GdtAmount, {
      props: {
        gdtBalance: 123.45,
        badgeShow: false,
        showStatus: false,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
          $store: mockStore,
        },
        stubs: {
          IBiLayers: true,
          IBiEyeSlash: true,
          IBiEye: true,
        },
        components: {
          BBadge,
          BRow,
          BCol,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockHideAmountGDT.value = false
    wrapper = createWrapper()
  })

  /**
   * ⛔ The control is an icon and nothing else, and the balance it switches is a plain
   * v-if pair outside any live region -- so without a name and a state it announced as a
   * bare "button" and its result was never announced at all. The success toast used to
   * cover that; removing the toast laid it bare rather than causing it.
   */
  describe('the eye is a named toggle, not a bare button', () => {
    const toggle = () => wrapper.find('[data-test="toggle-hide-amount-gdt"]')

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

  it('renders the component gdt-amount', () => {
    expect(wrapper.find('div.gdt-amount').exists()).toBe(true)
  })

  describe('API calls', () => {
    it('handles API exception', async () => {
      mockMutate.mockRejectedValue({ message: 'Ouch' })

      await wrapper.find('div.border-start button').trigger('click')
      await nextTick()

      expect(mockToastError).toHaveBeenCalledWith('Ouch')
    })

    it('handles successful API call when hideAmountGDT is false', async () => {
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
        hideAmountGDT: true,
      })
      expect(mockCommit).toHaveBeenCalledWith('hideAmountGDT', true)
      // ⛔ No toast: the whole result of this switch is on screen the moment it lands, and
      // switched quickly back and forth they piled up. What the screen cannot show is a
      // FAILED save -- that is why toastError stays, and it has a test of its own above.
      expect(mockToastSuccess).not.toHaveBeenCalled()

      // Verify that the component updates its display
      expect(wrapper.find('.gradido-global-color-accent').text()).toBe('asterisks')
    })

    it('handles successful API call when hideAmountGDT is true', async () => {
      mockHideAmountGDT.value = true
      await nextTick()

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
        hideAmountGDT: false,
      })
      expect(mockCommit).toHaveBeenCalledWith('hideAmountGDT', false)
      // ⛔ No toast: the whole result of this switch is on screen the moment it lands, and
      // switched quickly back and forth they piled up. What the screen cannot show is a
      // FAILED save -- that is why toastError stays, and it has a test of its own above.
      expect(mockToastSuccess).not.toHaveBeenCalled()

      // Verify that the component updates its display
      expect(wrapper.find('.gradido-global-color-accent').text()).toBe('123.45 GDT')
    })
  })
})
