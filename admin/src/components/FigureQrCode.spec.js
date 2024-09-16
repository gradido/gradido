import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import FigureQrCode from './FigureQrCode.vue'
import { QRCanvas } from 'qrcanvas-vue'

// Mock QRCanvas component
vi.mock('qrcanvas-vue', () => ({
  QRCanvas: {
    name: 'QRCanvas',
    template: '<div class="mock-qr-canvas"></div>',
  },
}))

describe('FigureQrCode', () => {
  let wrapper
  let mockImage

  beforeEach(() => {
    // Mock Image object
    mockImage = {
      src: '',
      onload: null,
    }
    global.Image = vi.fn(() => mockImage)

    wrapper = mount(FigureQrCode, {
      props: {
        link: 'https://example.com',
      },
      global: {
        stubs: {
          QRCanvas: true,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.figure-qr-code').exists()).toBe(true)
    expect(wrapper.find('.qrbox').exists()).toBe(true)
  })

  it('does not render QRCanvas initially', () => {
    expect(wrapper.find('.canvas').exists()).toBe(false)
  })

  it('renders QRCanvas after image loads', async () => {
    expect(wrapper.vm.showQr).toBe(false)
    mockImage.onload()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.showQr).toBe(true)
    expect(wrapper.findComponent(QRCanvas).exists()).toBe(true)
  })

  it('sets correct qrOptions', () => {
    expect(wrapper.vm.qrOptions).toEqual({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com',
      logo: { image: null },
    })
  })

  it('updates qrOptions when link prop changes', async () => {
    await wrapper.setProps({ link: 'https://newexample.com' })
    expect(wrapper.vm.qrOptions.data).toBe('https://newexample.com')
  })

  it('loads the correct image', () => {
    expect(mockImage.src).toBe('/img/gdd-coin.png')
  })
})
