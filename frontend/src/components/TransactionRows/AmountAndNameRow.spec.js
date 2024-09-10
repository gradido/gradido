// import { mount } from '@vue/test-utils'
// import AmountAndNameRow from './AmountAndNameRow'
//
// const localVue = global.localVue
//
// const mocks = {
//   $router: {
//     push: jest.fn(),
//   },
// }
//
// const propsData = {
//   amount: '19.99',
//   text: 'Some text',
// }
//
// describe('AmountAndNameRow', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(AmountAndNameRow, { localVue, mocks, propsData })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component', () => {
//       expect(wrapper.find('div.amount-and-name-row').exists()).toBe(true)
//     })
//
//     describe('without linked user', () => {
//       it('has a span with the text', () => {
//         expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Some text')
//       })
//
//       it('has no link', () => {
//         expect(wrapper.find('div.gdd-transaction-list-item-name').find('a').exists()).toBe(false)
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import AmountAndNameRow from './AmountAndNameRow'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { BCol, BRow } from 'bootstrap-vue-next'

// Mock vue-i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {},
  },
})

// Mock vuex store
const store = createStore({
  state() {
    return {}
  },
})

// Mock GDD filter
const mockGDDFilter = vi.fn((value) => `Filtered: ${value}`)

const globalMocks = {
  $filters: {
    GDD: mockGDDFilter,
  },
}

describe('AmountAndNameRow', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(AmountAndNameRow, {
      global: {
        plugins: [store, i18n],
        mocks: globalMocks,
        components: {
          BCol,
          BRow,
        },
      },
      props: {
        amount: '19.99',
        text: 'Some text',
        ...props,
      },
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.amount-and-name-row').exists()).toBe(true)
  })

  it('displays the filtered amount', () => {
    expect(wrapper.find('.gdd-transaction-list-item-amount').text()).toBe('Filtered: 19.99')
    expect(mockGDDFilter).toHaveBeenCalledWith('19.99')
  })

  describe('without linked user', () => {
    it('has a span with the text', () => {
      expect(wrapper.find('div.gdd-transaction-list-item-name').text()).toBe('Some text')
    })

    it('has no link', () => {
      expect(wrapper.find('div.gdd-transaction-list-item-name').find('a').exists()).toBe(false)
    })
  })
})
