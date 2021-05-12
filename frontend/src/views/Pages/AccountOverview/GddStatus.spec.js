import { mount } from '@vue/test-utils'
import GddStatus from './GddStatus'

const localVue = global.localVue

describe('GddStatus', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
  }

  const propsData = {
    balance: 1234,
    GdtBalance: 9876,
  }

  const Wrapper = () => {
    return mount(GddStatus, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('it displays the ammount of GDD', () => {
      expect(wrapper.findAll('div.card-body b').at(0).text()).toEqual('1234')
    })

    describe('balance is loaded', () => {
      beforeEach(() => {
        wrapper.setProps({
          pending: false,
        })
      })

      it('it displays the ammount of GDD', () => {
        expect(wrapper.findAll('div.card-body b').at(0).text()).toEqual('1234')
      })

      it('it displays the ammount of GDT', () => {
        expect(wrapper.findAll('div.card-body').at(1).text()).toEqual('9876 GDT')
      })
    })
  })
})
