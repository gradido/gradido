import { mount } from '@vue/test-utils'
import CommunityStatistic from './CommunityStatistic.vue'
import { communityStatistics } from '@/graphql/communityStatistics.js'
import { toastErrorSpy } from '../../test/testSetup'
import VueApollo from 'vue-apollo'
import { createMockClient } from 'mock-apollo-client'

const mockClient = createMockClient()
const apolloProvider = new VueApollo({
  defaultClient: mockClient,
})

const localVue = global.localVue
localVue.use(VueApollo)

const defaultData = () => {
  return {
    communityStatistics: {
      totalUsers: 3113,
      activeUsers: 1057,
      deletedUsers: 35,
      totalGradidoCreated: '4083774.05000000000000000000',
      totalGradidoDecayed: '-1062639.13634129622923372197',
      totalGradidoAvailable: '2513565.869444365732411569',
      totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
    },
  }
}

const mocks = {
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
}

describe('CommunityStatistic', () => {
  let wrapper

  const communityStatisticsMock = jest.fn()

  mockClient.setRequestHandler(
    communityStatistics,
    communityStatisticsMock
      .mockRejectedValueOnce({ message: 'Ouch!' })
      .mockResolvedValue({ data: defaultData() }),
  )

  const Wrapper = () => {
    return mount(CommunityStatistic, { localVue, mocks, apolloProvider })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".community-statistic"', () => {
      expect(wrapper.find('div.community-statistic').exists()).toBe(true)
    })

    describe('server response for get statistics is an error', () => {
      it('toast an error message', () => {
        expect(toastErrorSpy).toBeCalledWith('Ouch!')
      })
    })

    describe('server response for getting statistics is success', () => {
      it('has received the correct data', () => {
        expect(wrapper.vm.statistics.activeUsers).toEqual(1057)
        expect(wrapper.vm.statistics.deletedUsers).toEqual(35)
        expect(wrapper.vm.statistics.totalGradidoAvailable).toEqual('2513565.869444365732411569')
        expect(wrapper.vm.statistics.totalGradidoCreated).toEqual('4083774.05000000000000000000')
        expect(wrapper.vm.statistics.totalGradidoDecayed).toEqual('-1062639.13634129622923372197')
        expect(wrapper.vm.statistics.totalGradidoUnbookedDecayed).toEqual(
          '-500474.6738366222166261272',
        )
        expect(wrapper.vm.statistics.totalUsers).toEqual(3113)
      })
    })
  })
})
