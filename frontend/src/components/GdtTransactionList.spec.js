import { mount } from '@vue/test-utils'
import GdtTransactionList from './GdtTransactionList'
import { GdtEntryType } from '@/graphql/enums'

const localVue = global.localVue

const state = {
  language: 'en',
}

describe('GdtTransactionList ', () => {
  let wrapper

  const mocks = {
    $store: {
      state,
      commit: jest.fn(),
    },
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
    $d: jest.fn((d) => d),
  }

  const propsData = {
    transactionsGdt: [],
    transactionGdtCount: 0,
    pageSize: 25,
    value: 1,
  }

  const Wrapper = () => {
    return mount(GdtTransactionList, { localVue, mocks, propsData })
  }

  describe('transactionGdtCount is 0', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the funding button ', () => {
      expect(wrapper.find('.gdt-funding').exists()).toBe(true)
    })

    it('links to https://gradido.net/en/memberships/ when clicking', async () => {
      expect(wrapper.find('.gdt-funding').attributes('href')).toBe(
        'https://gradido.net/' + state.language + '/memberships/',
      )
    })
  })

  describe('Transactions are loaded', () => {
    beforeEach(async () => {
      wrapper = Wrapper()
      await wrapper.setProps({
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
      expect(wrapper.find('div.gdt-transaction-list').exists()).toBeTruthy()
    })

    it('does not render the funding button ', () => {
      expect(wrapper.find('.gdt-funding').exists()).toBe(false)
    })

    describe('change of currentPage', () => {
      it('calls the API after currentPage changes', async () => {
        jest.clearAllMocks()
        await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('input', 2)
        expect(wrapper.emitted('input')).toEqual([[2]])
      })

      describe('pagination buttons', () => {
        describe('with transactionCount > pageSize', () => {
          it('shows the pagination buttons', () => {
            expect(wrapper.find('ul.pagination').exists()).toBe(true)
          })
        })

        describe('with transactionCount < pageSize', () => {
          beforeEach(() => {
            wrapper.setProps({
              transactionGdtCount: 10,
            })
          })

          it('shows no pagination buttons', () => {
            expect(wrapper.find('ul.pagination').exists()).toBe(false)
          })
        })
      })
    })

    describe('server not reachable', () => {
      beforeEach(() => {
        wrapper.setProps({
          transactionGdtCount: -1,
        })
      })

      it('renders the not-reachable text', () => {
        expect(wrapper.text()).toBe('gdt.not-reachable')
      })
    })
  })
})
