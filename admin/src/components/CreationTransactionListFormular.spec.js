import { mount } from '@vue/test-utils'
import CreationTransactionListFormular from './CreationTransactionListFormular.vue'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    creationTransactionList: [
      {
        id: 1,
        amount: 100,
        balanceDate: 0,
        creationDate: new Date(),
        memo: 'Testing',
        linkedUser: {
          firstName: 'Gradido',
          lastName: 'Akademie',
        },
      },
      {
        id: 2,
        amount: 200,
        balanceDate: 0,
        creationDate: new Date(),
        memo: 'Testing 2',
        linkedUser: {
          firstName: 'Gradido',
          lastName: 'Akademie',
        },
      },
    ],
  },
})

const mocks = {
  $d: jest.fn((t) => t),
  $t: jest.fn((t) => t),
  $apollo: {
    query: apolloQueryMock,
  },
}

const propsData = {
  userId: 1,
  fields: ['date', 'balance', 'name', 'memo', 'decay'],
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
        expect(toastErrorSpy).toBeCalledWith('OUCH!')
      })
    })
  })
})
