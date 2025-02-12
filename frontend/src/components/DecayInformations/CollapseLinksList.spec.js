import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CollapseLinksList from './CollapseLinksList.vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { BButton } from 'bootstrap-vue-next'

// Mock translations
const mockT = vi.fn((key, params) => {
  switch (key) {
    case 'link-load':
      if (params === 0) return '1 more link'
      return `${params.n} more links`
    case 'link-load-more':
      return `Load ${params.n} more links`
    default:
      return key
  }
})

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  createI18n: vi.fn(() => ({
    global: {
      t: mockT,
      d: vi.fn((d) => d),
    },
  })),
}))

// Mock Apollo
vi.mock('@vue/apollo-composable', () => ({
  provideApolloClient: vi.fn(),
}))

// Mock toast
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

describe('CollapseLinksList', () => {
  let wrapper
  let store
  let i18n

  const createVuexStore = () => {
    return createStore({
      state: {
        firstName: 'Bibi',
        lastName: 'Bloxberg',
      },
    })
  }

  const createWrapper = (props = {}) => {
    store = createVuexStore()
    i18n = createI18n()

    return mount(CollapseLinksList, {
      global: {
        plugins: [store],
        components: {
          BButton,
        },
        mocks: {
          $t: mockT,
          $d: vi.fn((d) => d),
        },
        stubs: {
          TransactionLink: true,
          IBiThreeDots: true,
        },
      },
      props: {
        modelValue: 1,
        transactionLinks: [
          {
            amount: '5',
            code: 'ce28664b5308c17f931c0367',
            link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
            createdAt: '2022-03-16T14:22:40.000Z',
            holdAvailableAmount: '5.13109484759482747111',
            id: 87,
            memo: 'Eene meene Siegerpreis, vor mir steht ein Schokoeis. Hex-hex!',
            redeemedAt: null,
            validUntil: '2022-03-30T14:22:40.000Z',
          },
          {
            amount: '6',
            code: 'ce28664b5308c17f931c0367',
            link: 'http://localhost/redeem/ce28664b5308c17f931c0367',
            createdAt: '2022-03-16T14:22:40.000Z',
            holdAvailableAmount: '5.13109484759482747111',
            id: 86,
            memo: 'Eene meene buntes Laub, auf dem Schrank da liegt kein Staub.',
            redeemedAt: null,
            validUntil: '2022-03-30T14:22:40.000Z',
          },
        ],
        transactionLinkCount: 3,
        pending: false,
        pageSize: 5,
        ...props,
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('renders the component div.collapse-links-list', () => {
    expect(wrapper.find('div.collapse-links-list').exists()).toBeTruthy()
  })

  describe('load more links', () => {
    beforeEach(async () => {
      await wrapper.find('.test-button-load-more').trigger('click')
    })

    it('emits update:modelValue', () => {
      expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
    })
  })

  describe('reset transaction link list', () => {
    beforeEach(async () => {
      await wrapper
        .findComponent({ name: 'TransactionLink' })
        .vm.$emit('reset-transaction-link-list')
    })

    it('emits update:modelValue', () => {
      expect(wrapper.emitted('update:modelValue')).toEqual([[0]])
    })
  })

  describe('button text', () => {
    describe('one more link to load', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactionLinkCount: 3,
          transactionLinks: [{ id: 1 }, { id: 2 }],
        })
      })

      it('renders text in singular', () => {
        expect(wrapper.find('.test-button-load-more').text()).toBe('1 more link')
      })
    })

    describe('less than pageSize links to load', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactionLinkCount: 6,
          transactionLinks: [{ id: 1 }, { id: 2 }],
        })
      })

      it('renders text in plural and shows the correct count of links', () => {
        expect(wrapper.find('.test-button-load-more').text()).toBe('4 more links')
      })
    })

    describe('more than pageSize links to load', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactionLinkCount: 16,
          transactionLinks: [{ id: 1 }, { id: 2 }],
          pageSize: 5,
        })
      })

      it('renders text with pageSize as number of links to load', () => {
        expect(wrapper.find('.test-button-load-more').text()).toBe('Load 5 more links')
      })
    })
  })
})
