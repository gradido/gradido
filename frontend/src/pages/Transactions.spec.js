import { mount } from '@vue/test-utils'
import Transactions from './Transactions'
import { GdtEntryType } from '@/graphql/enums'
import { listGDTEntriesQuery } from '@/graphql/queries'

import { toastErrorSpy } from '@test/testSetup'

const localVue = global.localVue

const mockRouterReplace = jest.fn()
const windowScrollToMock = jest.fn()
window.scrollTo = windowScrollToMock

const apolloMock = jest.fn().mockResolvedValue({
  data: {
    listGDTEntries: {
      count: 0,
      gdtEntries: [],
    },
  },
})

describe('Transactions', () => {
  let wrapper

  const state = {
    language: 'en',
  }

  const mocks = {
    $store: {
      state,
      commit: jest.fn(),
    },
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => String(n)),
    $d: jest.fn((d) => d),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $apollo: {
      query: apolloMock,
    },
    $router: {
      replace: mockRouterReplace,
    },
  }

  const Wrapper = (propsData = {}) => {
    return mount(Transactions, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders page', () => {
      expect(wrapper.find('.transactions').exists()).toBe(true)
    })

    it('renders the transaction table', () => {
      expect(wrapper.findComponent({ name: 'GddTransactionList' }).exists()).toBeTruthy()
    })

    it('emits update-transactions after creation', () => {
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ currentPage: 1, pageSize: 25 }])]),
      )
    })

    it('emits update-transactions when update-transactions is called', () => {
      wrapper
        .findComponent({ name: 'GddTransactionList' })
        .vm.$emit('update-transactions', { currentPage: 2, pageSize: 25 })
      expect(wrapper.emitted('update-transactions')).toEqual(
        expect.arrayContaining([expect.arrayContaining([{ currentPage: 2, pageSize: 25 }])]),
      )
    })

    it('renders the transaction gradido transform table when gdt is true', async () => {
      await wrapper.setProps({
        gdt: true,
      })
      expect(wrapper.findComponent({ name: 'GdtTransactionList' }).exists()).toBeTruthy()
    })

    describe('update gdt with success', () => {
      beforeEach(() => {
        apolloMock.mockResolvedValue({
          data: {
            listGDTEntries: {
              count: 4,
              gdtEntries: [
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
            },
          },
        })
        wrapper = Wrapper({ gdt: true })
      })

      it('calls the API', () => {
        expect(apolloMock).toBeCalledWith({
          query: listGDTEntriesQuery,
          variables: {
            currentPage: 1,
            pageSize: 25,
          },
        })
      })

      it('does not show the GDD transactions', () => {
        expect(wrapper.findAll('div.gdd-transaction-list').exists()).toBeFalsy()
      })

      it('shows the GDT transactions', () => {
        expect(wrapper.findAll('div.gdt-transaction-list').exists()).toBeTruthy()
      })

      it('scrolls to (0, 0) after API call', () => {
        expect(windowScrollToMock).toBeCalledWith(0, 0)
      })

      describe('update current page', () => {
        beforeEach(() => {
          jest.clearAllMocks()
          wrapper.vm.currentPage = 2
        })

        it('calls the API again', () => {
          expect(apolloMock).toBeCalledWith({
            query: listGDTEntriesQuery,
            variables: {
              currentPage: 2,
              pageSize: 25,
            },
          })
        })
      })
    })

    describe('update gdt with error', () => {
      beforeEach(() => {
        apolloMock.mockRejectedValue({ message: 'Oh no!' })
        wrapper = Wrapper({ gdt: true })
      })

      it('toasts the error', () => {
        expect(toastErrorSpy).toBeCalledWith('Oh no!')
      })
    })
  })
})
