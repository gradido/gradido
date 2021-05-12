import { shallowMount } from '@vue/test-utils'
import AccountOverview from './AccountOverview'

const localVue = global.localVue

describe('AccountOverview', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return shallowMount(AccountOverview, { localVue, mocks })
  }

  describe('shallow Mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a header', () => {
      expect(wrapper.find('base-header-stub').exists()).toBeTruthy()
    })

    it('has a status line', () => {
      expect(wrapper.find('gdd-status-stub').exists()).toBeTruthy()
    })

    it('has a send field', () => {
      expect(wrapper.find('gdd-send-stub').exists()).toBeTruthy()
    })

    it('has a transactions table', () => {
      expect(wrapper.find('gdd-table-stub').exists()).toBeTruthy()
    })
  })
})
