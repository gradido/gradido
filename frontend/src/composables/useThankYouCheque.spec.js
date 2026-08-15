// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useThankYouCheque } from './useThankYouCheque'

const mockDrawCheque = vi.fn().mockResolvedValue('data:image/png;base64,cheque')
vi.mock('@/utils/thankYouCheque', () => ({
  drawCheque: (...args) => mockDrawCheque(...args),
  chequeFileName: (occasion, amount) => `${amount} GDD - ${occasion}.png`,
}))

const mockQrCanvas = { width: 360 }
const mockRenderQrCodeCanvas = vi.fn().mockResolvedValue(mockQrCanvas)
vi.mock('@/utils/qrCode', () => ({
  renderQrCodeCanvas: (...args) => mockRenderQrCodeCanvas(...args),
}))

// The address builder is no longer stubbed, only the community it reads. A stub can only
// confirm that the cheque calls something; the real builder confirms it gets the very host
// the card prints -- which is the whole point of them sharing one.
vi.mock('@/config', () => ({
  default: { COMMUNITY_URL: 'https://ki-playground.gradido.net' },
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: mockToastError }),
}))

const storeState = {
  firstName: 'Bernd',
  lastName: 'Hückstädt',
  username: 'bernd',
  gradidoID: 'uuid-1',
  avatar: null,
}
vi.mock('vuex', () => ({
  useStore: () => ({ state: storeState }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    d: () => '26.08.2026',
  }),
}))

const LINK = {
  link: 'https://example.com/redeem/abc',
  amount: '20',
  memo: 'Gradido-Café Berlin',
  validUntil: '2026-08-26T00:00:00Z',
}

describe('useThankYouCheque', () => {
  let anchor
  let createElement

  beforeEach(() => {
    vi.clearAllMocks()
    mockDrawCheque.mockResolvedValue('data:image/png;base64,cheque')
    anchor = { href: '', download: '', click: vi.fn() }
    const original = document.createElement.bind(document)
    createElement = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag) => (tag === 'a' ? anchor : original(tag)))
  })

  it('renders the code off screen and hands it to the drawing', async () => {
    await useThankYouCheque(LINK).drawThankYouCheque()

    expect(mockRenderQrCodeCanvas).toHaveBeenCalledWith('https://example.com/redeem/abc')
    expect(mockDrawCheque).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'thankYou',
        name: 'Bernd Hückstädt',
        initials: 'BH',
        memo: 'Gradido-Café Berlin',
        qrCanvas: mockQrCanvas,
      }),
    )
  })

  // The address on the cheque used to read "Community/undefined" for anybody without a user
  // name, because the store spells the field gradidoID and this read gradidoId. No test
  // covered the fallback, so nothing caught it -- and it was printed on paper.
  it('falls back to the Gradido ID when there is no user name', async () => {
    storeState.username = ''
    try {
      await useThankYouCheque(LINK).drawThankYouCheque()
    } finally {
      storeState.username = 'bernd'
    }

    const { alias } = mockDrawCheque.mock.calls[0][0]
    expect(alias).toBe('uuid-1')
  })

  // The everyday 128-pixel rendition, not the large one: the cheque draws it at 78 pixels,
  // and it is already in the store -- so a cheque costs no extra query.
  it('puts the picture on the cheque when the member has one', async () => {
    storeState.avatar = 'BASE64SMALL'
    try {
      await useThankYouCheque(LINK).drawThankYouCheque()
    } finally {
      storeState.avatar = null
    }

    const { portrait } = mockDrawCheque.mock.calls[0][0]
    expect(portrait).toBe('data:image/jpeg;base64,BASE64SMALL')
  })

  it('leaves the initials to stand in when there is no picture', async () => {
    await useThankYouCheque(LINK).drawThankYouCheque()

    const { portrait, initials } = mockDrawCheque.mock.calls[0][0]
    expect(portrait).toBeNull()
    expect(initials).toBe('BH')
  })

  // Card and cheque have to say the same thing about the same person, so both take the
  // address from one place.
  it('prints the same address the card prints', async () => {
    await useThankYouCheque(LINK).drawThankYouCheque()

    const { host, alias } = mockDrawCheque.mock.calls[0][0]
    expect(host).toBe('ki-playground.gradido.net')
    expect(alias).toBe('bernd')
  })

  it('builds the headline from the sender and the amount', async () => {
    await useThankYouCheque(LINK).drawThankYouCheque()

    const { headline } = mockDrawCheque.mock.calls[0][0]
    expect(headline).toContain('Bernd')
    expect(headline).toContain('20')
  })

  it('names the file after the memo and the amount', async () => {
    await useThankYouCheque(LINK).downloadThankYouCheque()

    expect(anchor.download).toBe('20 GDD - Gradido-Café Berlin.png')
    expect(anchor.href).toBe('data:image/png;base64,cheque')
    expect(anchor.click).toHaveBeenCalled()
  })

  // The result page has drawn the cheque already, because it shows it. Drawing it a second
  // time on the click would load the same three pictures again for the same result.
  it('takes a picture that was drawn before instead of drawing again', async () => {
    await useThankYouCheque(LINK).downloadThankYouCheque('data:image/png;base64,drawn-earlier')

    expect(mockDrawCheque).not.toHaveBeenCalled()
    expect(anchor.href).toBe('data:image/png;base64,drawn-earlier')
    expect(anchor.click).toHaveBeenCalled()
  })

  it('says so when a picture of the cheque cannot be loaded', async () => {
    mockDrawCheque.mockRejectedValueOnce(new Error('cannot load image: /img/template/Blaetter.png'))

    await useThankYouCheque(LINK).downloadThankYouCheque()

    expect(mockToastError).toHaveBeenCalledWith('cannot load image: /img/template/Blaetter.png')
    expect(anchor.click).not.toHaveBeenCalled()
  })

  afterEach(() => {
    createElement.mockRestore()
  })
})
