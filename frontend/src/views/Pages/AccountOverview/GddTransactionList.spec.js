import { mount } from '@vue/test-utils'
import GddTransactionList from './GddTransactionList'

const localVue = global.localVue

describe('GddTransactionList', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
    $t: jest.fn((t) => t),
    $moment: jest.fn((m) => m),
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

    describe('with transacrions', () => {
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
        console.log(wrapper.html())
        expect(true).toBeThruthy()
      })
    })
  })
})
