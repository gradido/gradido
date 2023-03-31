import { mount } from '@vue/test-utils'
import FigureQrCode from './FigureQrCode'

const localVue = global.localVue

const propsData = {
  link: '',
}
const mocks = {
  $t: jest.fn((t) => t),
}

describe('FigureQrCode', () => {
  let wrapper

  const Wrapper = () => {
    return mount(FigureQrCode, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('has options filled', () => {
      expect(wrapper.vm.options).toEqual({
        cellSize: 8,
        correctLevel: 'H',
        data: '',
      })
    })

    it('renders the Div Element ".figure-qr-code"', () => {
      expect(wrapper.find('div.figure-qr-code').exists()).toBe(true)
    })

    it('renders the Div Element "qrbox"', () => {
      expect(wrapper.find('div.qrbox').exists()).toBe(true)
    })

    it('renders the Canvas Element "#qrcanvas"', () => {
      const canvas = wrapper.find('#qrcanvas')

      expect(canvas.exists()).toBe(true)
      const canvasEl = canvas.element
      const canvasWidth = canvasEl.width
      const canvasHeight = canvasEl.height

      expect(canvasWidth).toBeGreaterThan(0)
      expect(canvasHeight).toBeGreaterThan(0)

      const canvasContext = canvasEl.toDataURL('image/png')
      expect(canvasContext).not.toBeNull()
    })

    it('renders the A Element "#download"', () => {
      const downloadLink = wrapper.find('#download')
      expect(downloadLink.exists()).toBe(true)
    })

    describe('Download QR-Code link', () => {
      beforeEach(() => {
        const downloadLink = wrapper.find('#download')
        downloadLink.trigger('click')
      })

      it('click the A Element "#download" set an href', () => {
        expect(wrapper.find('#download').attributes('href')).toEqual('data:image/png;base64,00')
      })
    })
  })
})
