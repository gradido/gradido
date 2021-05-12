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

    describe('balance is loading', () => {
      it('it displays em-dash as the ammount of GDD', () => {
        expect(wrapper.findAll('div.card-body').at(0).text()).toEqual('— GDD')
      })

      it('it displays em-dash as the ammount of GDT', () => {
        expect(wrapper.findAll('div.card-body').at(1).text()).toEqual('— GDT')
      })
    })

    describe('balance is loaded', () => {
      beforeEach(() => {
        wrapper.setProps({
          pending: false,
        })
      })

      it('it displays the ammount of GDD', () => {
        expect(wrapper.findAll('div.card-body').at(0).text()).toEqual('1234 GDD')
      })

      it('it displays the ammount of GDT', () => {
        expect(wrapper.findAll('div.card-body').at(1).text()).toEqual('9876 GDT')
      })
    })
  })
})
