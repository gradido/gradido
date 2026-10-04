// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CONFIG from '@/config'
import i18n from '@/i18n'
import RedeemThanksPaper from '@/components/LinkInformations/RedeemThanksPaper.vue'
import { thankYouGreetingPicture } from '@/graphql/queries'
import { forgetAllGreetingPictures, rememberGreetingPicture } from './useGreetingPictures'
import { useThankYouGreetingSheet } from './useThankYouGreetingSheet'

/**
 * The sheet of a greeting is offered in two places, and what is on paper cannot be corrected:
 * this spec holds what the drawer is GIVEN -- with the wallet's own vue-i18n, so the sentences
 * are the ones that are printed --, where the photo comes from, and what becomes of the drawn
 * sheet on each of its two ways out.
 */

const SHEET = 'data:image/png;base64,c2hlZXQ='
const drawer = vi.hoisted(() => ({ draw: null, print: null }))
vi.mock('@/utils/thankYouGreetingSheet', async (importOriginal) => ({
  ...(await importOriginal()),
  drawThankYouGreetingSheet: (...args) => drawer.draw(...args),
  printThankYouGreetingSheet: (...args) => drawer.print(...args),
}))

const saving = vi.hoisted(() => ({ save: null }))
vi.mock('@/utils/chatImageSave', () => ({
  saveChatImageFile: (...args) => saving.save(...args),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: mockToastError }),
}))

const storeState = { username: 'Oma-Emma', gradidoID: '0b1e9a52-7c1d-4a0e-9d55-2f6a8f3c1e77' }
vi.mock('vuex', () => ({ useStore: () => ({ state: storeState }) }))

// The Apollo client is asked for only where the server has to be asked for the small rendition.
const apollo = vi.hoisted(() => ({ client: null, asked: 0 }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    get client() {
      apollo.asked += 1
      return apollo.client
    },
  }),
}))

const CODE = 'a3f9c21b7d04e6f58a2c9b13'
const ADDRESS = `https://ki-playground.gradido.net/api/thank-you-greeting-picture/${CODE}`
const LINK = {
  id: 4711,
  link: `https://ki-playground.gradido.net/redeem/${CODE}`,
  amount: '20',
  memo: 'Einfach so — weil es Dich gibt.\nLiebe Sarah, mit Eurem iPad hat alles angefangen.\n\nEure Oma',
  validUntil: '2026-10-18T05:38:00.000Z',
  greeting: {
    motif: 'morning-light',
    line: 'Einfach so — weil es Dich gibt.',
    recipientName: 'Sarah',
    hasPicture: false,
  },
}
const WITH_PHOTO = { ...LINK, greeting: { ...LINK.greeting, motif: null, hasPicture: true } }

/** A promise a test settles when it wants. */
const deferred = () => {
  const settle = {}
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
  return { promise, ...settle }
}
const jpeg = () => new Blob(['JPEG'], { type: 'image/jpeg' })
const answer = (blob, ok = true) => ({
  ok,
  status: ok ? 200 : 404,
  blob: () => Promise.resolve(blob),
})
const served = (base64) => ({ data: { thankYouGreetingPicture: base64 } })

describe('useThankYouGreetingSheet', () => {
  const graphqlUri = CONFIG.GRAPHQL_URI
  let wrapper
  let made
  let revoked

  /** The composable in a component, as "Fertig" and a row of the list hold it. */
  const sheetOf = (link = LINK, options) => {
    let held
    wrapper = mount(
      {
        setup() {
          held = useThankYouGreetingSheet(link, options)
          return () => null
        },
      },
      { global: { plugins: [i18n] } },
    )
    return held
  }
  /** What the drawer was given the last time it drew. */
  const drawn = () => drawer.draw.mock.calls[drawer.draw.mock.calls.length - 1][0]

  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
    storeState.username = 'Oma-Emma'
    CONFIG.GRAPHQL_URI = 'https://ki-playground.gradido.net/graphql'
    drawer.draw = vi.fn(async () => SHEET)
    drawer.print = vi.fn(async () => {})
    saving.save = vi.fn(async () => 'downloaded')
    apollo.client = { query: vi.fn(async () => served(null)) }
    apollo.asked = 0
    made = vi.fn(() => `blob:photo-${made.mock.calls.length}`)
    revoked = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: made, revokeObjectURL: revoked }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(jpeg())))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    forgetAllGreetingPictures()
    CONFIG.GRAPHQL_URI = graphqlUri
    i18n.global.locale.value = 'de'
    vi.unstubAllGlobals()
  })

  describe('what stands on the paper', () => {
    it('gives the drawer the link, the line and the words apart, and the motif', async () => {
      await sheetOf().printGreetingSheet()

      expect(drawer.draw).toHaveBeenCalledTimes(1)
      expect(drawn()).toMatchObject({
        link: LINK.link,
        picture: '/img/thank-you-greeting/morning-light.svg',
        line: 'Einfach so — weil es Dich gibt.',
        // The memo without its line, with the sender's own line breaks.
        words: 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\n\nEure Oma',
      })
    })

    // ⛔ These three sentences stand on paper, as Bernd confirmed them (04.10.2026).
    // The amount and its unit are joined by a no-break space (U+00A0): where a language's
    // sentence takes two lines, the break falls before the amount and never inside it.
    it('writes the back as it was decided: what waits, how it is accepted, that it is free', async () => {
      await sheetOf().printGreetingSheet()

      expect(drawn()).toMatchObject({
        waits: 'Dein Dank wartet: 20\u00a0Gradido',
        scan: 'Halte die Kamera Deines Handys auf den Code und nimm ihn an — bis zum 18.10.2026.',
        free: 'Kostenfrei. Keine Verpflichtung.',
        slogan: 'Helfen. Schenken. Danken.',
      })
    })

    // The server hands an amount over as "12.5"; a German sentence writes "12,5", and a
    // thousand without a dot (useAmountInText).
    it.each([
      ['12.5', 'de', 'Dein Dank wartet: 12,5\u00a0Gradido'],
      ['1000', 'de', 'Dein Dank wartet: 1000\u00a0Gradido'],
      ['12.25', 'en', 'Your thank-you is waiting: 12.25\u00a0Gradido'],
    ])('writes the amount %s as a sentence says it, in %s', async (amount, lang, waits) => {
      i18n.global.locale.value = lang
      await sheetOf({ ...LINK, amount }).printGreetingSheet()

      expect(drawn().waits).toBe(waits)
    })

    it('writes the date as "Fertig" writes it, in the language of the page', async () => {
      i18n.global.locale.value = 'en'
      await sheetOf().printGreetingSheet()

      const date = i18n.global.d(new Date(LINK.validUntil), 'short', 'en')
      expect(drawn().scan).toBe(
        `Hold your phone's camera up to the code and accept the thank-you — by ${date}.`,
      )
      expect(drawn().slogan).toBe('Help. Give. Thank.')
    })

    describe('whom it is for', () => {
      /** What the card on the screen shows for the same greeting, in the same language. */
      const onScreen = (lang, recipientName) => {
        i18n.global.locale.value = lang
        const paper = mount(RedeemThanksPaper, {
          props: {
            linkData: {
              amount: '20',
              memo: 'Danke!',
              senderUser: { alias: 'Oma-Emma', gradidoID: 'uuid' },
              greeting: { motif: null, line: null, recipientName },
            },
          },
          global: { plugins: [i18n] },
        })
        const shown = paper.find('[data-test="redeem-thanks-paper-for"]').text()
        paper.unmount()
        return shown
      }

      it.each([
        ['de', 'Jörg Weiß', 'FÜR JÖRG WEISS'],
        ['tr', 'Sarah', 'SARAH İÇİN'],
        ['el', 'Σοφία', 'ΓΙΑ: ΣΟΦΙΑ'],
        ['ru', 'Сара', 'ДЛЯ ВАС, САРА'],
      ])(
        'stands in capitals by the rules of %s, as on the screen',
        async (lang, name, expected) => {
          const shown = onScreen(lang, name)
          i18n.global.locale.value = lang
          await sheetOf({
            ...LINK,
            greeting: { ...LINK.greeting, recipientName: name },
          }).printGreetingSheet()

          expect(drawn().forWhom).toBe(expected)
          expect(drawn().forWhom).toBe(shown)
        },
      )

      it('is left out where the greeting names nobody', async () => {
        await sheetOf({
          ...LINK,
          greeting: { ...LINK.greeting, recipientName: null },
        }).printGreetingSheet()

        expect(drawn().forWhom).toBe('')
      })
    })

    // ⛔ Bernd, with the first printed card in hand (04.10.2026): under the words the sender signs
    // by hand, so nothing is signed there. Who thanks is said on the back, over the code.
    describe('who thanks', () => {
      it('is the sender, under their user name, as a sentence for the back', async () => {
        await sheetOf().printGreetingSheet()

        expect(drawn().from).toBe('Oma-Emma sagt Dir Danke')
        expect(drawn()).not.toHaveProperty('signature')
      })

      it('is said in the language of the page', async () => {
        i18n.global.locale.value = 'en'
        await sheetOf().printGreetingSheet()

        expect(drawn().from).toBe('Oma-Emma says thank you')
      })

      // ⛔ `memberAlias` stands the Gradido ID in for a missing user name. A UUID is no name to print.
      it.each([
        ['none', ''],
        ['none at all', null],
        ['one shorter than a user name is', 'ab'],
      ])('is nobody where the sender has %s', async (_, username) => {
        storeState.username = username
        await sheetOf().printGreetingSheet()

        expect(drawn().from).toBe('')
        expect(JSON.stringify(drawn())).not.toContain(storeState.gradidoID)
      })
    })

    it('gives a greeting without words its line alone, and one without a line its words', async () => {
      await sheetOf({ ...LINK, memo: LINK.greeting.line }).printGreetingSheet()
      expect(drawn()).toMatchObject({ line: LINK.greeting.line, words: '' })

      wrapper.unmount()
      await sheetOf({
        ...LINK,
        memo: 'Du hast den ganzen Samstag mit angepackt.',
        greeting: { ...LINK.greeting, line: null },
      }).printGreetingSheet()
      expect(drawn()).toMatchObject({
        line: null,
        words: 'Du hast den ganzen Samstag mit angepackt.',
      })
    })

    it('gives a greeting whose motif this wallet does not know no picture', async () => {
      await sheetOf({
        ...LINK,
        greeting: { ...LINK.greeting, motif: 'a-sixth-motif' },
      }).printGreetingSheet()

      expect(drawn().picture).toBeNull()
      expect(drawer.print).toHaveBeenCalledWith(SHEET)
    })

    // A plain motif needs neither the server nor the address of a photo.
    it('asks nobody for anything where the greeting carries a motif', async () => {
      await sheetOf().printGreetingSheet()

      expect(fetch).not.toHaveBeenCalled()
      expect(apollo.asked).toBe(0)
    })
  })

  describe('the photo of a greeting', () => {
    describe('on "Fertig", where the page holds it', () => {
      const PICTURE = 'data:image/jpeg;base64,PREVIEW'

      it('is the picture the page made: nothing is fetched and nobody is asked', async () => {
        await sheetOf({ ...WITH_PHOTO, id: undefined, picture: PICTURE }).printGreetingSheet()

        expect(drawn().picture).toBe(PICTURE)
        expect(fetch).not.toHaveBeenCalled()
        expect(apollo.asked).toBe(0)
        expect(made).not.toHaveBeenCalled()
        expect(revoked).not.toHaveBeenCalled()
      })
    })

    describe('in the list, where the server has it', () => {
      it('is the large rendition, fetched from the address the greeting’s page uses', async () => {
        await sheetOf(WITH_PHOTO).printGreetingSheet()

        expect(fetch).toHaveBeenCalledTimes(1)
        // Without cookies and without the session, and kept nowhere.
        expect(fetch).toHaveBeenCalledWith(ADDRESS, { cache: 'no-store', credentials: 'omit' })
        expect(made).toHaveBeenCalledTimes(1)
        expect(drawn().picture).toBe('blob:photo-1')
        expect(apollo.asked).toBe(0)
      })

      it('is fetched once a tap', async () => {
        const sheet = sheetOf(WITH_PHOTO)

        await sheet.printGreetingSheet()
        expect(fetch).toHaveBeenCalledTimes(1)
        await sheet.saveGreetingSheet()
        expect(fetch).toHaveBeenCalledTimes(2)
      })

      it('is let go again once the sheet is drawn', async () => {
        const drawing = deferred()
        drawer.draw = vi.fn(() => drawing.promise)

        const printing = sheetOf(WITH_PHOTO).printGreetingSheet()
        await flushPromises()
        // While the drawer draws, the address has to stand.
        expect(drawer.draw).toHaveBeenCalledTimes(1)
        expect(revoked).not.toHaveBeenCalled()

        drawing.resolve(SHEET)
        await printing
        expect(revoked).toHaveBeenCalledTimes(1)
        expect(revoked).toHaveBeenCalledWith('blob:photo-1')
      })

      it('is let go as well where the drawing fails', async () => {
        drawer.draw = vi.fn(async () => {
          throw new Error('cannot load image')
        })

        await sheetOf(WITH_PHOTO).printGreetingSheet()

        expect(revoked).toHaveBeenCalledWith('blob:photo-1')
      })

      describe('where the address gives nothing', () => {
        beforeEach(() => {
          fetch.mockResolvedValue(answer(new Blob([]), false))
        })

        it('is the small rendition the list holds', async () => {
          rememberGreetingPicture(4711, 'SMALL')

          await sheetOf(WITH_PHOTO).printGreetingSheet()

          expect(fetch).toHaveBeenCalledTimes(1)
          expect(drawn().picture).toBe('data:image/jpeg;base64,SMALL')
          expect(apollo.client.query).not.toHaveBeenCalled()
          // A data address is nothing to give back to the browser.
          expect(made).not.toHaveBeenCalled()
          expect(revoked).not.toHaveBeenCalled()
        })

        it('is asked for, by the id of the link, where the list does not hold it yet', async () => {
          const asked = deferred()
          apollo.client = { query: vi.fn(() => asked.promise) }

          const printing = sheetOf(WITH_PHOTO).printGreetingSheet()
          await flushPromises()
          expect(apollo.client.query).toHaveBeenCalledTimes(1)
          expect(apollo.client.query).toHaveBeenCalledWith({
            query: thankYouGreetingPicture,
            variables: { linkId: 4711 },
            fetchPolicy: 'no-cache',
          })
          // Not drawn before the answer is there.
          expect(drawer.draw).not.toHaveBeenCalled()

          asked.resolve(served('ASKED'))
          await printing
          expect(drawn().picture).toBe('data:image/jpeg;base64,ASKED')
          expect(drawer.print).toHaveBeenCalledWith(SHEET)
        })

        it.each([
          [
            'a page that is no picture',
            () => fetch.mockResolvedValue(answer(new Blob(['<html>'], { type: 'text/html' }))),
          ],
          ['a line that fails', () => fetch.mockRejectedValue(new TypeError('Failed to fetch'))],
        ])('counts %s as nothing, too', async (_, arrange) => {
          arrange()
          rememberGreetingPicture(4711, 'SMALL')

          await sheetOf(WITH_PHOTO).printGreetingSheet()

          expect(drawn().picture).toBe('data:image/jpeg;base64,SMALL')
        })
      })
    })

    // ⛔ Never a card with an empty place for its picture.
    describe('where none comes', () => {
      beforeEach(() => {
        fetch.mockResolvedValue(answer(new Blob([]), false))
      })

      it.each([
        [
          'the server has none for this member',
          () => (apollo.client = { query: vi.fn(async () => served(null)) }),
        ],
        [
          'the line fails',
          () =>
            (apollo.client = { query: vi.fn(async () => Promise.reject(new Error('Network'))) }),
        ],
      ])('prints nothing and says the one sentence: %s', async (_, arrange) => {
        arrange()

        await sheetOf(WITH_PHOTO).printGreetingSheet()

        expect(drawer.draw).not.toHaveBeenCalled()
        expect(drawer.print).not.toHaveBeenCalled()
        expect(mockToastError).toHaveBeenCalledTimes(1)
        expect(mockToastError).toHaveBeenCalledWith(
          'Die Karte ließ sich gerade nicht erstellen. Versuch es bitte noch einmal.',
        )
      })

      it('saves nothing either', async () => {
        await sheetOf(WITH_PHOTO).saveGreetingSheet()

        expect(drawer.draw).not.toHaveBeenCalled()
        expect(saving.save).not.toHaveBeenCalled()
        expect(mockToastError).toHaveBeenCalledTimes(1)
      })

      it('does not hold the wallet back: the next tap asks again', async () => {
        const sheet = sheetOf(WITH_PHOTO)
        await sheet.printGreetingSheet()
        expect(sheet.busy.value).toBe(false)

        fetch.mockResolvedValue(answer(jpeg()))
        await sheet.printGreetingSheet()

        expect(drawer.print).toHaveBeenCalledWith(SHEET)
      })
    })
  })

  describe('printing', () => {
    it('hands the drawn sheet to the print frame', async () => {
      await sheetOf().printGreetingSheet()

      expect(drawer.print).toHaveBeenCalledTimes(1)
      expect(drawer.print).toHaveBeenCalledWith(SHEET)
      expect(mockToastError).not.toHaveBeenCalled()
    })
  })

  describe('saving as a picture', () => {
    const savedFile = () => saving.save.mock.calls[0][0]

    it('hands the same sheet over as a PNG file', async () => {
      await sheetOf().saveGreetingSheet()

      expect(saving.save).toHaveBeenCalledTimes(1)
      expect(savedFile()).toBeInstanceOf(File)
      expect(savedFile().type).toBe('image/png')
      // "sheet", the bytes the drawer made.
      expect(savedFile().size).toBe(5)
      expect(drawer.print).not.toHaveBeenCalled()
    })

    it('names the file by the greeting, from the words the list calls it by', async () => {
      await sheetOf().saveGreetingSheet()
      expect(savedFile().name).toBe('Dank-Gruß für Sarah.png')

      wrapper.unmount()
      saving.save.mockClear()
      await sheetOf({
        ...LINK,
        greeting: { ...LINK.greeting, recipientName: null },
      }).saveGreetingSheet()
      expect(savedFile().name).toBe('Dank-Gruß.png')

      wrapper.unmount()
      saving.save.mockClear()
      i18n.global.locale.value = 'en'
      await sheetOf().saveGreetingSheet()
      expect(savedFile().name).toBe('Thank-you greeting for Sarah.png')
    })

    it('takes out of the name what a file name cannot carry', async () => {
      await sheetOf({
        ...LINK,
        greeting: { ...LINK.greeting, recipientName: 'Sarah/../Müller: "Oma"?' },
      }).saveGreetingSheet()

      expect(savedFile().name).toMatch(/^Dank-Gruß für Sarah[^<>:"/\\|?*]+Oma\.png$/)
    })

    it.each(['shared', 'downloaded'])(
      'says nothing where the device took it: %s',
      async (outcome) => {
        saving.save = vi.fn(async () => outcome)
        const sheet = sheetOf(LINK, { secondTap: true })

        await sheet.saveGreetingSheet()

        expect(mockToastError).not.toHaveBeenCalled()
        expect(sheet.saveWaits.value).toBe(false)
      },
    )

    // Whoever closes the share sheet changed their mind.
    it('says nothing where the member closed the share sheet: no error and no sentence', async () => {
      saving.save = vi.fn(async () => 'cancelled')
      const sheet = sheetOf(LINK, { secondTap: true })

      await sheet.saveGreetingSheet()

      expect(mockToastError).not.toHaveBeenCalled()
      expect(sheet.saveWaits.value).toBe(false)
      expect(sheet.busy.value).toBe(false)
    })

    /**
     * The share sheet opens only right after a tap, and the sheet had to be drawn first.
     * "Fertig" has a place to offer a second tap; a menu has none.
     */
    describe('where the share sheet wants a tap of its own', () => {
      it('keeps the file on "Fertig" and hands the same one over at the second tap, without drawing again', async () => {
        saving.save = vi.fn().mockResolvedValueOnce('again').mockResolvedValueOnce('shared')
        const sheet = sheetOf(WITH_PHOTO, { secondTap: true })

        await sheet.saveGreetingSheet()
        expect(sheet.saveWaits.value).toBe(true)
        expect(mockToastError).not.toHaveBeenCalled()
        expect(saving.save).toHaveBeenCalledTimes(1)
        const [[file]] = saving.save.mock.calls

        await sheet.saveGreetingSheet()
        expect(drawer.draw).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(saving.save).toHaveBeenCalledTimes(2)
        expect(saving.save.mock.calls[1]).toEqual([file])
        expect(sheet.saveWaits.value).toBe(false)
      })

      it('keeps offering the tap while the share sheet keeps asking for one', async () => {
        saving.save = vi.fn(async () => 'again')
        const sheet = sheetOf(LINK, { secondTap: true })

        await sheet.saveGreetingSheet()
        await sheet.saveGreetingSheet()

        expect(sheet.saveWaits.value).toBe(true)
        expect(drawer.draw).toHaveBeenCalledTimes(1)
      })

      it('lets the file go once the member closes the share sheet at the second tap', async () => {
        saving.save = vi.fn().mockResolvedValueOnce('again').mockResolvedValueOnce('cancelled')
        const sheet = sheetOf(LINK, { secondTap: true })

        await sheet.saveGreetingSheet()
        await sheet.saveGreetingSheet()
        expect(sheet.saveWaits.value).toBe(false)

        // The next tap makes a sheet of its own.
        saving.save = vi.fn(async () => 'shared')
        await sheet.saveGreetingSheet()
        expect(drawer.draw).toHaveBeenCalledTimes(2)
      })

      it('downloads the file in the list, where there is no place for a second tap', async () => {
        saving.save = vi.fn().mockResolvedValueOnce('again').mockResolvedValueOnce('downloaded')
        const sheet = sheetOf(LINK)

        await sheet.saveGreetingSheet()

        expect(saving.save).toHaveBeenCalledTimes(2)
        const [[file], second] = saving.save.mock.calls
        // The same file, and as a computer saves it: a download.
        expect(second).toEqual([file, { computer: true }])
        expect(sheet.saveWaits.value).toBe(false)
        expect(drawer.draw).toHaveBeenCalledTimes(1)
        expect(mockToastError).not.toHaveBeenCalled()
      })
    })
  })

  describe('one at a time', () => {
    it('makes one sheet of a double tap', async () => {
      const drawing = deferred()
      drawer.draw = vi.fn(() => drawing.promise)
      const sheet = sheetOf()

      const first = sheet.printGreetingSheet()
      const second = sheet.printGreetingSheet()
      await flushPromises()
      expect(sheet.busy.value).toBe(true)

      drawing.resolve(SHEET)
      await Promise.all([first, second])
      expect(drawer.draw).toHaveBeenCalledTimes(1)
      expect(drawer.print).toHaveBeenCalledTimes(1)
      expect(sheet.busy.value).toBe(false)
    })

    it('lets saving wait while a sheet is printed, and printing while one is saved', async () => {
      const drawing = deferred()
      drawer.draw = vi.fn(() => drawing.promise)
      const sheet = sheetOf()

      const printing = sheet.printGreetingSheet()
      await sheet.saveGreetingSheet()
      expect(saving.save).not.toHaveBeenCalled()
      drawing.resolve(SHEET)
      await printing
      expect(drawer.print).toHaveBeenCalledTimes(1)

      const handing = deferred()
      saving.save = vi.fn(() => handing.promise)
      const savingNow = sheet.saveGreetingSheet()
      await flushPromises()
      await sheet.printGreetingSheet()
      expect(drawer.print).toHaveBeenCalledTimes(1)
      handing.resolve('shared')
      await savingNow
    })

    // The print dialogue is the browser's: while it is open the sheet is still under way.
    it('waits until the print frame is through', async () => {
      const dialogue = deferred()
      drawer.print = vi.fn(() => dialogue.promise)
      const sheet = sheetOf()

      const printing = sheet.printGreetingSheet()
      await flushPromises()
      expect(sheet.busy.value).toBe(true)

      dialogue.resolve()
      await printing
      expect(sheet.busy.value).toBe(false)
    })
  })

  /** ONE sentence for whatever fails, in the wallet's words -- never the browser's. */
  describe('what fails', () => {
    it.each([
      [
        'a picture that does not load',
        () => (drawer.draw = vi.fn(async () => Promise.reject(new Error('cannot load image')))),
      ],
      [
        'a print frame that throws',
        () =>
          (drawer.print = vi.fn(async () =>
            Promise.reject(new TypeError("Cannot read properties of null (reading 'print')")),
          )),
      ],
      [
        'a rejection that is no error at all',
        () => (drawer.draw = vi.fn().mockRejectedValue('no error, a text')),
      ],
    ])('says the one sentence for %s, and nothing of the browser’s own', async (_, arrange) => {
      arrange()
      const sheet = sheetOf()

      await sheet.printGreetingSheet()

      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockToastError).toHaveBeenCalledWith(
        'Die Karte ließ sich gerade nicht erstellen. Versuch es bitte noch einmal.',
      )
      expect(sheet.busy.value).toBe(false)
    })

    it('says it in the language of the page', async () => {
      i18n.global.locale.value = 'en'
      drawer.draw = vi.fn(async () => Promise.reject(new Error('x')))

      await sheetOf().saveGreetingSheet()

      expect(mockToastError).toHaveBeenCalledWith(
        'The card could not be made just now. Please try again.',
      )
      expect(saving.save).not.toHaveBeenCalled()
    })

    it('saves again after a failure', async () => {
      drawer.draw = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(SHEET)
      const sheet = sheetOf()

      await sheet.saveGreetingSheet()
      await sheet.saveGreetingSheet()

      expect(saving.save).toHaveBeenCalledTimes(1)
      expect(mockToastError).toHaveBeenCalledTimes(1)
    })
  })

  // "Fertig" and the list hand out the same sheet: the same greeting, the same paper.
  describe('the same sheet from both places', () => {
    it('gives the drawer the same data on "Fertig" and in the list, for a motif', async () => {
      // "Fertig": the answer of createTransactionLink, without the id of the row.
      await sheetOf({ ...LINK, id: undefined }, { secondTap: true }).printGreetingSheet()
      const onDone = drawn()
      wrapper.unmount()

      // The list: the row's props, the amount as a number.
      await sheetOf({ ...LINK, amount: 20 }).printGreetingSheet()

      expect(drawn()).toEqual(onDone)
    })

    it('differs for a photo only in where the photo comes from', async () => {
      await sheetOf({
        ...WITH_PHOTO,
        id: undefined,
        picture: 'data:image/jpeg;base64,PREVIEW',
      }).printGreetingSheet()
      const { picture: made, ...onDone } = drawn()
      wrapper.unmount()

      await sheetOf(WITH_PHOTO).printGreetingSheet()
      const { picture: fetched, ...inList } = drawn()

      expect(inList).toEqual(onDone)
      expect(made).toBe('data:image/jpeg;base64,PREVIEW')
      expect(fetched).toBe('blob:photo-1')
    })
  })
})
