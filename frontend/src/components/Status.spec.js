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
      it('it displays an en-dash', () => {
        expect(wrapper.find('div.gdd-status-div').text()).toEqual('em-dash GDD')
      })
    })

    describe('balance is loaded', () => {
      beforeEach(() => {
        wrapper.setProps({
          pending: false,
        })
      })

      it('it displays the ammount of GDD', () => {
        expect(wrapper.find('div.gdd-status-div').text()).toEqual('1234 GDD')
      })
    })
  })
})
