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
      expect(mockToastSuccess).toHaveBeenCalledWith('settings.hideAmountGDT')

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
      expect(mockToastSuccess).toHaveBeenCalledWith('settings.showAmountGDT')

      // Verify that the component updates its display
      expect(wrapper.find('.gradido-global-color-accent').text()).toBe('123.45 GDT')
    })
  })
})
