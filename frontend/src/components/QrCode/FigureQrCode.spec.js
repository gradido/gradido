import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import FigureQrCode from './FigureQrCode'

vi.mock('qrcanvas-vue', () => ({
  QRCanvas: {
    template: '<canvas></canvas>',
    props: ['options'],
  },
}))

describe('FigureQrCode', () => {
  let wrapper
  let mockImage

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
    mockImage = { src: '', onload: null }
    global.Image = vi.fn(() => mockImage)
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // The same settings are asserted in admin/src/utils/qrCode.spec.js. Together they are
  // what keeps the code on screen and the code on a printed cheque the same code.
  it('has options filled', () => {
    expect(wrapper.vm.options).toEqual({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com',
      logo: { image: null },
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

  it('takes the coin from the root of the site and puts it into the code', async () => {
    expect(mockImage.src).toBe('/img/gdd-coin.png')

    mockImage.onload()
    await wrapper.vm.$nextTick()

    // toStrictEqual, not toBe: the component keeps the image in data(), so what comes back
    // out is Vue's reactive proxy of it, not the object itself.
    expect(wrapper.vm.options.logo.image).toStrictEqual(mockImage)
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

  // The cheque is no longer offered here. It has moved to the menu of a link and to the
  // page after a link was created, where it is reached without opening the QR window.
  it('does not offer the cheque any more', () => {
    expect(wrapper.find('.test-download-cheque').exists()).toBe(false)
  })
})
