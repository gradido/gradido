import { mount } from '@vue/test-utils'
import Overview from './Overview'
import { adminListAllContributions } from '../graphql/adminListAllContributions'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'
import { toastErrorSpy } from '../../test/testSetup'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue

localVue.use(VueApollo)

const storeCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
  $d: jest.fn((d) => d),
  $store: {
    commit: storeCommitMock,
    state: {
      openCreations: 1,
    },
  },
}

const defaultData = () => {
  return {
    adminListAllContributions: {
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
          confirmedAt: null,
          contributionDate: new Date(),
          deletedBy: null,
          deletedAt: null,
          createdAt: new Date(),
        },
      ],
    },
  }
}

describe('Overview', () => {
  let wrapper
  const adminListAllContributionsMock = jest.fn()

  mockClient.setRequestHandler(
    adminListAllContributions,
    adminListAllContributionsMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  const Wrapper = () => {
    return mount(Overview, { localVue, mocks, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('server response for get pending creations is error', () => {
      it('toast an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })

    it('calls the adminListAllContributions query', () => {
      expect(adminListAllContributionsMock).toBeCalledWith({
        currentPage: 1,
        order: 'DESC',
        pageSize: 25,
        statusFilter: ['IN_PROGRESS', 'PENDING'],
      })
    })

    it('commits three pending creations to store', () => {
      expect(storeCommitMock).toBeCalledWith('setOpenCreations', 2)
    })

    describe('with open creations', () => {
      beforeEach(() => {
        mocks.$store.state.openCreations = 2
      })
      it('renders a link to confirm 2 creations', () => {
        expect(wrapper.find('[data-test="open-creation"]').text()).toContain('2')
        expect(wrapper.find('a[href="creation-confirm"]').exists()).toBeTruthy()
      })
    })

    describe('without open creations', () => {
      beforeEach(() => {
        mocks.$store.state.openCreations = 0
      })

      it('renders a link to confirm creations', () => {
        expect(wrapper.find('[data-test="open-creation"]').text()).toContain('0')
        expect(wrapper.find('a[href="creation-confirm"]').exists()).toBeTruthy()
      })
    })
  })
})
