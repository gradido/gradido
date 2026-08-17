// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGradidoCard } from './useGradidoCard'

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
  avatar: 'SMALLPICTURE',
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

// communityHost and the address builder moved to utils/gradidoAddress, where the cheque,
// the navigation bar and the send form reach them too; their tests moved with them. What
// stays here is that the card asks for the right one.

describe('useGradidoCard', () => {
  let anchor
  let createElement
  // Captured before the spy is installed. Re-binding document.createElement afterwards
  // would bind the spy itself, and the fallback would call into its own mock.
  let realCreateElement

  beforeEach(() => {
    vi.clearAllMocks()
    mockDrawGradidoCard.mockResolvedValue('data:image/png;base64,card')
    mockQuery.mockResolvedValue({ data: { avatarFull: 'BASE64PICTURE' } })
    anchor = { href: '', download: '', click: vi.fn() }
    realCreateElement = document.createElement.bind(document)
    createElement = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag) => (tag === 'a' ? anchor : realCreateElement(tag)))
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
    await useGradidoCard().downloadCard({ image: 'data:image/png;base64,drawn-earlier' })

    expect(mockDrawGradidoCard).not.toHaveBeenCalled()
    expect(anchor.href).toBe('data:image/png;base64,drawn-earlier')
  })

  // Ten cards on A4, printed through the browser -- that is why there is no PDF library
  // here: the browser writes PDFs already and is the only part that knows a millimetre.
  it('lays ten cards on one page and opens the print dialogue', async () => {
    const print = vi.fn()
    const frames = []
    createElement.mockImplementation((tag) => {
      const element = tag === 'a' ? anchor : realCreateElement(tag)
      if (tag === 'iframe') {
        frames.push(element)
        Object.defineProperty(element, 'contentWindow', {
          value: { print, focus: vi.fn(), addEventListener: vi.fn(), close: vi.fn() },
        })
      }
      return element
    })

    await useGradidoCard().printCardSheet()

    const doc = frames[0].contentDocument
    expect(doc.querySelectorAll('img')).toHaveLength(10)
    expect([...doc.querySelectorAll('img')].every((i) => i.src.includes('card'))).toBe(true)
    const style = doc.querySelector('style').textContent
    expect(style).toContain('85.6mm')
    // Without border-box the padding is added on top and the sheet becomes 248.8 x 324 mm,
    // so the right column and the bottom row are cut off on A4.
    expect(style).toContain('box-sizing: border-box')
    expect(print).toHaveBeenCalled()

    // The frame is removed on afterprint, which a stubbed listener never fires -- so the
    // test clears it up itself. Left attached, it breaks the environment teardown.
    frames.forEach((frame) => frame.remove())
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

  // Two draws, two pictures. The preview is on screen, where the card is about 24 rem wide
  // and the picture a tenth of that -- the everyday rendition is past what any screen shows,
  // and it is in the store already. Fetching the large one for it would put a query on every
  // visit to the settings page, because this section sits on the tab it opens with.
  describe('which picture is used', () => {
    it('takes the everyday picture for the preview, and asks the server for nothing', async () => {
      const { drawCard } = useGradidoCard()

      await drawCard({ preview: true })

      expect(mockQuery).not.toHaveBeenCalled()
      expect(mockDrawGradidoCard).toHaveBeenCalledWith(
        expect.objectContaining({ picture: 'data:image/jpeg;base64,SMALLPICTURE' }),
      )
    })

    it('fetches the large picture for what goes on paper', async () => {
      const { drawCard } = useGradidoCard()

      await drawCard()

      expect(mockQuery).toHaveBeenCalled()
      expect(mockDrawGradidoCard).toHaveBeenCalledWith(
        expect.objectContaining({ picture: 'data:image/jpeg;base64,BASE64PICTURE' }),
      )
    })

    it('draws the preview without a picture when there is none', async () => {
      storeState.avatar = null
      const { drawCard } = useGradidoCard()

      await drawCard({ preview: true })

      expect(mockDrawGradidoCard).toHaveBeenCalledWith(expect.objectContaining({ picture: null }))
      storeState.avatar = 'SMALLPICTURE'
    })
  })

  // The lines are typed for a print run and travel from the field to the card. Both ways to
  // a card carry them, or a member would download something other than what they saw.
  describe('the contact lines', () => {
    it('carries them into the card, under the heading', async () => {
      const { drawCard } = useGradidoCard()

      await drawCard({ contact: ['bernd@gradido.net'] })

      expect(mockDrawGradidoCard).toHaveBeenCalledWith(
        expect.objectContaining({
          contact: ['bernd@gradido.net'],
          contactHeading: 'gradido-card.contact',
        }),
      )
    })

    it('leaves the heading out when it is not wanted', async () => {
      const { drawCard } = useGradidoCard()

      await drawCard({ contact: ['bernd@gradido.net'], heading: false })

      expect(mockDrawGradidoCard).toHaveBeenCalledWith(
        expect.objectContaining({ contactHeading: '' }),
      )
    })

    it('carries the decision to the download and to the sheet', async () => {
      const { downloadCard, printCardSheet } = useGradidoCard()

      await downloadCard({ contact: ['a@b.de'], heading: false })
      await printCardSheet({ contact: ['a@b.de'], heading: false })

      for (const call of mockDrawGradidoCard.mock.calls) {
        expect(call[0].contactHeading).toBe('')
      }
    })

    it('carries them on the download', async () => {
      const { downloadCard } = useGradidoCard()

      await downloadCard({ contact: ['bernd@gradido.net'] })

      expect(mockDrawGradidoCard).toHaveBeenCalledWith(
        expect.objectContaining({ contact: ['bernd@gradido.net'] }),
      )
    })

    it('carries them onto the sheet', async () => {
      const { printCardSheet } = useGradidoCard()

      await printCardSheet({ contact: ['+49 7071 123456'] })

      expect(mockDrawGradidoCard).toHaveBeenCalledWith(
        expect.objectContaining({ contact: ['+49 7071 123456'] }),
      )
    })
  })
})
