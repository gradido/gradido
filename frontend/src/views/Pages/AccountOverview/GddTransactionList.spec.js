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
              decay: { balance: '0.5' },
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
              decay: { balance: '1.5' },
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
          expect(transaction.findAll('div').at(0).text()).toContain('Bob der Baumeister')
        })

        it('shows the message of the transaction', () => {
          expect(transaction.findAll('div').at(5).text()).toContain('Alles Gute zum Geburtstag')
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('div').at(8).text()).toContain('Tue May 25 2021')
        })

        it('shows the decay calculation', () => {
          expect(transaction.findAll('div').at(9).text()).toContain('-0.5')
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
          expect(transaction.findAll('div').at(2).text()).toContain('+ 314.98')
        })

        it('shows the name of the recipient', () => {
          expect(transaction.findAll('div').at(0).text()).toContain('Jan Ulrich')
        })

        it('shows the message of the transaction', () => {
          expect(transaction.findAll('div').at(5).text()).toContain('Für das Fahrrad!')
        })

        it('shows the date of the transaction', () => {
          expect(transaction.findAll('div').at(8).text()).toContain('Thu Apr 29 2021')
        })

        it('shows the decay calculation', () => {
          expect(transaction.findAll('div').at(9).text()).toContain('-1.5')
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
          expect(transaction.findAll('div').at(3).text()).toBe('decay.decay_since_last_transaction')
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

    describe('pagination buttons', () => {
      const transactions = Array.from({ length: 42 }, (_, idx) => {
        return {
          balance: '3.14',
          date: '2021-04-29T17:26:40+00:00',
          memo: 'Kreiszahl PI',
          name: 'Euklid',
          transaction_id: idx + 1,
          type: 'receive',
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
        expect(wrapper.emitted('update-transactions')[1]).toEqual([{ firstPage: 2, items: 25 }])
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
        expect(wrapper.emitted('update-transactions')[2]).toEqual([{ firstPage: 1, items: 25 }])
        expect(scrollToMock).toBeCalled()
      })
    })
  })
})
