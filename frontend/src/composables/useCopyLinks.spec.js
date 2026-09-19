// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import i18n from '@/i18n'
import { useCopyLinks } from './useCopyLinks'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}))

vi.mock('vuex', () => ({
  useStore: () => ({ state: { username: 'bernd', gradidoID: 'uuid-1' } }),
}))

const LINK = 'https://gdd.gradido.net/redeem/7f3a9c1e84b2'
const PROPS = {
  link: LINK,
  amount: '37',
  memo: 'Für Deine Hilfe am Samstag',
  // Noon, so no time zone the tests may run in moves it to another day.
  validUntil: '2026-10-01T12:00:00Z',
}

// The real instance with the real language files: the text this sends is the product, so it
// is read here as a member would get it, not as keys a stub hands back.
const withLinks = (locale = 'de') => {
  i18n.global.locale.value = locale
  let links
  mount(
    {
      setup() {
        links = useCopyLinks(PROPS)
        return () => null
      },
    },
    { global: { plugins: [i18n] } },
  )
  return links
}

const occurrences = (text, part) => text.split(part).length - 1

const writeText = vi.fn()
const share = vi.fn()

describe('useCopyLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeText.mockResolvedValue(undefined)
    share.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
  })

  afterEach(() => {
    delete window.navigator.clipboard
    delete window.navigator.share
  })

  describe('the text', () => {
    it('speaks to the person the link is for, in four lines and the link after the question', () => {
      expect(withLinks().linkText.value).toBe(
        [
          'bernd dankt Dir mit 37 Gradido:',
          '„Für Deine Hilfe am Samstag“',
          'Magst Du den Dank annehmen?',
          LINK,
          'Er wartet bis zum 1.10.2026 auf Dich. Nimmst Du ihn nicht an, passiert nichts.',
        ].join('\n'),
      )
    })

    // The warning belongs to the sender. In the text it told the person being thanked that
    // anyone could take what was meant for them -- the sentence people warn their friends of.
    it('leaves the warning for the sender out', () => {
      const text = withLinks().linkText.value
      expect(text).not.toContain(i18n.global.t('gdd_per_link.link-hint', {}, { locale: 'de' }))
      expect(text).not.toContain('einlösen')
      expect(text).not.toContain('Achtung')
    })

    it.each(['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr', 'el'])(
      'in %s it names sender, amount and memo, and carries the link exactly once',
      (locale) => {
        const text = withLinks(locale).linkText.value
        expect(text).toContain('bernd')
        expect(text).toContain('37 Gradido')
        expect(text).toContain(PROPS.memo)
        expect(occurrences(text, LINK)).toBe(1)
        // a placeholder a translation spelled differently would stand here unreplaced
        expect(text).not.toMatch(/[{}]/)
      },
    )
  })

  describe('share', () => {
    it("hands the text to the device's share sheet, with the link in it once", async () => {
      const { share: shareLink, linkText } = withLinks()
      await shareLink()

      expect(share).toHaveBeenCalledTimes(1)
      const [data] = share.mock.calls[0]
      expect(data.text).toBe(linkText.value)
      // ⛔ No `url` beside it: Chrome on Android appends the url to the text, and the message
      // would carry the link twice. Counted over everything handed over, whatever the field.
      expect(occurrences(Object.values(data).join('\n'), LINK)).toBe(1)
      expect(writeText).not.toHaveBeenCalled()
    })

    it('copies the same text where the device has no share sheet', async () => {
      delete window.navigator.share
      const { share: shareLink, linkText } = withLinks()
      await shareLink()

      expect(writeText).toHaveBeenCalledWith(linkText.value)
      expect(mockToastSuccess).toHaveBeenCalledWith(
        i18n.global.t('gdd_per_link.link-and-text-copied', {}, { locale: 'de' }),
      )
    })

    it('stays silent when the member closes the sheet', async () => {
      share.mockRejectedValue(new DOMException('Share canceled', 'AbortError'))
      await withLinks().share()

      expect(writeText).not.toHaveBeenCalled()
      expect(mockToastSuccess).not.toHaveBeenCalled()
      expect(mockToastError).not.toHaveBeenCalled()
    })

    it('copies the text when the sheet refuses for any other reason', async () => {
      share.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'))
      const { share: shareLink, linkText } = withLinks()
      await shareLink()

      expect(writeText).toHaveBeenCalledWith(linkText.value)
      expect(mockToastSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('copying', () => {
    it('copies the link alone', async () => {
      await withLinks().copyLink()

      expect(writeText).toHaveBeenCalledWith(LINK)
      expect(mockToastSuccess).toHaveBeenCalledWith(
        i18n.global.t('gdd_per_link.link-copied', {}, { locale: 'de' }),
      )
    })

    // Without TLS, and in some in-app browsers, there is no clipboard at all: the call throws
    // before there is a promise to reject. Both ways end in the same honest message.
    it.each([
      ['is missing entirely', () => delete window.navigator.clipboard],
      ['rejects', () => writeText.mockRejectedValue(new Error('denied'))],
    ])('says it could not copy when the clipboard %s', async (_name, sabotage) => {
      sabotage()
      const links = withLinks()
      await links.copyLinkWithText()
      await flushPromises()

      expect(mockToastSuccess).not.toHaveBeenCalled()
      expect(mockToastError).toHaveBeenCalledWith(
        i18n.global.t('gdd_per_link.not-copied', {}, { locale: 'de' }),
      )
      expect(links.canCopyLink.value).toBe(false)
    })
  })
})
