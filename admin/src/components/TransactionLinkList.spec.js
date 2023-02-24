import { mount } from '@vue/test-utils'
import TransactionLinkList from './TransactionLinkList'
import { listTransactionLinksAdmin } from '../graphql/listTransactionLinksAdmin.js'
import { toastErrorSpy } from '../../test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn()
apolloQueryMock.mockResolvedValue({
  data: {
    listTransactionLinksAdmin: {
      linkCount: 8,
      linkList: [
        {
          amount: '19.99',
          code: '62ef8236ace7217fbd066c5a',
          createdAt: '2022-03-24T17:43:09.000Z',
          deletedAt: null,
          holdAvailableAmount: '20.51411720068412022949',
          id: 36,
          memo: 'Kein Trick, keine Zauberrei,\nbei Gradidio sei dabei!',
          redeemedAt: null,
          validUntil: '2022-04-07T17:43:09.000Z',
        },
        {
          amount: '19.99',
          code: '2b603f36521c617fbd066cef',
          createdAt: '2022-03-24T17:43:09.000Z',
          deletedAt: null,
          holdAvailableAmount: '20.51411720068412022949',
          id: 37,
          memo: 'Kein Trick, keine Zauberrei,\nbei Gradidio sei dabei!',
          redeemedAt: null,
          validUntil: '2022-04-07T17:43:09.000Z',
        },
        {
          amount: '19.99',
          code: '0bb789b5bd5b717fbd066eb5',
          createdAt: '2022-03-24T17:43:09.000Z',
          deletedAt: '2022-03-24T17:43:09.000Z',
          holdAvailableAmount: '20.51411720068412022949',
          id: 40,
          memo: 'Da habe ich mich wohl etwas übernommen.',
          redeemedAt: '2022-04-07T14:43:09.000Z',
          validUntil: '2022-04-07T17:43:09.000Z',
        },
        {
          amount: '19.99',
          code: '2d4a763e516b317fbd066a85',
          createdAt: '2022-01-01T00:00:00.000Z',
          deletedAt: null,
          holdAvailableAmount: '20.51411720068412022949',
          id: 33,
          memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
          redeemedAt: null,
          validUntil: '2022-01-15T00:00:00.000Z',
        },
      ],
    },
  },
})

const propsData = {
  userId: 42,
}

const mocks = {
  $apollo: {
    query: apolloQueryMock,
  },
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
}

describe('TransactionLinkList', () => {
  let wrapper

  const Wrapper = () => {
    return mount(TransactionLinkList, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('calls the API', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: listTransactionLinksAdmin,
          variables: {
            currentPage: 1,
            pageSize: 5,
            userId: 42,
          },
        }),
      )
    })

    it('has 4 items in the table', () => {
      expect(wrapper.findAll('tbody > tr')).toHaveLength(4)
    })

    it('has pagination buttons', () => {
      expect(wrapper.findComponent({ name: 'BPagination' }).exists()).toBe(true)
    })

    describe('next page', () => {
      beforeAll(async () => {
        jest.clearAllMocks()
        await wrapper.findComponent({ name: 'BPagination' }).vm.$emit('input', 2)
      })

      it('calls the API again', () => {
        expect(apolloQueryMock).toBeCalledWith(
          expect.objectContaining({
            query: listTransactionLinksAdmin,
            variables: {
              currentPage: 1,
              pageSize: 5,
              userId: 42,
            },
          }),
        )
      })
    })

    describe('server response with error', () => {
      beforeEach(() => {
        apolloQueryMock.mockRejectedValue({ message: 'Oh no!' })
        wrapper = Wrapper()
      })

      it('toasts an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Oh no!')
      })
    })
  })
})
