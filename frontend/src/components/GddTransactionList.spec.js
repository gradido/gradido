import { mount } from '@vue/test-utils'
import GddTransactionList from './GddTransactionList'

const localVue = global.localVue

const scrollToMock = jest.fn()

global.scrollTo = scrollToMock

describe('GddTransactionList', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $i18n: {
      locale: () => 'en',
    },
  }

  const Wrapper = () => {
    return mount(GddTransactionList, { localVue, mocks })
  }

  const decayStartBlock = new Date('2021-05-13 17:46:31-0000')

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdd-transaction-list').exists()).toBeTruthy()
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
          count: 0,
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
          count: -1,
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
              amount: '-0.16778637075575395772595',
              balance: '31.59320453982945549519405',
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
              balanceDate: '2022-02-28T13:55:47',
              memo:
                'Um den Kessel schlingt den Reihn, Werft die Eingeweid‘ hinein. Kröte du, die Nacht und Tag Unterm kalten Steine lag,',
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
              balanceDate: '2022-02-23T10:55:30',
              memo:
                'Monatlanges Gift sog ein, In den Topf zuerst hinein… (William Shakespeare, Die Hexen aus Macbeth)',
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
          count: 12,
          decayStartBlock,
        })
      })

      it('renders 4 transactions', () => {
        expect(wrapper.findAll('div.test-list-group-item')).toHaveLength(4)
      })

      describe('decay transactions', () => {
        // let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.test-list-group-item').at(0)
        })

        it('has a bi-droplet-half icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-droplet-half',
            'm-mb-1',
            'font2em',
            'b-icon',
            'bi',
            'text-color-gdd-yellow',
          ])
        })

        it('has a bi-arrow-down-circle icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toEqual([
            'bi-arrow-down-circle',
            'h1',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        // it('has gradido-global-color-gray color', () => {
        //   expect(transaction.findAll('svg').at(1).classes()).toEqual([
        //     'bi-arrow-down-circle',
        //     'b-icon',
        //     'bi',
        //     'text-muted',
        //   ])
        // })

        // it.skip('shows the amount of transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
        //     '0.16778637075575395',
        //   )
        // })

        // it.skip('shows the name of the receiver', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toBe(
        //     'decay.decay_since_last_transaction',
        //   )
        // })
      })

      describe('send transactions', () => {
        // let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.test-list-group-item').at(1)
        })

        it('has a bi-arrow-down-circle icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-arrow-down-circle',
            'h1',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        it('has a bi-droplet-half icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toEqual([
            'bi-droplet-half',
            'mr-2',
            'b-icon',
            'bi',
          ])
        })

        // it('has text-danger color', () => {
        //   expect(transaction.findAll('svg').at(1).classes()).toEqual([
        //     'bi-droplet-half',
        //     'mr-2',
        //     'b-icon',
        //     'bi',
        //   ])
        // })

        // operators are renderd by GDD filter
        // it.skip('has a minus operator', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-operator').at(0).text()).toContain(
        //     '-',
        //   )
        // })

        // it.skip('shows the amount of transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
        //     '1',
        //   )
        // })

        // it.skip('shows the name of the receiver', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toContain(
        //     'Bibi Bloxberg',
        //   )
        // })

        // it.skip('shows the message of the transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-message').at(0).text()).toContain(
        //     'Um den Kessel schlingt den Reihn, Werft die Eingeweid‘ hinein. Kröte du, die Nacht und Tag Unterm kalten Steine lag,',
        //   )
        // })

        // it.skip('shows the date of the transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-date').at(0).text()).toContain(
        //     'Mon Feb 28 2022 13:55:47 GMT+0000',
        //   )
        // })

        // it.skip('shows the decay calculation', () => {
        //   expect(transaction.findAll('div.gdd-transaction-list-item-decay').at(0).text()).toContain(
        //     '− 0.2038314055482643084',
        //   )
        // })
      })

      describe('receive transactions', () => {
        // let transaction

        beforeEach(() => {
          transaction = wrapper.findAll('div.test-list-group-item').at(2)
        })

        it('has a bi-arrow-down-circle icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-arrow-down-circle',
            'h1',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        // it('has a bi-gift icon', () => {
        //   expect(transaction.findAll('svg').at(1).classes()).toEqual(['bi-gift', 'b-icon', 'bi'])
        // })

        // it.skip('has gradido-global-color-accent color', () => {
        //   expect(transaction.findAll('svg').at(1).classes()).toEqual([
        //     'bi-arrow-right-circle',
        //     'm-mb-1',
        //     'font2em',
        //     'b-icon',
        //     'bi',
        //     'gradido-global-color-accent',
        //   ])
        // })

        // // operators are renderd by GDD filter
        // it.skip('has a plus operator', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-operator').at(0).text()).toContain(
        //     '+',
        //   )
        // })

        // it.skip('shows the amount of transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
        //     '+ 10 GDD',
        //   )
        // })

        // it.skip('shows the name of the receiver', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toContain(
        //     'Bibi Bloxberg',
        //   )
        // })

        // it.skip('shows the date of the transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-date').at(0).text()).toContain(
        //     'Wed Feb 23 2022 10:55:30 GMT+0000',
        //   )
        // })
      })

      describe('creation transactions', () => {
        // let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.test-list-group-item').at(3)
        })

        it('has a bi-gift icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual(['bi-gift', 'b-icon', 'bi'])
        })

        it('has a bi-arrow-down-circle icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toEqual([
            'bi-arrow-down-circle',
            'h1',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        // operators are renderd by GDD filter
        // it('has a plus operator', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-operator').at(0).text()).toContain(
        //     '+',
        //   )
        // })

        // it('shows the amount of transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
        //     '10',
        //   )
        // })

        // it('shows the name of the recipient', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toContain(
        //     'Gradido Akademie',
        //   )
        // })

        // it('shows the message of the transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-message').at(0).text()).toContain(
        //     'Jammern hilft nichts, sondern ich kann selber meinen Teil dazu beitragen.',
        //   )
        // })

        // it('shows the date of the transaction', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-date').at(0).text()).toContain(
        //     'Fri Feb 25 2022 07:29:26 GMT+0000',
        //   )
        // })

        // it('shows the decay calculation', () => {
        //   expect(transaction.findAll('.gdd-transaction-list-item-decay').at(0).text()).toContain(
        //     '0',
        //   )
        // })
      })
    })

    describe('pagination buttons', () => {
      const createTransaction = (idx) => {
        return {
          amount: '3.14',
          balanceDate: '2021-04-29T17:26:40+00:00',
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
          transactions: Array.from({ length: transactionCount }, (_, idx) => {
            return createTransaction(idx)
          }),
          transactionCount,
          decayStartBlock,
          pageSize: 25,
          showPagination: true,
        })
      })

      describe('next page button clicked', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          // await wrapper.vm.$nextTick()
          await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('input', 2)
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
            transactions: Array.from({ length: transactionCount }, (_, idx) => {
              return createTransaction(idx)
            }),
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
