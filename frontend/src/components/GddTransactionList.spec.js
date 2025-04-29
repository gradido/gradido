import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import GddTransactionList from './GddTransactionList'

const scrollToMock = vi.fn()
global.scrollTo = scrollToMock

describe('GddTransactionList', () => {
  let wrapper

  const global = {
    mocks: {
      $n: vi.fn((n) => n),
      $t: vi.fn((t) => t),
      $d: vi.fn((d) => d),
      $i18n: {
        locale: () => 'en',
      },
    },
    stubs: {
      BPagination: true,
      TransactionListItem: true,
      TransactionDecay: true,
      TransactionSend: true,
      TransactionReceive: true,
      TransactionCreation: true,
      TransactionLinkSummary: true,
    },
  }

  const mountComponent = (props = {}) => {
    return mount(GddTransactionList, {
      props,
      global,
    })
  }

  const decayStartBlock = new Date('2021-05-13 17:46:31-0000')

  describe('mount', () => {
    beforeEach(() => {
      wrapper = mountComponent()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdd-transaction-list').exists()).toBe(true)
    })

    describe('no transactions from server', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactions: false,
        })
      })
      it('shows error no transaction list', () => {
        expect(wrapper.find('div.test-no-transactionlist').text()).toContain(
          'error.no-transactionlist',
        )
      })
    })

    describe('0 transactions from server', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactions: [],
          transactionCount: 0,
        })
      })
      it('Transactions Array is empty, 0 transactions', () => {
        expect(wrapper.find('div.test-empty-transactionlist').exists()).toBe(false)
      })
    })

    describe('without any properties', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactions: [],
          transactionCount: -1,
        })
      })
      it('renders text saying that there are error.empty-transactionlist ', () => {
        expect(wrapper.find('div.gdd-transaction-list').text()).toContain(
          'transaction.nullTransactions',
        )
      })
      it('renders text saying that there are no transaction.nullTransactions', () => {
        expect(wrapper.find('div.gdd-transaction-list').text()).toContain(
          'transaction.nullTransactions',
        )
      })
    })

    describe('timestamp property', () => {
      beforeEach(async () => {
        await wrapper.setProps({ timestamp: new Date().getTime() })
      })
      it('emits update-transactions when timestamp changes', async () => {
        await wrapper.setProps({ timestamp: 0 })
        expect(wrapper.emitted('update-transactions')).toBeTruthy()
      })
    })

    describe('with transactions', () => {
      let transaction

      beforeEach(async () => {
        await wrapper.setProps({
          transactions: [
            {
              id: -1,
              typeId: 'DECAY',
              amount: '-0.16',
              balance: '31.59',
              previousBalance: '31.75',
              balanceDate: '2022-03-03T08:54:54',
              memo: '',
              linkedUser: null,
              decay: {
                decay: '-0.16778637075575395772595',
                start: '2022-02-28T13:55:47',
                end: '2022-03-03T08:54:54',
                duration: 241147.02,
              },
            },
            {
              id: 9,
              typeId: 'SEND',
              amount: '1',
              balance: '31.76099091058520945292',
              previousBalance: '30.76',
              balanceDate: '2022-02-28T13:55:47',
              memo: 'Um den Kessel schlingt den Reihn, Werft die Eingeweid‘ hinein. Kröte du, die Nacht und Tag Unterm kalten Steine lag,',
              linkedUser: {
                firstName: 'Bibi',
                lastName: 'Bloxberg',
              },
              decay: {
                decay: '-0.2038314055482643084',
                start: '2022-02-25T07:29:26',
                end: '2022-02-28T13:55:47',
                duration: 282381,
              },
            },
            {
              id: 6,
              typeId: 'RECEIVE',
              amount: '10',
              balance: '10',
              previousBalance: '31.75',
              balanceDate: '2022-02-23T10:55:30',
              memo: 'Monatlanges Gift sog ein, In den Topf zuerst hinein… (William Shakespeare, Die Hexen aus Macbeth)',
              linkedUser: {
                firstName: 'Bibi',
                lastName: 'Bloxberg',
              },
              decay: {
                decay: '0',
                start: null,
                end: null,
                duration: null,
              },
            },
            {
              id: 8,
              typeId: 'CREATION',
              amount: '1000',
              balance: '32.96482231613347376132',
              previousBalance: '31.75',
              balanceDate: '2022-02-25T07:29:26',
              memo: 'Jammern hilft nichts, sondern ich kann selber meinen Teil dazu beitragen.',
              linkedUser: {
                firstName: 'Gradido',
                lastName: 'Akademie',
              },
              decay: {
                decay: '-0.03517768386652623868',
                start: '2022-02-23T10:55:30',
                end: '2022-02-25T07:29:26',
                duration: 160436,
              },
            },
          ],
          transactionCount: 12,
          decayStartBlock,
        })
      })

      it('renders 4 transactions', () => {
        expect(wrapper.findAll('.test-list-group-item')).toHaveLength(4)
      })
    })

    describe('pagination buttons', () => {
      const createTransaction = (idx) => {
        return {
          amount: '3.14',
          balanceDate: '2021-04-29T17:26:40+00:00',
          previousBalance: '31.75',
          decay: {
            decay: '-477.01',
            start: '2021-05-13T17:46:31.000Z',
            end: '2022-04-20T06:51:25.000Z',
            duration: 29509494,
          },
          memo: 'Kreiszahl PI',
          linkedUser: {
            firstName: 'Bibi',
            lastName: 'Bloxberg',
          },
          id: idx + 1,
          typeId: 'RECEIVE',
          balance: '33.33',
        }
      }

      beforeEach(async () => {
        const transactionCount = 42
        await wrapper.setProps({
          transactions: Array.from({ length: transactionCount }, (_, idx) =>
            createTransaction(idx),
          ),
          transactionCount,
          decayStartBlock,
          pageSize: 25,
          showPagination: true,
        })
      })

      describe('next page button clicked', () => {
        beforeEach(async () => {
          vi.clearAllMocks()
          await wrapper.vm.$nextTick()
          await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('update:modelValue', 2)
        })

        it('emits update transactions', () => {
          expect(wrapper.emitted('update-transactions')).toEqual(
            expect.arrayContaining([[{ currentPage: 2, pageSize: 25 }]]),
          )
        })
      })

      describe('show no pagination', () => {
        it('shows no pagination buttons', async () => {
          const transactionCount = 2
          await wrapper.setProps({
            transactions: Array.from({ length: transactionCount }, (_, idx) =>
              createTransaction(idx),
            ),
            transactionCount,
            decayStartBlock,
            pageSize: 25,
            showPagination: false,
          })
          expect(wrapper.find('ul.pagination').exists()).toBe(false)
        })
      })
    })
  })
})
