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
      expect(wrapper.find('div.figure-qr-code').exists()).toBeTruthy()
    })

    it('renders the Div Element "q-r-canvas"', () => {
      expect(wrapper.find('q-r-canvas'))
    })
  })
})
