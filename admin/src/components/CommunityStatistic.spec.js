import { mount } from '@vue/test-utils'
import CommunityStatistic from './CommunityStatistic'

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
}

const propsData = {
  value: {
    totalUsers: '123',
    activeUsers: '100',
    deletedUsers: '5',
    totalGradidoCreated: '2500',
    totalGradidoDecayed: '200',
    totalGradidoAvailable: '500',
    totalGradidoUnbookedDecayed: '111',
  },
}

describe('CommunityStatistic', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CommunityStatistic, { localVue, mocks, propsData })
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
