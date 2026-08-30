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

        // ⚠️ Started at 3, not at the prop's default of 1: asserting "still 1" after a click
        // would pass just as happily against a hardcoded `:model-value="1"`, with the prop
        // not wired at all. Named by the review of 30.08.2026, which proved it by severing
        // the binding.
        describe('while the layout holds another page', () => {
          beforeEach(async () => {
            await wrapper.setProps({ currentPage: 3 })
            await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('update:modelValue', 5)
          })

          it('asks for the page that was clicked', () => {
            expect(wrapper.emitted('update-transactions')).toEqual(
              expect.arrayContaining([[{ currentPage: 5, pageSize: 25 }]]),
            )
          })

          it('leaves the highlight where the layout put it', () => {
            const paginator = wrapper.findComponent({ name: 'BPagination' })
            expect(paginator.attributes('model-value')).toBe('3')
          })
        })

        it('emits update transactions', () => {
          expect(wrapper.emitted('update-transactions')).toEqual(
            expect.arrayContaining([[{ currentPage: 2, pageSize: 25 }]]),
          )
        })

        /**
         * ⛔ Asking is all a click does. The highlight follows the ROWS, which arrive from
         * the layout together with the page number they belong to -- so it cannot run ahead
         * of them.
         *
         * Until 30.08.2026 the click set a number here, and this component is rebuilt on
         * every route change while the query above it is not: it came back at one, the rows
         * were whatever page the member had last turned to, and the buttons back to page one
         * were disabled because the paginator believed it was there.
         */
      })

      it('shows the page it was given', async () => {
        await wrapper.setProps({ currentPage: 3 })

        // ⚠️ An ATTRIBUTE, and a string: the auto-stub declares no props of its own, so
        // `props('modelValue')` comes back undefined and would pass against any page.
        expect(wrapper.findComponent({ name: 'BPagination' }).attributes('model-value')).toBe('3')
      })

      /**
       * ⛔ Withdrawing a link asks for the page the member is ON, not for page one. The
       * review of 30.08.2026 proved this was uncovered by changing the handler to
       * `askForPage(1)` -- every test in this file stayed green, while a member on page
       * three would have been thrown back to the top of their bookings.
       */
      it('re-asks for the page it is on when a link is withdrawn', async () => {
        // ⚠️ Its own wrapper, with a TransactionListItem stub that RENDERS ITS SLOTS. The
        // default stub renders none, and the link summary lives in one -- so through the
        // shared stubs this row does not exist and the test would report nothing found in a
        // way that reads exactly like "the wiring is gone".
        const withRow = mount(GddTransactionList, {
          props: {
            currentPage: 3,
            transactions: [{ id: 1, typeId: 'LINK_SUMMARY' }],
            transactionCount: 42,
            pageSize: 25,
            showPagination: true,
          },
          global: {
            ...global,
            stubs: {
              ...global.stubs,
              TransactionListItem: { template: '<div><slot name="LINK_SUMMARY" /></div>' },
            },
          },
        })

        await withRow
          .findComponent({ name: 'TransactionLinkSummary' })
          .vm.$emit('update-transactions')
        const asked = withRow.emitted('update-transactions')
        withRow.unmount()

        expect(asked).toEqual([[{ currentPage: 3, pageSize: 25 }]])
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
