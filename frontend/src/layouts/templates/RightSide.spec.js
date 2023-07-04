import { mount } from '@vue/test-utils'
import RightSide from './RightSide'

const localVue = global.localVue

describe('RightSide', () => {
  let wrapper

  const mocks = {
    $route: {
      path: '/community/contribute',
    },
  }

  const Wrapper = () => {
    return mount(RightSide, { localVue, mocks })
  }

  describe('at /community/contribute', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has name set to "community"', () => {
      expect(wrapper.vm.name).toBe('community')
    })
  })

  describe('at /settings', () => {
    beforeEach(() => {
      mocks.$route.path = '/settings'
      wrapper = Wrapper()
    })

    it('has name set to "empty"', () => {
      expect(wrapper.vm.name).toBe('empty')
    })
  })

  describe('at /overview', () => {
    beforeEach(() => {
      mocks.$route.path = '/overview'
      wrapper = Wrapper()
    })

    it('has name set to "transactions"', () => {
      expect(wrapper.vm.name).toBe('transactions')
    })
  })
})
