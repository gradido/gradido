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
  // "Bild dazu" (ZE-016): the picture that goes with the transfer stands with the entries.
  describe('the picture with the transfer', () => {
    const row = () => wrapper.find('[data-test="confirm-send-picture"]')

    it('has no row without a picture', () => {
      expect(row().exists()).toBe(false)
      expect(wrapper.text()).not.toContain('send-picture.label')
    })

    it('shows a motif small under the message, by its name', () => {
      wrapper = createWrapper({ picture: { motif: 'giving-hands' } })

      expect(row().text()).toContain('send-picture.label')
      const picture = row().find('img')
      expect(picture.attributes('src')).toBe('/img/thank-you-greeting/giving-hands.svg')
      expect(picture.attributes('alt')).toBe('thank-you-greeting.motif.giving-hands')
      expect(picture.classes()).toContain('transaction-confirm-picture')
    })

    it('shows a photo as the member cut it', () => {
      const preview = 'data:image/jpeg;base64,AAAA'
      wrapper = createWrapper({ picture: { photo: { source: {}, edit: {}, preview } } })

      expect(row().find('img').attributes('src')).toBe(preview)
      expect(row().find('img').attributes('alt')).toBe('thank-you-greeting.picture.own')
    })

    it('has no row for a motif this wallet does not know', () => {
      wrapper = createWrapper({ picture: { motif: 'elephant' } })

      expect(row().exists()).toBe(false)
    })

    it('stands after the message and before the calculation', () => {
      wrapper = createWrapper({ picture: { motif: 'bouquet' } })
      const text = wrapper.html()

      expect(text.indexOf('form.memo')).toBeLessThan(text.indexOf('confirm-send-picture'))
      expect(text.indexOf('confirm-send-picture')).toBeLessThan(
        text.indexOf('advanced-calculation'),
      )
    })
  })
})
