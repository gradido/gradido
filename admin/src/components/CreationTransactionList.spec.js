import { mount } from '@vue/test-utils'
import CreationTransactionList from './CreationTransactionList'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
  data: {
    creationTransactionList: {
      contributionCount: 2,
      contributionList: [
        {
          id: 1,
          amount: 5.8,
          createdAt: '2022-09-21T11:09:51.000Z',
          confirmedAt: null,
          contributionDate: '2022-08-01T00:00:00.000Z',
          memo: 'für deine Hilfe, Fräulein Rottenmeier',
          state: 'PENDING',
        },
        {
          id: 2,
          amount: '47',
          createdAt: '2022-09-21T11:09:28.000Z',
          confirmedAt: '2022-09-21T11:09:28.000Z',
          contributionDate: '2022-08-01T00:00:00.000Z',
          memo: 'für deine Hilfe, Frau Holle',
          state: 'CONFIRMED',
        },
      ],
    },
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
  fields: ['createdAt', 'contributionDate', 'confirmedAt', 'amount', 'memo'],
}

describe('CreationTransactionList', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationTransactionList, { localVue, mocks, propsData })
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
            pageSize: 10,
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

    describe('watch currentPage', () => {
      beforeEach(async () => {
        jest.clearAllMocks()
        await wrapper.setData({ currentPage: 2 })
      })

      it('returns the string in normal order if reversed property is not true', () => {
        expect(wrapper.vm.currentPage).toBe(2)
      })
    })
  })
})
