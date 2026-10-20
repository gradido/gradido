import { mount } from '@vue/test-utils'
import { QRCanvas } from 'qrcanvas-vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FigureQrCode } from './FigureQrCode'

// Mock QRCanvas component
vi.mock('qrcanvas-vue', () => ({
  QRCanvas: {
    name: 'QRCanvas',
    props: { options: { type: Object } },
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
  })

  it('does not render QRCanvas initially', () => {
    expect(wrapper.findComponent(QRCanvas).exists()).toBe(false)
  })

  it('renders QRCanvas after image loads', async () => {
    mockImage.onload()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(QRCanvas).exists()).toBe(true)
  })

  it('hands the canvas the link, with the loaded coin as logo', async () => {
    mockImage.onload()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(QRCanvas).props('options')).toEqual({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com',
      logo: { image: mockImage },
    })
  })

  it('updates the options when link prop changes', async () => {
    mockImage.onload()
    await wrapper.setProps({ link: 'https://newexample.com' })
    expect(wrapper.findComponent(QRCanvas).props('options').data).toBe('https://newexample.com')
  })

  it('loads the correct image', () => {
    expect(mockImage.src).toBe('/img/gdd-coin.png')
  })
})
