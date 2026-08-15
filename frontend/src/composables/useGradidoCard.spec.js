// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cardAddress, communityHost, useGradidoCard } from './useGradidoCard'

const mockDrawGradidoCard = vi.fn().mockResolvedValue('data:image/png;base64,card')
vi.mock('@/utils/gradidoCard', () => ({
  drawGradidoCard: (...args) => mockDrawGradidoCard(...args),
  cardFileName: (name) => `Gradido ${name}.png`,
}))

const mockQrCanvas = { width: 296 }
const mockRenderQrCodeCanvas = vi.fn().mockResolvedValue(mockQrCanvas)
vi.mock('@/utils/qrCode', () => ({
  renderQrCodeCanvas: (...args) => mockRenderQrCodeCanvas(...args),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: mockToastError }),
}))

const mockQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query: (...args) => mockQuery(...args) } }),
}))

const storeState = {
  firstName: 'Bernd',
  lastName: 'Hückstädt',
  username: 'bernd',
  gradidoID: 'uuid-1',
}
vi.mock('vuex', () => ({
  useStore: () => ({ state: storeState }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

vi.mock('@/config', () => ({
  default: { COMMUNITY_NAME: 'KI Playground', COMMUNITY_URL: 'https://ki-playground.gradido.net' },
}))

describe('communityHost', () => {
  it('prints the bare host, without scheme, port path or trailing slash', () => {
    expect(communityHost('https://ki-playground.gradido.net/')).toBe('ki-playground.gradido.net')
    expect(communityHost('http://localhost:3000/wallet')).toBe('localhost:3000')
  })

  it('survives a value that is not a URL at all', () => {
    expect(communityHost('ki-playground.gradido.net')).toBe('ki-playground.gradido.net')
    expect(communityHost('')).toBe('')
  })
})

describe('cardAddress', () => {
  // Printed without a scheme (E-008), carried in the QR with one -- without it many phone
  // cameras do not offer to open a link at all, and that is what frees the card from
  // waiting for a scanner of our own.
  it('prints without a scheme and links with one', () => {
    expect(cardAddress('bernd')).toEqual({
      host: 'ki-playground.gradido.net',
      link: 'https://ki-playground.gradido.net/u/bernd',
    })
  })
})

describe('useGradidoCard', () => {
  let anchor
  let createElement

  beforeEach(() => {
    vi.clearAllMocks()
    mockDrawGradidoCard.mockResolvedValue('data:image/png;base64,card')
    mockQuery.mockResolvedValue({ data: { avatarFull: 'BASE64PICTURE' } })
    anchor = { href: '', download: '', click: vi.fn() }
    const original = document.createElement.bind(document)
    createElement = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag) => (tag === 'a' ? anchor : original(tag)))
  })

  afterEach(() => {
    createElement.mockRestore()
  })

  it('hands the drawing everything the card shows', async () => {
    await useGradidoCard().drawCard()

    expect(mockRenderQrCodeCanvas).toHaveBeenCalledWith('https://ki-playground.gradido.net/u/bernd')
    expect(mockDrawGradidoCard).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bernd Hückstädt',
        communityName: 'KI Playground',
        alias: 'bernd',
        host: 'ki-playground.gradido.net',
        initials: 'BH',
        picture: 'data:image/jpeg;base64,BASE64PICTURE',
        qrCanvas: mockQrCanvas,
      }),
    )
  })

  it('draws without a picture when the member has none', async () => {
    mockQuery.mockResolvedValue({ data: { avatarFull: null } })

    await useGradidoCard().drawCard()

    expect(mockDrawGradidoCard).toHaveBeenCalledWith(expect.objectContaining({ picture: null }))
  })

  // A card without a picture is still a card, and the initials disc is a full-value stand-in.
  it('still draws a card when the picture cannot be fetched', async () => {
    mockQuery.mockRejectedValue(new Error('network'))

    await expect(useGradidoCard().drawCard()).resolves.toBe('data:image/png;base64,card')
    expect(mockDrawGradidoCard).toHaveBeenCalledWith(expect.objectContaining({ picture: null }))
  })

  it('falls back to the Gradido ID when there is no user name', async () => {
    storeState.username = ''
    try {
      await useGradidoCard().drawCard()
    } finally {
      storeState.username = 'bernd'
    }

    expect(mockDrawGradidoCard).toHaveBeenCalledWith(expect.objectContaining({ alias: 'uuid-1' }))
  })

  it('names the file after the member and returns what it handed over', async () => {
    const image = await useGradidoCard().downloadCard()

    expect(anchor.download).toBe('Gradido Bernd Hückstädt.png')
    expect(anchor.href).toBe('data:image/png;base64,card')
    expect(anchor.click).toHaveBeenCalled()
    expect(image).toBe('data:image/png;base64,card')
  })

  it('takes a picture that was drawn before instead of drawing again', async () => {
    await useGradidoCard().downloadCard('data:image/png;base64,drawn-earlier')

    expect(mockDrawGradidoCard).not.toHaveBeenCalled()
    expect(anchor.href).toBe('data:image/png;base64,drawn-earlier')
  })

  it('says so when a picture of the card cannot be loaded', async () => {
    mockDrawGradidoCard.mockRejectedValueOnce(
      new Error('cannot load image: /img/brand/gradido-logo.png'),
    )

    const image = await useGradidoCard().downloadCard()

    expect(mockToastError).toHaveBeenCalledWith('cannot load image: /img/brand/gradido-logo.png')
    expect(anchor.click).not.toHaveBeenCalled()
    expect(image).toBeNull()
  })
})
