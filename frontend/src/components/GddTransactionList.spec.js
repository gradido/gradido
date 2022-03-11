import { mount } from '@vue/test-utils'
import GddTransactionList from './GddTransactionList'

const localVue = global.localVue

const errorHandler = jest.fn()

localVue.config.errorHandler = errorHandler

const scrollToMock = jest.fn()

global.scrollTo = scrollToMock

describe('GddTransactionList', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
    $i18n: {
      locale: () => 'de',
    },
  }

  const Wrapper = () => {
    return mount(GddTransactionList, { localVue, mocks })
  }

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
      beforeEach(async () => {
        const decayStartBlock = new Date(2001, 8, 9)
        await wrapper.setProps({
          transactions: [
            {
              id: -1,
              typeId: 'DECAY',
              amount: '-0.16778637075575395772595',
              balance: '31.59320453982945549519405',
              balanceDate: '2022-03-03T08:54:54.020Z',
              memo: '',
              linkedUser: null,
              decay: {
                decay: '-0.16778637075575395772595',
                start: '2022-02-28T13:55:47.000Z',
                end: '2022-03-03T08:54:54.020Z',
                duration: 241147.02,
              },
            },
            {
              id: 9,
              typeId: 'SEND',
              amount: '1',
              balance: '31.76099091058520945292',
              balanceDate: '2022-02-28T13:55:47.000Z',
              memo: 'adasd adada',
              linkedUser: {
                firstName: 'Bibi',
                lastName: 'Bloxberg',
              },
              decay: {
                decay: '-0.2038314055482643084',
                start: '2022-02-25T07:29:26.000Z',
                end: '2022-02-28T13:55:47.000Z',
                duration: 282381,
              },
            },
            {
              id: 8,
              typeId: 'CREATION',
              amount: '1000',
              balance: '32.96482231613347376132',
              balanceDate: '2022-02-25T07:29:26.000Z',
              memo: 'asd adada dad',
              linkedUser: {
                firstName: 'Gradido',
                lastName: 'Akademie',
              },
              decay: {
                decay: '-0.03517768386652623868',
                start: '2022-02-23T10:55:30.000Z',
                end: '2022-02-25T07:29:26.000Z',
                duration: 160436,
              },
            },
            {
              id: 6,
              typeId: 'RECEIVE',
              amount: '10',
              balance: '10',
              balanceDate: '2022-02-23T10:55:30.000Z',
              memo: 'asd adaaad adad addad ',
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
          ],
          count: 12,
          decayStartBlock,
        })
      })

      it('renders 4 transactions', () => {
        expect(wrapper.findAll('div.list-group-item')).toHaveLength(4)
      })

      describe('decay transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.list-group-item').at(0)
        })

        it('has a bi-caret-down-square icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-caret-down-square',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        it('has a bi-droplet-half icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toContain('bi-droplet-half')
        })

        it('has gradido-global-color-gray color', () => {
          expect(transaction.findAll('svg').at(1).classes()).toContain('gradido-global-color-gray')
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
            '0.16778637075575395',
          )
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toBe(
            'decay.decay_since_last_transaction',
          )
        })
      })

      describe('send transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.list-group-item').at(1)
        })

        it('has a bi-caret-down-square icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-caret-down-square',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        it('has a bi-arrow-left-circle icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toContain('bi-arrow-left-circle')
        })

        it('has text-danger color', () => {
          expect(transaction.findAll('svg').at(1).classes()).toContain('text-danger')
        })

        // operators are renderd by GDD filter
        it.skip('has a minus operator', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-operator').at(0).text()).toContain(
            '-',
          )
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
            '1',
          )
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toContain(
            'Bibi Bloxberg',
          )
        })

        it('shows the message of the transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-message').at(0).text()).toContain(
            'adasd adada',
          )
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-date').at(0).text()).toContain(
            'Mon Feb 28 2022 13:55:47',
          )
        })

        it('shows the decay calculation', () => {
          expect(transaction.findAll('div.gdd-transaction-list-item-decay').at(0).text()).toContain(
            '− 0.2038314055482643084',
          )
        })
      })

      describe('creation transactions', () => {
        let transaction

        beforeEach(() => {
          transaction = wrapper.findAll('div.list-group-item').at(2)
        })

        it('has a bi-caret-down-square icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-caret-down-square',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        it('has a bi-gift icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toEqual([
            'gradido-global-color-accent',
          ])
        })

        it('has gradido-global-color-accent color', () => {
          expect(transaction.findAll('svg').at(1).classes()).toContain(
            'gradido-global-color-accent',
          )
        })

        // operators are renderd by GDD filter
        it.skip('has a plus operator', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-operator').at(0).text()).toContain(
            '+',
          )
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
            '1000',
          )
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toContain(
            'Gradido Akademie',
          )
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-date').at(0).text()).toContain(
            'Fri Feb 25 2022 07:29:26',
          )
        })
      })

      describe('receive transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.list-group-item').at(3)
        })

        it('has a bi-caret-down-square icon', () => {
          expect(transaction.findAll('svg').at(0).classes()).toEqual([
            'bi-caret-down-square',
            'b-icon',
            'bi',
            'text-muted',
          ])
        })

        it('has a bi-arrow-right-circle icon', () => {
          expect(transaction.findAll('svg').at(1).classes()).toContain('bi-arrow-right-circle')
        })

        it('has gradido-global-color-accent color', () => {
          expect(transaction.findAll('svg').at(1).classes()).toEqual([
            'gradido-global-color-accent',
          ])
        })

        // operators are renderd by GDD filter
        it.skip('has a plus operator', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-operator').at(0).text()).toContain(
            '+',
          )
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-amount').at(0).text()).toContain(
            '10',
          )
        })

        it('shows the name of the recipient', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-name').at(0).text()).toContain(
            'Bibi Bloxberg',
          )
        })

        it('shows the message of the transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-message').at(0).text()).toContain(
            'asd adaaad adad addad',
          )
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-date').at(0).text()).toContain(
            'Wed Feb 23 2022 10:55:30',
          )
        })

        it('shows the decay calculation', () => {
          expect(transaction.findAll('.gdd-transaction-list-item-decay').at(0).text()).toContain(
            '0',
          )
        })
      })
    })

    describe('pagination buttons', () => {
      const transactions = Array.from({ length: 42 }, (_, idx) => {
        return {
          amount: '3.14',
          balanceDate: '2021-04-29T17:26:40+00:00',
          memo: 'Kreiszahl PI',
          linkedUser: {
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            __typename: 'User',
          },
          id: idx + 1,
          typeId: 'RECEIVE',
        }
      })

      let paginationButtons

      beforeEach(async () => {
        await wrapper.setProps({
          transactions,
          transactionCount: 42,
          showPagination: true,
        })
        paginationButtons = wrapper.find('div.pagination-buttons')
      })

      it('shows the pagination buttons', () => {
        expect(paginationButtons.exists()).toBeTruthy()
      })

      it('has the previous button disabled', () => {
        expect(paginationButtons.find('button.previous-page').attributes('disabled')).toBe(
          'disabled',
        )
      })

      it('shows the text "1 / 2"', () => {
        expect(paginationButtons.find('p.text-center').text()).toBe('1 / 2')
      })

      it('emits update-transactions when next button is clicked', async () => {
        await paginationButtons.find('button.next-page').trigger('click')
        expect(wrapper.emitted('update-transactions')[1]).toEqual([
          { currentPage: 2, pageSize: 25 },
        ])
      })

      it('shows text "2 / 2" when next button is clicked', async () => {
        await paginationButtons.find('button.next-page').trigger('click')
        expect(paginationButtons.find('p.text-center').text()).toBe('2 / 2')
      })

      it('has next-button disabled when next button is clicked', async () => {
        await paginationButtons.find('button.next-page').trigger('click')
        expect(paginationButtons.find('button.next-page').attributes('disabled')).toBe('disabled')
      })

      it('scrolls to top after loading next page', async () => {
        await paginationButtons.find('button.next-page').trigger('click')
        expect(scrollToMock).toBeCalled()
      })

      it('emits update-transactions when preivous button is clicked after next buton', async () => {
        await paginationButtons.find('button.next-page').trigger('click')
        await paginationButtons.find('button.previous-page').trigger('click')
        expect(wrapper.emitted('update-transactions')[2]).toEqual([
          { currentPage: 1, pageSize: 25 },
        ])
        expect(scrollToMock).toBeCalled()
      })
    })
  })
})
