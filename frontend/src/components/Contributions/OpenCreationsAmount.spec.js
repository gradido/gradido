import { mount } from '@vue/test-utils'
import OpenCreationsAmount from './OpenCreationsAmount.vue'

const localVue = global.localVue

describe('OpenCreationsAmount', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $d: jest.fn((date, formatter = null) => {
      return { date, formatter }
    }),
  }

  const thisMonth = new Date()
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1)

  const propsData = {
    minimalDate: lastMonth,
    maxGddLastMonth: 400,
    maxGddThisMonth: 600,
  }

  const Wrapper = () => {
    return mount(OpenCreationsAmount, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.appBoxShadow').exists()).toBe(true)
    })

    it('renders two dates', () => {
      expect(mocks.$d).toBeCalledTimes(2)
    })

    it('renders the date of last month', () => {
      expect(mocks.$d).toBeCalledWith(lastMonth, 'monthAndYear')
    })

    it('renders the date of this month', () => {
      expect(mocks.$d).toBeCalledWith(expect.any(Date), 'monthAndYear')
    })

    describe('open creations for both months', () => {
      it('renders submitted contributions text', () => {
        expect(mocks.$t).toBeCalledWith('contribution.submit')
      })

      it('does not render max reached text', () => {
        expect(mocks.$t).not.toBeCalledWith('maxReached')
      })

      it('renders submitted hours last month', () => {
        expect(wrapper.findAll('div.row').at(1).findAll('div.col').at(2).text()).toBe('30 h')
      })

      it('renders available hours last month', () => {
        expect(wrapper.findAll('div.row').at(1).findAll('div.col').at(3).text()).toBe('20 h')
      })

      it('renders submitted hours this month', () => {
        expect(wrapper.findAll('div.row').at(2).findAll('div.col').at(2).text()).toBe('20 h')
      })

      it('renders available hours this month', () => {
        expect(wrapper.findAll('div.row').at(2).findAll('div.col').at(3).text()).toBe('30 h')
      })
    })

    describe('no creations available for last month', () => {
      beforeEach(() => {
        wrapper.setProps({ maxGddLastMonth: 0 })
      })

      it('renders submitted contributions text', () => {
        expect(mocks.$t).toBeCalledWith('contribution.submit')
      })

      it('renders max reached text', () => {
        expect(mocks.$t).toBeCalledWith('maxReached')
      })

      it('renders submitted hours last month', () => {
        expect(wrapper.findAll('div.row').at(1).findAll('div.col').at(2).text()).toBe('50 h')
      })

      it('renders available hours last month', () => {
        expect(wrapper.findAll('div.row').at(1).findAll('div.col').at(3).text()).toBe('0 h')
      })
    })
  })
})
