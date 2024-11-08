import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import UserNewsletter from './UserNewsletter'
import { unsubscribeNewsletter, subscribeNewsletter } from '@/graphql/mutations'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import * as bootstrapVueNext from 'bootstrap-vue-next'
import { nextTick } from 'vue'

// Mock composables and dependencies
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  })),
}))

const mockSubscribeMutate = vi.fn()
const mockUnsubscribeMutate = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn((mutation) => {
    if (mutation === subscribeNewsletter) {
      return { mutate: mockSubscribeMutate }
    } else if (mutation === unsubscribeNewsletter) {
      return { mutate: mockUnsubscribeMutate }
    }
  }),
}))

describe('UserNewsletter', () => {
  let wrapper
  let store
  let i18n

  const createVuexStore = (initialState = {}) =>
    createStore({
      state: {
        language: 'de',
        newsletterState: true,
        ...initialState,
      },
      mutations: {
        newsletterState(state, value) {
          state.newsletterState = value
        },
      },
    })

  const createI18nInstance = () =>
    createI18n({
      legacy: false,
      locale: 'de',
      messages: {
        de: {
          'settings.newsletter.newsletterTrue': 'Newsletter subscribed',
          'settings.newsletter.newsletterFalse': 'Newsletter unsubscribed',
        },
      },
    })

  const createWrapper = (storeState = {}) => {
    store = createVuexStore(storeState)
    i18n = createI18nInstance()

    return mount(UserNewsletter, {
      global: {
        plugins: [store, i18n, bootstrapVueNext],
        config: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('b-'),
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.formusernewsletter').exists()).toBe(true)
  })

  it('has a BFormCheckbox switch', () => {
    const checkbox = wrapper.findComponent({ name: 'BFormCheckbox' })
    expect(checkbox.exists()).toBe(true)
  })

  describe('unsubscribe with success', () => {
    beforeEach(async () => {
      wrapper = createWrapper({ newsletterState: true })
      mockUnsubscribeMutate.mockResolvedValue({
        data: {
          unsubscribeNewsletter: true,
        },
      })

      const checkbox = wrapper.findComponent({ name: 'BFormCheckbox' })
      await checkbox.setValue(false)
      await nextTick()
      // Ensure all promises are resolved
      await Promise.resolve()
    })

    it('calls the unsubscribe mutation', () => {
      expect(mockUnsubscribeMutate).toHaveBeenCalledTimes(1)
    })

    it('updates the store', () => {
      expect(store.state.newsletterState).toBe(false)
    })

    it('toasts a success message', () => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Newsletter unsubscribed')
    })
  })

  describe('subscribe with success', () => {
    beforeEach(async () => {
      wrapper = createWrapper({ newsletterState: false })
      mockSubscribeMutate.mockResolvedValue({
        data: {
          subscribeNewsletter: true,
        },
      })

      const checkbox = wrapper.findComponent({ name: 'BFormCheckbox' })
      await checkbox.setValue(true)
      await nextTick()
      // Ensure all promises are resolved
      await Promise.resolve()
    })

    it('calls the subscribe mutation', () => {
      expect(mockSubscribeMutate).toHaveBeenCalledTimes(1)
    })

    it('updates the store', () => {
      expect(store.state.newsletterState).toBe(true)
    })

    it('toasts a success message', () => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Newsletter subscribed')
    })
  })

  describe('unsubscribe with server error', () => {
    beforeEach(async () => {
      wrapper = createWrapper({ newsletterState: true })
      mockUnsubscribeMutate.mockRejectedValue(new Error('Ouch'))

      const checkbox = wrapper.findComponent({ name: 'BFormCheckbox' })
      await checkbox.setValue(false)
      await nextTick()
      // Ensure all promises are resolved
      await Promise.resolve()
    })

    it('resets the newsletterState', () => {
      expect(store.state.newsletterState).toBe(true)
    })

    it('toasts an error message', () => {
      expect(mockToastError).toHaveBeenCalledWith('Ouch')
    })
  })
})
