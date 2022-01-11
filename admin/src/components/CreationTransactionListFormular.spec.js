import { mount } from '@vue/test-utils'
import CreationTransactionListFormular from './CreationTransactionListFormular.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    transactionList: {
      transactions: [
        {
          type: 'created',
          balance: 100,
          decayStart: 0,
          decayEnd: 0,
          decayDuration: 0,
          memo: 'Testing',
          transactionId: 1,
          name: 'Bibi',
          email: 'bibi@bloxberg.de',
          date: new Date(),
          decay: {
            balance: 0.01,
            decayStart: 0,
            decayEnd: 0,
            decayDuration: 0,
            decayStartBlock: 0,
          },
        },
        {
          type: 'created',
          balance: 200,
          decayStart: 0,
          decayEnd: 0,
          decayDuration: 0,
          memo: 'Testing 2',
          transactionId: 2,
          name: 'Bibi',
          email: 'bibi@bloxberg.de',
          date: new Date(),
          decay: {
            balance: 0.01,
            decayStart: 0,
            decayEnd: 0,
            decayDuration: 0,
            decayStartBlock: 0,
          },
        },
      ],
    },
  },
})

const toastedErrorMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
  $toasted: {
    global: {
      error: toastedErrorMock,
    },
  },
}

const propsData = {
  userId: 1,
}

describe('CreationTransactionListFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationTransactionListFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('sends query to Apollo when created', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          variables: {
            currentPage: 1,
            pageSize: 25,
            order: 'DESC',
            onlyCreations: true,
            userId: 1,
          },
        }),
      )
    })

    it('has two values for the transaction', () => {
      expect(wrapper.find('tbody').findAll('tr').length).toBe(2)
    })

    describe('query transaction with error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({ message: 'OUCH!' })
        wrapper = Wrapper()
      })

      it('calls the API', () => {
        expect(apolloQueryMock).toBeCalled()
      })

      it('toast error', () => {
        expect(toastedErrorMock).toBeCalledWith('OUCH!')
      })
    })
  })
})
