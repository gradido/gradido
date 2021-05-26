import { mount } from '@vue/test-utils'
import GddTransactionList from './GddTransactionList'

const localVue = global.localVue

const errorHandler = jest.fn()

localVue.config.errorHandler = errorHandler

describe('GddTransactionList', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
    $t: jest.fn((t) => t),
    $d: jest.fn((d) => d),
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

    describe('without any properties', () => {
      it('renders text saying that there are no transactions', () => {
        expect(wrapper.find('div.gdd-transaction-list').text()).toBe('transaction.nullTransactions')
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
        await wrapper.setProps({
          transactions: [
            {
              balance: '19.93',
              date: '2021-05-25T17:38:13+00:00',
              memo: 'Alles Gute zum Geburtstag',
              name: 'Bob der Baumeister',
              transaction_id: 29,
              type: 'send',
            },
            {
              balance: '1000',
              date: '2021-04-29T15:34:49+00:00',
              memo: 'Gut das du da bist!',
              name: 'Gradido Akademie',
              transaction_id: 3,
              type: 'creation',
            },
            {
              balance: '314.98',
              date: '2021-04-29T17:26:40+00:00',
              memo: 'Für das Fahrrad!',
              name: 'Jan Ulrich',
              transaction_id: 8,
              type: 'receive',
            },
            {
              balance: '1.07',
              type: 'decay',
            },
          ],
          transactionCount: 12,
        })
      })

      it('renders 4 transactions', () => {
        expect(wrapper.findAll('div.gdd-transaction-list-item')).toHaveLength(4)
      })

      describe('send transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.gdd-transaction-list-item').at(0)
        })

        it('has a bi-arrow-left-circle icon', () => {
          expect(transaction.find('svg').classes()).toContain('bi-arrow-left-circle')
        })

        it('has text-danger color', () => {
          expect(transaction.find('svg').classes()).toContain('text-danger')
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('19.93')
        })

        it('has a minus operator', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('-')
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('div').at(3).text()).toContain('Bob der Baumeister')
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('div').at(3).text()).toContain('Tue May 25 2021')
        })
      })

      describe('creation transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.gdd-transaction-list-item').at(1)
        })

        it('has a bi-gift icon', () => {
          expect(transaction.find('svg').classes()).toContain('bi-gift')
        })

        it('has gradido-global-color-accent color', () => {
          expect(transaction.find('svg').classes()).toContain('gradido-global-color-accent')
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('1000')
        })

        it('has a plus operator', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('+')
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('div').at(3).text()).toContain('Gradido Akademie')
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('div').at(3).text()).toContain('Thu Apr 29 2021')
        })
      })

      describe('receive transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.gdd-transaction-list-item').at(2)
        })

        it('has a bi-arrow-right-circle icon', () => {
          expect(transaction.find('svg').classes()).toContain('bi-arrow-right-circle')
        })

        it('has gradido-global-color-accent color', () => {
          expect(transaction.find('svg').classes()).toContain('gradido-global-color-accent')
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('314.98')
        })

        it('has a plus operator', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('+')
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('div').at(3).text()).toContain('Jan Ulrich')
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('div').at(3).text()).toContain('Thu Apr 29 2021')
        })
      })

      describe('decay transactions', () => {
        let transaction
        beforeEach(() => {
          transaction = wrapper.findAll('div.gdd-transaction-list-item').at(3)
        })

        it('has a bi-droplet-half icon', () => {
          expect(transaction.find('svg').classes()).toContain('bi-droplet-half')
        })

        it('has gradido-global-color-gray color', () => {
          expect(transaction.find('svg').classes()).toContain('gradido-global-color-gray')
        })

        it('shows the amount of transaction', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('1.07')
        })

        it('has a minus operator', () => {
          expect(transaction.findAll('div').at(2).text()).toContain('-')
        })

        it('shows the name of the receiver', () => {
          expect(transaction.findAll('div').at(3).text()).toBe('decay')
        })
      })

      describe('max property set to 2', () => {
        beforeEach(async () => {
          await wrapper.setProps({ max: 2 })
        })

        it('shows only 2 transactions', () => {
          expect(wrapper.findAll('div.gdd-transaction-list-item')).toHaveLength(2)
        })
      })
    })

    describe('with invalid transaction type', () => {
      beforeEach(async () => {
        await wrapper.setProps({
          transactions: [
            {
              balance: '19.93',
              date: '2021-05-25T17:38:13+00:00',
              memo: 'Alles Gute zum Geburtstag',
              name: 'Bob der Baumeister',
              transaction_id: 29,
              type: 'invalid',
            },
          ],
        })
      })

      it('throws an error', () => {
        expect(errorHandler).toHaveBeenCalled()
      })
    })
  })
})
