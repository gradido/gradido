import { mount } from '@vue/test-utils'
import FigureQrCode from './FigureQrCode'

const localVue = global.localVue

const propsData = {
  link: '',
}

describe('FigureQrCode', () => {
  let wrapper

  const Wrapper = () => {
    return mount(FigureQrCode, { localVue, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".figure-qr-code"', () => {
      expect(wrapper.find('div.figure-qr-code').exists()).toBe(true)
    })

    it('renders the QRCanvas Element ".canvas"', () => {
      expect(wrapper.find('.canvas').exists()).toBe(true)
    })
  })
})
