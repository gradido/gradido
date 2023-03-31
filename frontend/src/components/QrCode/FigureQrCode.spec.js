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

      // console.log(canvas.html())
      expect(canvas.exists()).toBe(true)

      // Hier können Sie weitere Tests für das Canvas-Element durchführen
      // z.B. überprüfen Sie die Breite und Höhe des Canvas-Elements oder den Canvas-Kontext

      const canvasEl = canvas.element
      const canvasWidth = canvasEl.width
      const canvasHeight = canvasEl.height

      expect(canvasWidth).toBeGreaterThan(0)
      expect(canvasHeight).toBeGreaterThan(0)

      const canvasContext = canvasEl.getContext('2d')
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
        // await wrapper.vm.$nextTick()
      })

      it('click the A Element "#download" set an href', () => {
        // expect(toDataURLStub).toHaveBeenCalledWith('image/png')
        expect(wrapper.find('#download').attributes('href')).toEqual('')
      })
    })
  })
})
