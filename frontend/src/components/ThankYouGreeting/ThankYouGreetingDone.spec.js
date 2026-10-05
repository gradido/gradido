// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import ThankYouGreetingDone from './ThankYouGreetingDone.vue'

// On paper: the composable is the real one. What it hands on is caught where it leaves the
// wallet -- at the drawer and its print frame, and at the device.
const SHEET = 'data:image/png;base64,c2hlZXQ='
const paper = vi.hoisted(() => ({ draw: null, print: null, save: null }))
vi.mock('@/utils/thankYouGreetingSheet', async (importOriginal) => ({
  ...(await importOriginal()),
  drawThankYouGreetingSheet: (...args) => paper.draw(...args),
  printThankYouGreetingSheet: (...args) => paper.print(...args),
}))
vi.mock('@/utils/chatImageSave', () => ({
  saveChatImageFile: (...args) => paper.save(...args),
}))

const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toast }))
vi.mock('vuex', () => ({
  useStore: () => ({ state: { username: 'Oma-Emma', gradidoID: 'uuid-emma' } }),
}))

const LINK = 'https://ki-playground.gradido.net/redeem/a3f9c2d41b7e19981fa0c4e2'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.'

// The server's answer to createTransactionLink. Noon, so no time zone moves the day.
const created = (greeting = {}) => ({
  link: LINK,
  amount: '20',
  memo: `Einfach so — weil es Dich gibt.\n${WORDS}`,
  validUntil: '2026-10-16T12:00:00.000Z',
  greeting: {
    motif: 'morning-light',
    line: 'Einfach so — weil es Dich gibt.',
    recipientName: 'Sarah',
    ...greeting,
  },
})

const done = (answer = created()) =>
  mount(ThankYouGreetingDone, { props: { created: answer }, global: { plugins: [i18n] } })

const data = (wrapper, name) => wrapper.find(`[data-test="thank-you-greeting-${name}"]`)

const share = vi.fn()
const writeText = vi.fn()

describe('ThankYouGreetingDone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
    paper.draw = vi.fn(async () => SHEET)
    paper.print = vi.fn(async () => {})
    paper.save = vi.fn(async () => 'downloaded')
    share.mockResolvedValue(undefined)
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true })
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    delete window.navigator.share
    delete window.navigator.clipboard
  })

  it('says the greeting is ready, for whom, and until when it waits', () => {
    const wrapper = done()

    expect(data(wrapper, 'done-title').text()).toBe('Dein Dank-Gruß für Sarah ist fertig.')
    expect(data(wrapper, 'done-waits').text()).toBe('Er wartet bis zum 16.10.2026.')
  })

  it('says it without a name where the greeting names nobody', () => {
    for (const recipientName of [null, '']) {
      const wrapper = done(created({ recipientName }))

      expect(data(wrapper, 'done-title').text()).toBe('Dein Dank-Gruß ist fertig.')
    }
  })

  it('shows the motif small, under its name', () => {
    const motif = data(done(), 'done-motif')

    expect(motif.element.tagName).toBe('IMG')
    expect(motif.attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
    expect(motif.attributes('alt')).toBe('Morgenlicht')
  })

  it('shows no picture for a motif this wallet does not know', () => {
    expect(data(done(created({ motif: 'sunset' })), 'done-motif').exists()).toBe(false)
  })

  /**
   * A greeting with a photo of the member's own: the server says THAT there is one, and the
   * picture is the one the page made a moment ago -- nobody is asked for it.
   */
  describe('a photo of one’s own', () => {
    const PREVIEW = 'data:image/jpeg;base64,PREVIEW'
    const withPhoto = (extra = { picture: PREVIEW }) =>
      done({ ...created({ motif: null, hasPicture: true }), ...extra })

    it('stands small where the motif would stand, with whose it is', () => {
      const wrapper = withPhoto()
      const photo = data(wrapper, 'done-photo')

      expect(photo.element.tagName).toBe('IMG')
      expect(photo.attributes('src')).toBe(PREVIEW)
      // the member's own user name, as the card shows it
      expect(photo.attributes('alt')).toBe('Foto von Oma-Emma')
      expect(photo.classes()).toContain('tyg-done-motif')
      expect(photo.attributes('width')).toBe('360')
      expect(photo.attributes('height')).toBe('250')
      expect(data(wrapper, 'done-motif').exists()).toBe(false)
      expect(wrapper.findAll('img')).toHaveLength(1)
    })

    it('makes the sentence about the link name the photo', () => {
      expect(data(withPhoto(), 'link-hint').text()).toBe(
        'Wer den Link hat, sieht Dein Foto und kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
      )
    })

    // The sentence follows what the server says of the greeting, not what the page holds.
    it('names the photo even where the page holds no picture, and shows none then', () => {
      const wrapper = withPhoto({})

      expect(wrapper.find('img').exists()).toBe(false)
      expect(data(wrapper, 'link-hint').text()).toContain('sieht Dein Foto')
    })

    it('keeps the sentence of a motif for a greeting with a motif, whatever the page holds', () => {
      const wrapper = done({ ...created({ hasPicture: false }), picture: PREVIEW })

      expect(data(wrapper, 'done-photo').exists()).toBe(false)
      expect(data(wrapper, 'done-motif').exists()).toBe(true)
      expect(data(wrapper, 'link-hint').text()).toBe(
        'Wer den Link hat, kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
      )
    })

    // The sentence that goes out with the link says nothing of a photo: it stands on the card.
    it('leaves the sentence that goes out as it is', () => {
      expect(data(withPhoto(), 'share-text').text()).toBe(data(done(), 'share-text').text())
    })
  })

  // ZE-017, F3: in the first person, without the sender's words and without the amount.
  describe('the sentence that goes out', () => {
    const SENTENCE = [
      'Sarah, ich habe einen Dank-Gruß für Dich:',
      LINK,
      'Er wartet bis zum 16.10.2026 auf Dich. Nimmst Du ihn nicht an, passiert nichts.',
    ].join('\n')

    it('stands there word for word, with the link on a line of its own', () => {
      const wrapper = done()

      expect(wrapper.text()).toContain('Dieser Satz geht mit auf die Reise:')
      expect(data(wrapper, 'share-text').element.textContent.trim()).toBe(SENTENCE)
    })

    it('carries neither the sender’s words nor the line nor the amount', () => {
      const text = data(done(created({ amount: '37.5' })), 'share-text').text()

      expect(text).not.toContain(WORDS)
      expect(text).not.toContain('weil es Dich gibt')
      expect(text).not.toMatch(/37|Gradido|GDD/)
      expect(text).not.toContain('Oma-Emma')
    })

    it('begins without a name where the greeting has none', () => {
      const text = data(done(created({ recipientName: null })), 'share-text').element.textContent

      expect(text.trim().split('\n')[0]).toBe('Ich habe einen Dank-Gruß für Dich:')
    })

    it('is what "Teilen" hands to the device, with the link in it once', async () => {
      const wrapper = done()
      await data(wrapper, 'share').trigger('click')
      await flushPromises()

      expect(share).toHaveBeenCalledTimes(1)
      expect(share).toHaveBeenCalledWith({ text: SENTENCE })
    })

    // The message after copying does not speak of "your message": that one does not travel.
    it('is copied where the device has no share sheet, with a message of its own', async () => {
      share.mockRejectedValue(new Error('no share sheet'))
      const wrapper = done()
      await data(wrapper, 'share').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(SENTENCE)
      expect(toast.toastSuccess).toHaveBeenCalledWith(
        'Der Satz und der Link wurden in die Zwischenablage kopiert. Du kannst sie jetzt in eine E-Mail oder Nachricht einfügen.',
      )
      expect(toast.toastSuccess.mock.calls[0][0]).not.toContain('Deine Nachricht')
    })
  })

  it('copies the link alone with "Link kopieren"', async () => {
    const wrapper = done()
    expect(data(wrapper, 'copy').text()).toBe('Link kopieren')

    await data(wrapper, 'copy').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(LINK)
  })

  it('says how to treat the link and where to find the greeting again', () => {
    const wrapper = done()

    expect(wrapper.text()).toContain(
      'Den Satz kannst Du vor dem Senden ändern. Deine Worte stehen erst auf der Karte.',
    )
    expect(data(wrapper, 'link-hint').text()).toBe(
      'Wer den Link hat, kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
    )
    // The two names are the ones the menu and the list carry.
    expect(data(wrapper, 'find-again').text()).toBe(
      'Du findest ihn wieder unter Transaktionen, bei „Links, Schecks, QR-Codes, Grüße“.',
    )
  })

  // The two ways the link travels, since slice 6 the two ways onto paper, and since slice 8 the
  // way to one more greeting. A greeting is never "sent" from here (ZE-016).
  it('offers sharing and copying, printing and saving as a picture, one more greeting, and nothing else', () => {
    expect(
      done()
        .findAll('button')
        .map((button) => button.text()),
    ).toEqual([
      'Teilen',
      'Link kopieren',
      'Karte drucken',
      'Karte als Bild sichern',
      'Noch einen für jemand anderen',
    ])
  })

  /**
   * "Noch einen für jemand anderen" (ZE-030): one more greeting of the same, for the next person.
   * The button asks the page for it and does nothing else -- the page begins the new greeting.
   */
  describe('one more for somebody else', () => {
    it('stands under everything, after the two hints', () => {
      const wrapper = done()
      const names = wrapper
        .findAll('[data-test]')
        .map((element) => element.attributes('data-test').replace('thank-you-greeting-', ''))

      expect(names.slice(-3)).toEqual(['link-hint', 'find-again', 'another'])
      expect(wrapper.find('.tyg-done-card [data-test="thank-you-greeting-another"]').exists()).toBe(
        false,
      )
    })

    // Outlined as "Karte drucken" is, but as wide as its words: it is no third way of the card.
    it('is outlined as "Karte drucken" is, and as wide as its words', () => {
      const wrapper = done()
      const button = data(wrapper, 'another')

      expect(button.classes()).toContain('btn-outline-secondary')
      expect(data(wrapper, 'print').classes()).toContain('btn-outline-secondary')
      expect(button.classes()).not.toContain('tyg-done-button')
    })

    it('is a button the keyboard reaches', () => {
      const button = data(done(), 'another')

      expect(button.element.tagName).toBe('BUTTON')
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('tabindex')).toBeUndefined()
      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('asks the page for another greeting, once a tap, and does nothing itself', async () => {
      const wrapper = done()

      await data(wrapper, 'another').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('another')).toHaveLength(1)
      expect(wrapper.emitted('another')[0]).toEqual([])
      expect(share).not.toHaveBeenCalled()
      expect(writeText).not.toHaveBeenCalled()
      expect(paper.draw).not.toHaveBeenCalled()
    })

    it('is there for a greeting with a photo and for one that names nobody', () => {
      for (const wrapper of [
        done({
          ...created({ motif: null, hasPicture: true }),
          picture: 'data:image/jpeg;base64,P',
        }),
        done(created({ recipientName: null })),
      ]) {
        expect(data(wrapper, 'another').text()).toBe('Noch einen für jemand anderen')
      }
    })
  })

  // The wallet knows no gender: the name stands there, or the sentence does without.
  it('has no pronoun for the receiver', () => {
    for (const wrapper of [done(), done(created({ recipientName: null }))]) {
      expect(data(wrapper, 'done-waits').text()).toBe('Er wartet bis zum 16.10.2026.')
      expect(wrapper.text()).not.toMatch(/auf (sie|ihn)\b/)
    }
  })

  /**
   * The greeting on paper (ZE-017, F8): a group of its own under the two ways the link travels
   * -- "Karte drucken" in the form of "Link kopieren", the quiet line "Karte als Bild sichern",
   * and the sentence that says what becomes of the sheet.
   */
  describe('on paper', () => {
    /** A promise a test settles when it wants. */
    const deferred = () => {
      const settle = {}
      const promise = new Promise((resolve) => Object.assign(settle, { resolve }))
      return { promise, ...settle }
    }
    const drawn = () => paper.draw.mock.calls[paper.draw.mock.calls.length - 1][0]

    it('stands in the card, under "Teilen" and "Link kopieren", in this order', () => {
      const wrapper = done()
      const card = wrapper.find('.tyg-done-card')

      expect(
        card
          .findAll('[data-test]')
          .map((element) => element.attributes('data-test').replace('thank-you-greeting-', '')),
      ).toEqual(['share', 'copy', 'paper-title', 'print', 'save', 'paper-hint'])
      expect(data(wrapper, 'paper-title').text()).toBe('Oder auf Papier')
      expect(data(wrapper, 'print').text()).toBe('Karte drucken')
      expect(data(wrapper, 'save').text()).toBe('Karte als Bild sichern')
      expect(data(wrapper, 'paper-hint').text()).toBe(
        'Ein A4-Blatt, einseitig bedruckt. Falte es zweimal, die bedruckte Seite nach außen: Dein Bild liegt dann vorn, Deine Worte stehen innen, und daneben ist Platz für Deine Handschrift.',
      )
    })

    it('has "Karte drucken" in the form of "Link kopieren", and the picture as a line of text', () => {
      const wrapper = done()

      expect(data(wrapper, 'print').classes()).toEqual(data(wrapper, 'copy').classes())
      expect(data(wrapper, 'save').classes()).toContain('btn-link')
    })

    // Both are buttons the keyboard reaches, and both say what they do; the group has a name.
    it('is two buttons in a group that is named by its word', () => {
      const wrapper = done()

      for (const name of ['print', 'save']) {
        const button = data(wrapper, name)
        expect(button.element.tagName).toBe('BUTTON')
        expect(button.attributes('type')).toBe('button')
        expect(button.attributes('tabindex')).toBeUndefined()
        expect(button.text().length).toBeGreaterThan(5)
      }
      const group = wrapper.find('[role="group"]')
      expect(group.find('[data-test="thank-you-greeting-print"]').exists()).toBe(true)
      expect(wrapper.find(`#${group.attributes('aria-labelledby')}`).text()).toBe('Oder auf Papier')
    })

    it('prints the sheet of this greeting', async () => {
      const wrapper = done()

      await data(wrapper, 'print').trigger('click')
      await flushPromises()

      expect(paper.draw).toHaveBeenCalledTimes(1)
      expect(drawn()).toMatchObject({
        link: LINK,
        picture: '/img/thank-you-greeting/morning-light.svg',
        line: 'Einfach so — weil es Dich gibt.',
        words: WORDS,
        forWhom: 'FÜR SARAH',
        from: 'Oma-Emma sagt\u00a0Dir\u00a0Danke',
        // amount and unit joined by a no-break space: no line of the sheet parts them
        waits: 'Dein Dank wartet: 20\u00a0Gradido',
        scan: 'Halte die Kamera Deines Handys auf den Code und nimm ihn an — bis zum 16.10.2026.',
        slogan: 'Helfen. Schenken. Danken.',
      })
      expect(paper.print).toHaveBeenCalledWith(SHEET)
      expect(paper.save).not.toHaveBeenCalled()
      expect(toast.toastError).not.toHaveBeenCalled()
    })

    it('saves the same sheet as a picture, named by the greeting', async () => {
      const wrapper = done()

      await data(wrapper, 'save').trigger('click')
      await flushPromises()

      expect(paper.draw).toHaveBeenCalledTimes(1)
      expect(paper.print).not.toHaveBeenCalled()
      const [[file]] = paper.save.mock.calls
      expect(file.name).toBe('Dank-Gruß für Sarah.png')
      expect(file.type).toBe('image/png')
    })

    // The page holds the photo it made: the server is not asked for it.
    it('draws a photo of the member’s own from the picture the page made', async () => {
      const fetching = vi.fn()
      vi.stubGlobal('fetch', fetching)
      const PREVIEW = 'data:image/jpeg;base64,PREVIEW'
      const wrapper = done({ ...created({ motif: null, hasPicture: true }), picture: PREVIEW })

      await data(wrapper, 'print').trigger('click')
      await flushPromises()

      expect(drawn().picture).toBe(PREVIEW)
      expect(fetching).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })

    /**
     * The share sheet opens only right after a tap, and the sheet had to be drawn first. Where it
     * asks for a tap of its own, the line offers that tap in the chat's words and hands the same
     * file over -- nothing is drawn a second time.
     */
    it('offers "Jetzt sichern" where the share sheet wants a tap of its own, and hands the same file over', async () => {
      paper.save = vi.fn().mockResolvedValueOnce('again').mockResolvedValueOnce('shared')
      const wrapper = done()

      await data(wrapper, 'save').trigger('click')
      await flushPromises()
      expect(data(wrapper, 'save').text()).toBe('Jetzt sichern')
      expect(toast.toastError).not.toHaveBeenCalled()

      await data(wrapper, 'save').trigger('click')
      await flushPromises()
      expect(paper.draw).toHaveBeenCalledTimes(1)
      expect(paper.save).toHaveBeenCalledTimes(2)
      expect(paper.save.mock.calls[1][0]).toBe(paper.save.mock.calls[0][0])
      expect(data(wrapper, 'save').text()).toBe('Karte als Bild sichern')
    })

    it('says nothing where the member closes the share sheet', async () => {
      paper.save = vi.fn(async () => 'cancelled')
      const wrapper = done()

      await data(wrapper, 'save').trigger('click')
      await flushPromises()

      expect(toast.toastError).not.toHaveBeenCalled()
      expect(data(wrapper, 'save').text()).toBe('Karte als Bild sichern')
    })

    it('makes one sheet of a double tap, and of a tap on each of the two', async () => {
      const drawing = deferred()
      paper.draw = vi.fn(() => drawing.promise)
      const wrapper = done()

      await data(wrapper, 'print').trigger('click')
      await data(wrapper, 'print').trigger('click')
      await data(wrapper, 'save').trigger('click')
      // Neither is taken away meanwhile: the keyboard keeps its place.
      expect(data(wrapper, 'print').attributes('disabled')).toBeUndefined()
      expect(data(wrapper, 'save').attributes('disabled')).toBeUndefined()
      drawing.resolve(SHEET)
      await flushPromises()

      expect(paper.draw).toHaveBeenCalledTimes(1)
      expect(paper.print).toHaveBeenCalledTimes(1)
      expect(paper.save).not.toHaveBeenCalled()
    })

    it('says one sentence where the sheet cannot be made', async () => {
      paper.draw = vi.fn(async () => {
        throw new Error('cannot load image')
      })
      const wrapper = done()

      await data(wrapper, 'print').trigger('click')
      await flushPromises()

      expect(toast.toastError).toHaveBeenCalledTimes(1)
      expect(toast.toastError).toHaveBeenCalledWith(
        'Die Karte ließ sich gerade nicht erstellen. Versuch es bitte noch einmal.',
      )
      expect(paper.print).not.toHaveBeenCalled()
    })
  })
})
