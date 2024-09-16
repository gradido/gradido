import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import FigureQrCode from './FigureQrCode'

vi.mock('qrcanvas-vue', () => ({
  QRCanvas: {
    template: '<canvas></canvas>',
    props: ['options'],
  },
}))

class MockImage {
  constructor() {
    this.src = ''
    this.onload = null
  }
}

global.Image = MockImage

describe('FigureQrCode', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(FigureQrCode, {
      props: {
        link: 'https://example.com',
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('has options filled', () => {
    expect(wrapper.vm.options).toEqual({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com',
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
  })

  it('renders the A Element "#download"', () => {
    const downloadLink = wrapper.find('#download')
    expect(downloadLink.exists()).toBe(true)
  })

  it('loads the logo image', async () => {
    const image = new Image()
    image.onload = async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.options.logo).toBeDefined()
      expect(wrapper.vm.options.logo.image).toBeInstanceOf(Image)
    }
  })

  describe('Download QR-Code link', () => {
    beforeEach(async () => {
      const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockedData')
      wrapper.vm.$refs.canvas.$el.toDataURL = mockToDataURL

      const downloadLink = wrapper.find('#download')
      await downloadLink.trigger('click')
    })

    it('click the A Element "#download" sets an href', () => {
      expect(wrapper.find('#download').attributes('href')).toEqual(
        'data:image/png;base64,mockedData',
      )
    })
  })
})
