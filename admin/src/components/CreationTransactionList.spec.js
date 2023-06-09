import { mount } from '@vue/test-utils'
import CreationTransactionList from './CreationTransactionList'
import { toastErrorSpy } from '../../test/testSetup'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { adminListContributions } from '../graphql/adminListContributions'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue
localVue.use(VueApollo)

const defaultData = () => {
  return {
    adminListContributions: {
      contributionCount: 2,
      contributionList: [
        {
          id: 1,
          firstName: 'Bibi',
          lastName: 'Bloxberg',
          userId: 99,
          email: 'bibi@bloxberg.de',
          amount: 500,
          memo: 'Danke für alles',
          date: new Date(),
          moderator: 1,
          state: 'PENDING',
          creation: [500, 500, 500],
          messagesCount: 0,
          deniedBy: null,
          deniedAt: null,
          confirmedBy: null,
          confirmedAt: null,
          contributionDate: new Date(),
          deletedBy: null,
          deletedAt: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          firstName: 'Räuber',
          lastName: 'Hotzenplotz',
          userId: 100,
          email: 'raeuber@hotzenplotz.de',
          amount: 1000000,
          memo: 'Gut Ergattert',
          date: new Date(),
          moderator: 1,
          state: 'PENDING',
          creation: [500, 500, 500],
          messagesCount: 0,
          deniedBy: null,
          deniedAt: null,
          confirmedBy: null,
          confirmedAt: new Date(),
          contributionDate: new Date(),
          deletedBy: null,
          deletedAt: null,
          createdAt: new Date(),
        },
      ],
    },
  }
}

const mocks = {
  $d: jest.fn((t) => t),
  $t: jest.fn((t) => t),
}

const propsData = {
  userId: 1,
  fields: ['createdAt', 'contributionDate', 'confirmedAt', 'amount', 'memo'],
}

describe('CreationTransactionList', () => {
  let wrapper

  const adminListContributionsMock = jest.fn()
  mockClient.setRequestHandler(
    adminListContributions,
    adminListContributionsMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  const Wrapper = () => {
    return mount(CreationTransactionList, { localVue, mocks, propsData, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('server error', () => {
      it('toast error', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })

    describe('sever success', () => {
      it('sends query to Apollo when created', () => {
        expect(adminListContributionsMock).toBeCalledWith({
          currentPage: 1,
          pageSize: 10,
          order: 'DESC',
          userId: 1,
        })
      })

      it('has two values for the transaction', () => {
        expect(wrapper.find('tbody').findAll('tr').length).toBe(2)
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
})
