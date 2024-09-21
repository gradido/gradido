import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import DateRow from './DateRow'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { BCol, BRow } from 'bootstrap-vue-next'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'form.date': 'Date',
      'gdd_per_link.validUntil': 'Valid Until',
      'gdd_per_link.expiredOn': 'Expired On',
    },
  },
})

const store = createStore({
  state: () => ({}),
  mutations: {},
  actions: {},
})

describe('DateRow', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(DateRow, {
      global: {
        plugins: [i18n, store],
        mocks: {
          $d: vi.fn((d) => d.toISOString()),
        },
        stubs: {
          BRow,
          BCol,
        },
      },
      props: {
        date: '2020-02-02T00:00:00.000Z',
        ...props,
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.date-row').exists()).toBe(true)
    })

    it('shows the date text', () => {
      expect(wrapper.find('div.text-end').text()).toBe('Date')
    })

    it('shows the date in long format', () => {
      expect(wrapper.find('div.gdd-transaction-list-item-date').text()).toBe(
        '2020-02-02T00:00:00.000Z',
      )
    })
  })

  describe('props', () => {
    it('shows "Valid Until" when diffNow and validLink are true', () => {
      wrapper = createWrapper({ diffNow: true, validLink: true })
      expect(wrapper.find('div.text-end').text()).toBe('Valid Until')
    })

    it('shows "Expired On" when diffNow is true and validLink is false', () => {
      wrapper = createWrapper({ diffNow: true, validLink: false })
      expect(wrapper.find('div.text-end').text()).toBe('Expired On')
    })
  })
})
