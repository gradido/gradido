// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import i18n from '@/i18n'
import { mailtoAddress, mailtoHref, useSendByEmail } from './useSendByEmail'

const sheet = vi.hoisted(() => ({ loadImage: vi.fn() }))
vi.mock('@/utils/thankYouGreetingSheet', () => ({
  loadImage: (...args) => sheet.loadImage(...args),
}))
// The browser's own clipboard, past the polyfill: nativeClipboard.spec.js holds how it is reached.
const browser = vi.hoisted(() => ({ takes: false, write: vi.fn() }))
vi.mock('@/utils/nativeClipboard', () => ({
  takesPictureInClipboard: () => browser.takes,
  writePictureToClipboard: (...args) => browser.write(...args),
}))
vi.mock('@/store/useWalletStore', () => ({
  useWalletStore: () => ({ username: 'Oma-Emma', gradidoID: 'uuid-emma' }),
}))

const TEXT = 'Ich habe einen Dank-Gruß für Dich:\nhttps://x.example/redeem/abc\nEr wartet.'

/** The composable in a component of its own, as a page has it. */
const use = (options) => {
  let result
  mount(
    {
      setup() {
        result = useSendByEmail(options)
        return () => null
      },
    },
    { global: { plugins: [i18n] } },
  )
  return result
}

describe('mailtoAddress', () => {
  it('leaves an address readable, the @ too', () => {
    expect(mailtoAddress('sarah@kongress-beispiel.de')).toBe('sarah@kongress-beispiel.de')
    expect(mailtoAddress('sarah+dank@example.org')).toBe('sarah+dank@example.org')
  })

  it('writes out what would end the address or the link early', () => {
    expect(mailtoAddress('a&b@example.org')).toBe('a%26b@example.org')
    expect(mailtoAddress('100%@example.org')).toBe('100%25@example.org')
    expect(mailtoAddress('a?b@example.org')).toBe('a%3Fb@example.org')
    expect(mailtoAddress('a#b@example.org')).toBe('a%23b@example.org')
    expect(mailtoAddress('"a b"@example.org')).toBe('"a%20b"@example.org')
  })
})

describe('mailtoHref', () => {
  it('has the address, the subject and the text, and nothing else', () => {
    const href = mailtoHref('sarah@example.org', 'Ein Dank', 'Hallo')
    expect(href).toBe('mailto:sarah@example.org?subject=Ein%20Dank&body=Hallo')
  })

  it('has no address where none is known', () => {
    expect(mailtoHref('', 'Ein Dank', 'Hallo')).toBe('mailto:?subject=Ein%20Dank&body=Hallo')
  })

  it('writes every line break as CRLF', () => {
    expect(mailtoHref('', 'S', 'eins\nzwei\ndrei')).toContain('body=eins%0D%0Azwei%0D%0Adrei')
  })

  // A message the member wrote may hold what ends a mailto link.
  it('keeps a text with & and # and ? in the body', () => {
    const href = mailtoHref('', 'A & B', 'C & D? #E')
    expect(new URL(href).searchParams.get('subject')).toBe('A & B')
    expect(new URL(href).searchParams.get('body')).toBe('C & D? #E')
  })
})

describe('useSendByEmail', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'de'
  })

  describe('the link', () => {
    it('names the member by their user name, in the subject of a greeting', () => {
      const { href } = use({ text: TEXT, greeting: { motif: 'bouquet' } })
      const url = new URL(href.value)
      expect(url.searchParams.get('subject')).toBe('Ein Dank-Gruß von Oma-Emma')
    })

    it('has its own subject for a plain link', () => {
      const { href } = use({ text: TEXT })
      expect(new URL(href.value).searchParams.get('subject')).toBe('Ein Dank von Oma-Emma')
    })

    it('carries the text it is given, and the address where one is known', () => {
      const { href } = use({ text: TEXT, address: 'sarah@example.org' })
      expect(href.value.startsWith('mailto:sarah@example.org?subject=')).toBe(true)
      expect(new URL(href.value).searchParams.get('body')).toBe(TEXT.replace(/\n/g, '\r\n'))
    })

    it('has neither cc nor bcc', () => {
      const { href } = use({ text: TEXT, address: 'sarah@example.org' })
      expect(href.value).not.toMatch(/[?&](cc|bcc)=/)
    })

    // Windows cuts a mailto link above about 2,000 characters or opens nothing, and in the text of a
    // plain link the link stands behind the message.
    describe('where the text would make it too long for a mail program', () => {
      const SHORT = 'Ein Dank\nhttps://x.example/redeem/abc'
      // Six characters to the letter, once encoded: a message of 340 letters.
      const LONG = `${'д'.repeat(340)}\nhttps://x.example/redeem/abc`

      it('goes with the short text', () => {
        const { href } = use({ text: LONG, shortText: SHORT })
        expect(new URL(href.value).searchParams.get('body')).toBe(SHORT.replace(/\n/g, '\r\n'))
        expect(href.value.length).toBeLessThanOrEqual(2000)
      })

      // The page quotes the whole text as what goes out, and the mail is the member's to read.
      it('says where the words are', () => {
        const { hint } = use({ text: LONG, shortText: SHORT })
        expect(hint.value).toBe(
          'Öffnet Dein E-Mail-Programm. Deine Nachricht ist zu lang für die Mail: Sie steht auf der Seite, die der Link öffnet.',
        )
      })

      it('goes with the whole text as long as that fits, and says nothing of it', () => {
        const { href, hint } = use({ text: TEXT, shortText: SHORT })
        expect(new URL(href.value).searchParams.get('body')).toBe(TEXT.replace(/\n/g, '\r\n'))
        expect(hint.value).toBe('Öffnet Dein E-Mail-Programm.')
      })

      it('goes with the whole text where there is no short one, and says nothing of it', () => {
        const { href, hint } = use({ text: LONG })
        expect(new URL(href.value).searchParams.get('body')).toBe(LONG.replace(/\n/g, '\r\n'))
        expect(hint.value).toBe('Öffnet Dein E-Mail-Programm.')
      })
    })

    // A link is written while its page is drawn: a throw here would leave a step without its page.
    it('survives half an emoji in the text, and keeps a whole one', () => {
      const { href } = use({ text: 'Danke \uD83D', greeting: { motif: 'bouquet' } })
      expect(new URL(href.value).searchParams.get('body')).toBe('Danke \uFFFD')
      expect(new URL(mailtoHref('', 'S \uDE00', 'Danke 😀')).searchParams.get('body')).toBe(
        'Danke 😀',
      )
      expect(new URL(mailtoHref('', 'S \uDE00', 'x')).searchParams.get('subject')).toBe('S \uFFFD')
    })
  })

  describe('in a browser that takes no picture', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      browser.takes = false
    })

    it('says it opens the mail program, and no word of a picture', () => {
      const { hint } = use({ text: TEXT, picture: '/img/motif.svg' })
      expect(hint.value).toBe('Öffnet Dein E-Mail-Programm.')
    })

    it('does nothing on the tap and throws nothing', () => {
      const { copyPicture, preparePicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      expect(() => preparePicture()).not.toThrow()
      expect(() => copyPicture()).not.toThrow()
      expect(sheet.loadImage).not.toHaveBeenCalled()
      expect(browser.write).not.toHaveBeenCalled()
    })
  })

  describe('in a browser that takes one', () => {
    const { write } = browser
    const PNG = new Blob(['png'], { type: 'image/png' })
    const context = { drawImage: vi.fn() }
    const written = () => write.mock.calls[0][0]

    beforeEach(() => {
      vi.clearAllMocks()
      browser.takes = true
      write.mockReset().mockResolvedValue(undefined)
      sheet.loadImage.mockResolvedValue({ picture: true })
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((done) => done(PNG))
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('says so beforehand, where a picture is at hand', () => {
      const { hint } = use({ text: TEXT, picture: '/img/motif.svg' })
      expect(hint.value).toBe(
        'Öffnet Dein E-Mail-Programm. Das Bild liegt dann in der Zwischenablage — füge es ein, wenn Du magst.',
      )
    })

    it('says nothing of a picture where none is at hand, and writes nothing', () => {
      const { hint, copyPicture } = use({ text: TEXT })
      copyPicture()
      expect(hint.value).toBe('Öffnet Dein E-Mail-Programm.')
      expect(write).not.toHaveBeenCalled()
    })

    it('follows a picture that comes later', () => {
      const source = ref(null)
      const { hint } = use({ text: TEXT, picture: () => source.value })
      expect(hint.value).toBe('Öffnet Dein E-Mail-Programm.')
      source.value = 'data:image/jpeg;base64,AAAA'
      expect(hint.value).toContain('Zwischenablage')
    })

    // The list of links: the small rendition of a photo may come after the row has been drawn.
    it('makes the picture of the source that stands at the tap', async () => {
      const source = ref('/img/first.svg')
      const { copyPicture } = use({ text: TEXT, picture: () => source.value })
      copyPicture()
      source.value = '/img/second.svg'
      copyPicture()
      await new Promise((resolve) => setTimeout(resolve))
      expect(sheet.loadImage.mock.calls.map(([from]) => from)).toEqual([
        '/img/first.svg',
        '/img/second.svg',
      ])
    })

    // ⛔ Within the tap: Safari refuses anything later, and the mail program opens in the same tap.
    it('writes within the tap, without waiting for anything', () => {
      const { copyPicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      copyPicture()
      expect(write).toHaveBeenCalledTimes(1)
    })

    it('hands on the picture itself once it is made ahead', async () => {
      const { copyPicture, preparePicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      preparePicture()
      await new Promise((resolve) => setTimeout(resolve))
      copyPicture()
      expect(written()).toBe(PNG)
    })

    it('hands on the promise where the picture is not made yet, and that gives the PNG', async () => {
      const { copyPicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      copyPicture()
      expect(written()).toBeInstanceOf(Promise)
      await expect(written()).resolves.toBe(PNG)
    })

    // A mail program pastes it pixel for pixel, and it stands that wide in the mail.
    it('draws the picture 600 by 417, from the source it was given', async () => {
      const { preparePicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      preparePicture()
      await new Promise((resolve) => setTimeout(resolve))
      expect(sheet.loadImage).toHaveBeenCalledWith('/img/motif.svg')
      expect(context.drawImage).toHaveBeenCalledWith({ picture: true }, 0, 0, 600, 417)
      expect(HTMLCanvasElement.prototype.toBlob.mock.calls[0][1]).toBe('image/png')
    })

    it('makes it once for two taps', async () => {
      const { copyPicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      copyPicture()
      copyPicture()
      await new Promise((resolve) => setTimeout(resolve))
      expect(sheet.loadImage).toHaveBeenCalledTimes(1)
    })

    // The promise is caught at the composable and at nothing else: a `then` in the test would catch
    // it as well, and this would hold nothing. Node's own event says whether anybody did.
    it('swallows a refusal of the browser: the mail opens all the same', async () => {
      const unhandled = vi.fn()
      process.on('unhandledRejection', unhandled)
      browser.write = () => Promise.reject(new DOMException('no', 'NotAllowedError'))
      try {
        const { copyPicture } = use({ text: TEXT, picture: '/img/motif.svg' })
        expect(() => copyPicture()).not.toThrow()
        await new Promise((resolve) => setTimeout(resolve))
        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        browser.write = write
        process.off('unhandledRejection', unhandled)
      }
    })

    // A line that was gone for a moment must not leave this without a picture for good.
    it('tries again on the next tap, where a picture could not be loaded', async () => {
      sheet.loadImage.mockRejectedValueOnce(new Error('cannot load image'))
      const { copyPicture, preparePicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      preparePicture()
      await new Promise((resolve) => setTimeout(resolve))

      copyPicture()

      await expect(written()).resolves.toBe(PNG)
      expect(sheet.loadImage).toHaveBeenCalledTimes(2)
    })

    it('swallows a browser that throws in the tap', () => {
      write.mockImplementation(() => {
        throw new TypeError('document not focused')
      })
      const { copyPicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      expect(() => copyPicture()).not.toThrow()
    })

    it('swallows a picture that cannot be loaded, ahead of the tap as well', async () => {
      sheet.loadImage.mockRejectedValue(new Error('cannot load image'))
      const { copyPicture, preparePicture } = use({ text: TEXT, picture: '/img/motif.svg' })
      preparePicture()
      await new Promise((resolve) => setTimeout(resolve))
      expect(() => copyPicture()).not.toThrow()
    })
  })
})
