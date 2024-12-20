import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import GdtTransactionList from './GdtTransactionList'
import { GdtEntryType } from '@/graphql/enums'
import { createStore } from 'vuex'
import { nextTick } from 'vue'
import { BButton, BPagination } from 'bootstrap-vue-next'

const mockStore = createStore({
  state: {
    language: 'en',
  },
})

const mockI18n = {
  locale: 'en',
  t: (key) => key,
}

describe('GdtTransactionList', () => {
  let wrapper

  const globalMocks = {
    $store: mockStore,
    $i18n: mockI18n,
    $t: vi.fn((t) => t),
    $n: vi.fn((n) => n),
    $d: vi.fn((d) => d),
  }

  const defaultProps = {
    transactionsGdt: [],
    transactionGdtCount: 0,
    pageSize: 25,
    modelValue: 1,
  }

  const mountComponent = (props = {}) => {
    return mount(GdtTransactionList, {
      props: { ...defaultProps, ...props },
      global: {
        mocks: globalMocks,
        stubs: {
          BButton,
          BPagination,
          Transaction: true,
        },
      },
    })
  }

  describe('transactionGdtCount is 0', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    it('renders the funding button', () => {
      expect(wrapper.find('.gdt-funding').exists()).toBe(true)
    })

    it('links to correct memberships URL when clicking', async () => {
      expect(wrapper.find('.gdt-funding').attributes('href')).toBe(
        'https://gradido.net/en/memberships/',
      )
    })
  })

  describe('Transactions are loaded', () => {
    beforeEach(async () => {
      wrapper = mountComponent({
        transactionGdtCount: 42,
        transactionsGdt: [
          {
            id: 1,
            amount: 100,
            gdt: 1700,
            factor: 17,
            comment: '',
            date: '2021-05-02T17:20:11+00:00',
            gdtEntryType: GdtEntryType.FORM,
          },
          {
            id: 2,
            amount: 1810,
            gdt: 362,
            factor: 0.2,
            comment: 'Dezember 20',
            date: '2020-12-31T12:00:00+00:00',
            gdtEntryType: GdtEntryType.GLOBAL_MODIFICATOR,
          },
          {
            id: 3,
            amount: 100,
            gdt: 1700,
            factor: 17,
            comment: '',
            date: '2020-05-07T17:00:00+00:00',
            gdtEntryType: GdtEntryType.FORM,
          },
          {
            id: 4,
            amount: 100,
            gdt: 110,
            factor: 22,
            comment: '',
            date: '2020-04-10T13:28:00+00:00',
            gdtEntryType: GdtEntryType.ELOPAGE_PUBLISHER,
          },
        ],
      })
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-list').exists()).toBe(true)
    })

    it('does not render the funding button', () => {
      expect(wrapper.find('.gdt-funding').exists()).toBe(false)
    })

    describe('change of currentPage', () => {
      it('emits input event after currentPage changes', async () => {
        await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('update:modelValue', 2)
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
      })

      describe('pagination buttons', () => {
        it('shows the pagination buttons when transactionCount > pageSize', () => {
          expect(wrapper.findComponent({ name: 'BPagination' }).exists()).toBe(true)
        })

        it('hides pagination buttons when transactionCount < pageSize', async () => {
          await wrapper.setProps({ transactionGdtCount: 10 })
          expect(wrapper.findComponent({ name: 'BPagination' }).exists()).toBe(false)
        })
      })
    })
  })

  describe('server not reachable', () => {
    beforeEach(() => {
      wrapper = mountComponent({ transactionGdtCount: -1 })
    })

    it('renders the not-reachable text', () => {
      expect(wrapper.text()).toContain('gdt.not-reachable')
    })
  })
})
