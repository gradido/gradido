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
      expect(mockToastSuccess).toHaveBeenCalledWith('settings.hideAmountGDD')

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
      expect(mockToastSuccess).toHaveBeenCalledWith('settings.showAmountGDD')

      // Verify that the component updates its display
      expect(wrapper.find('.gradido-global-color-accent').text()).toBe('123.45 GDD')
    })
  })
})
