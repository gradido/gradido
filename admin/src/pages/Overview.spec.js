import { mount } from '@vue/test-utils'
import Overview from './Overview.vue'
import { communityStatistics } from '@/graphql/communityStatistics.js'
import { listUnconfirmedContributions } from '@/graphql/listUnconfirmedContributions.js'

const localVue = global.localVue

const apolloQueryMock = jest
  .fn()
  .mockResolvedValueOnce({
    data: {
      listUnconfirmedContributions: [
        {
          pending: true,
        },
        {
          pending: true,
        },
        {
          pending: true,
        },
      ],
    },
  })
  .mockResolvedValueOnce({
    data: {
      communityStatistics: {
        totalUsers: 3113,
        activeUsers: 1057,
        deletedUsers: 35,
        totalGradidoCreated: '4083774.05000000000000000000',
        totalGradidoDecayed: '-1062639.13634129622923372197',
        totalGradidoAvailable: '2513565.869444365732411569',
        totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
      },
    },
  })
  .mockResolvedValue({
    data: {
      listUnconfirmedContributions: [
        {
          pending: true,
        },
        {
          pending: true,
        },
        {
          pending: true,
        },
      ],
    },
  })

const storeCommitMock = jest.fn()

const mocks = {
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
  $d: jest.fn((d) => d),
  $apollo: {
    query: apolloQueryMock,
  },
  $store: {
    commit: storeCommitMock,
    state: {
      openCreations: 2,
    },
  },
}

describe('Overview', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Overview, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('calls listUnconfirmedContributions', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: listUnconfirmedContributions,
        }),
      )
    })

    it('calls communityStatistics', () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({
          query: communityStatistics,
        }),
      )
    })

    it('commits three pending creations to store', () => {
      expect(storeCommitMock).toBeCalledWith('setOpenCreations', 3)
    })

    describe('with open creations', () => {
      it('renders a link to confirm creations', () => {
        expect(wrapper.find('a[href="creation-confirm"]').text()).toContain('2')
        expect(wrapper.find('a[href="creation-confirm"]').exists()).toBeTruthy()
      })
    })

    describe('without open creations', () => {
      beforeEach(() => {
        mocks.$store.state.openCreations = 0
      })

      it('renders a link to confirm creations', () => {
        expect(wrapper.find('a[href="creation-confirm"]').text()).toContain('0')
        expect(wrapper.find('a[href="creation-confirm"]').exists()).toBeTruthy()
      })
    })
  })
})
