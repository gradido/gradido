import { mount } from '@vue/test-utils'
import CommunityStatistic from './CommunityStatistic.vue'

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockResolvedValue({
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

const mocks = {
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
  $apollo: {
    query: apolloQueryMock,
  },
}

describe('CommunityStatistic', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CommunityStatistic, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".community-statistic"', () => {
      expect(wrapper.find('div.community-statistic').exists()).toBe(true)
    })
  })
})
