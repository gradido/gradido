import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TransactionConfirmationLink from './TransactionConfirmationLink'
import { BButton, BCol, BRow } from 'bootstrap-vue-next'

// Mock the useAppToast composable
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

// Mock the i18n plugin
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}))

// Mock the Vuex store
vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({
    // Add any necessary store mock implementations here
  })),
}))

describe('TransactionConfirmationLink', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(TransactionConfirmationLink, {
      global: {
        components: {
          BRow,
          BCol,
          BButton,
        },
        stubs: {
          'variant-icon': true,
        },
        mocks: {
          $t: (msg) => msg,
          $filters: {
            GDD: vi.fn((value) => `${value} GDD`),
          },
        },
      },
      props: {
        balance: 1234,
        email: 'user@example.org',
        amount: 12.34,
        memo: 'Pessimisten stehen im Regen, Optimisten duschen unter den Wolken.',
        loading: false,
        ...props,
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component div.transaction-confirm-link', () => {
    expect(wrapper.find('div.transaction-confirm-link').exists()).toBe(true)
  })

  describe('totalBalance computed property', () => {
    it('disables the send button when totalBalance is negative', async () => {
      await wrapper.setProps({ balance: 10 })
      expect(wrapper.vm.disabled).toBe(true)
      expect(wrapper.find('.send-button').attributes('disabled')).toBe('')
    })
  })

  describe('disabled computed property', () => {
    it('returns true when totalBalance is negative', async () => {
      await wrapper.setProps({ balance: 10 })
      expect(wrapper.vm.disabled).toBe(true)
    })

    it('returns true when loading is true', async () => {
      await wrapper.setProps({ loading: true })
      expect(wrapper.vm.disabled).toBe(true)
    })

    it('returns false when totalBalance is positive and not loading', () => {
      expect(wrapper.vm.disabled).toBe(false)
    })
  })

  describe('send now button', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('emits send-transaction event on click', async () => {
      await wrapper.find('.send-button').trigger('click')
      expect(wrapper.emitted('send-transaction')).toHaveLength(1)
    })

    it('does not emit send-transaction event when disabled', async () => {
      await wrapper.setProps({ loading: true })
      await wrapper.find('.send-button').trigger('click')
      expect(wrapper.emitted('send-transaction')).toBeUndefined()
    })
  })

  describe('back button', () => {
    it('emits on-back event when clicked', async () => {
      await wrapper.find('button:not(.send-button)').trigger('click')
      expect(wrapper.emitted('on-back')).toHaveLength(1)
    })
  })

  describe('displays correct information', () => {
    it('shows the correct balance', () => {
      expect(wrapper.text()).toContain('1234 GDD')
    })

    it('shows the correct amount', () => {
      expect(wrapper.text()).toContain('12.34 GDD')
    })

    it('shows the correct memo', () => {
      expect(wrapper.text()).toContain(
        'Pessimisten stehen im Regen, Optimisten duschen unter den Wolken.',
      )
    })
  })
})
