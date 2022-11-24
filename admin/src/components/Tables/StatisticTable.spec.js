import { mount } from '@vue/test-utils'
import StatisticTable from './StatisticTable.vue'

const localVue = global.localVue

const propsData = {
  value: {
    totalUsers: 3113,
    activeUsers: 1057,
    deletedUsers: 35,
    totalGradidoCreated: '4083774.05000000000000000000',
    totalGradidoDecayed: '-1062639.13634129622923372197',
    totalGradidoAvailable: '2513565.869444365732411569',
    totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
  },
}

const mocks = {
  $t: jest.fn((t) => t),
  $n: jest.fn((n) => n),
  $d: jest.fn((d) => d),
}

describe('StatisticTable', () => {
  let wrapper

  const Wrapper = () => {
    return mount(StatisticTable, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class .statistic-table', () => {
      expect(wrapper.find('div.statistic-table').exists()).toBe(true)
    })

    describe('renders the table', () => {
      it('with three colunms', () => {
        expect(wrapper.findAll('thead > tr > th')).toHaveLength(3)
      })

      it('with seven rows', () => {
        expect(wrapper.findAll('tbody > tr')).toHaveLength(7)
      })
    })
  })
})
