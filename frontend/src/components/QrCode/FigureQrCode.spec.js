import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import FigureQrCode from './FigureQrCode'

vi.mock('qrcanvas-vue', () => ({
  QRCanvas: {
    template: '<canvas></canvas>',
    props: ['options'],
  },
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
  }),
}))

const mockDrawCheque = vi.fn().mockResolvedValue('data:image/png;base64,cheque')
vi.mock('@/utils/thankYouCheque', () => ({
  drawCheque: (...args) => mockDrawCheque(...args),
  chequeFileName: (occasion, amount) => `${amount} GDD - ${occasion}.png`,
}))

class MockImage {
  constructor() {
    this.src = ''
    this.onload = null
  }
}

global.Image = MockImage

const STORE = {
  state: { firstName: 'Bernd', lastName: 'Hückstädt', username: 'bernd', gradidoId: 'uuid-1' },
}

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
          $d: () => '26.08.2026',
          $store: STORE,
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

  describe('thank-you cheque download', () => {
    it('is hidden without the cheque prop', () => {
      expect(wrapper.find('.test-download-cheque').exists()).toBe(false)
    })

    describe('thank-you cheque', () => {
      beforeEach(async () => {
        wrapper = createWrapper({
          cheque: {
            kind: 'thankYou',
            amount: '20',
            memo: 'Gradido-Café Berlin',
            validUntil: '2026-08-26T00:00:00Z',
          },
        })
        await wrapper.find('.test-download-cheque').trigger('click')
      })

      it('shows the link', () => {
        expect(wrapper.find('.test-download-cheque').exists()).toBe(true)
      })

      it('passes sender name, gradido address and initials', () => {
        expect(mockDrawCheque).toHaveBeenCalledWith(
          expect.objectContaining({
            kind: 'thankYou',
            name: 'Bernd Hückstädt',
            initials: 'BH',
            memo: 'Gradido-Café Berlin',
          }),
        )
      })

      it('builds the headline from the sender and the amount', () => {
        expect(mockDrawCheque.mock.calls[0][0].headline).toContain('Bernd')
        expect(mockDrawCheque.mock.calls[0][0].headline).toContain('20')
      })
    })

    describe('starting credit', () => {
      beforeEach(async () => {
        wrapper = createWrapper({
          cheque: {
            kind: 'startingBonus',
            amount: '100',
            memo: 'Dein Startguthaben!',
            name: 'Startguthaben Postkarte',
            validFrom: '2026-08-12T00:00:00Z',
            validTo: '2030-12-31T00:00:00Z',
          },
        })
        await wrapper.find('.test-download-cheque').trigger('click')
      })

      it('uses the community instead of a person', () => {
        const data = mockDrawCheque.mock.calls[0][0]
        expect(data.kind).toBe('startingBonus')
        expect(data.community).toBeDefined()
        expect(data.name).toBeUndefined()
      })
    })

    describe('when a picture cannot be loaded', () => {
      beforeEach(async () => {
        mockDrawCheque.mockRejectedValueOnce(new Error('cannot load image'))
        wrapper = createWrapper({
          cheque: { kind: 'thankYou', amount: '20', memo: 'x', validUntil: '2026-08-26T00:00:00Z' },
        })
        await wrapper.find('.test-download-cheque').trigger('click')
      })

      it('does not fail silently', () => {
        expect(mockToastError).toHaveBeenCalledWith('cannot load image')
      })
    })
  })
})
