import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TransactionConfirmationSend from './TransactionConfirmationSend'
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

// Mock the Apollo client
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

describe('GddSend confirm', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(TransactionConfirmationSend, {
      global: {
        components: {
          BRow,
          BCol,
          BButton,
        },
        stubs: {
          IBiDropletHalf: true,
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
        identifier: 'user@example.org',
        amount: 12.34,
        memo: 'Pessimisten stehen im Regen, Optimisten duschen unter den Wolken.',
        userName: '',
        targetCommunity: { uuid: '', name: 'Test Community' },
        ...props,
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component div.transaction-confirm-send', () => {
    expect(wrapper.find('div.transaction-confirm-send').exists()).toBe(true)
  })

  describe('send now button', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('emits send transaction one time on single click', async () => {
      await wrapper.find('button.btn-gradido').trigger('click')
      expect(wrapper.emitted('send-transaction')).toHaveLength(1)
    })

    it('emits send transaction one time on double click', async () => {
      await wrapper.find('button.btn-gradido').trigger('click')
      await wrapper.find('button.btn-gradido').trigger('click')
      expect(wrapper.emitted('send-transaction')).toHaveLength(1)
    })

    it('disables the button after click', async () => {
      const button = wrapper.find('button.btn-gradido')
      await button.trigger('click')
      expect(wrapper.vm.disabled).toBe(true)
    })
  })

  describe('back button', () => {
    it('emits on-back event when clicked', async () => {
      await wrapper.find('button:not([variant="gradido"])').trigger('click')
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

    it('shows the correct new balance', () => {
      expect(wrapper.text()).toContain('1221.66 GDD')
    })

    it('shows the identifier when userName is not provided', () => {
      expect(wrapper.text()).toContain('user@example.org')
    })

    it('shows the userName when provided', async () => {
      await wrapper.setProps({ userName: 'John Doe' })
      expect(wrapper.text()).toContain('John Doe')
    })

    it('shows the correct target community name', () => {
      expect(wrapper.text()).toContain('Test Community')
    })
  })
})
