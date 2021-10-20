import { mount } from '@vue/test-utils'
import GddStatus from './GddGdtStatus'

const localVue = global.localVue

describe('GddStatus', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
  }

  const propsData = {
    balance: 1234,
    statusText: 'GDD',
  }

  const Wrapper = () => {
    return mount(GddStatus, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
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
