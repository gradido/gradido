import { mount } from '@vue/test-utils'
import Status from './Status'

const localVue = global.localVue

describe('Status', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
  }

  const propsData = {
    balance: 1234,
    statusText: 'GDD',
  }

  const Wrapper = () => {
    return mount(Status, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    describe('balance is pending', () => {
      it('displays an animation icon test-pending-icon', () => {
        expect(wrapper.find('.test-pending-icon').exists()).toBe(true)
      })
    })

    describe('balance is loaded', () => {
      beforeEach(() => {
        wrapper.setProps({
          pending: false,
        })
      })

      it('does not display an animation icon test-pending-icon', () => {
        expect(wrapper.find('.test-pending-icon').exists()).toBe(false)
      })

      it('it displays the ammount of GDD', () => {
        expect(wrapper.find('div.gdd-status-div').text()).toEqual('1234 GDD')
      })
    })
  })
})
