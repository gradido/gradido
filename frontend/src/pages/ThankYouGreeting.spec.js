// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { BFormGroup, BFormInput, BFormInvalidFeedback, BFormTextarea } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import {
  forgetAllGreetingPictures,
  greetingPicture,
  rememberGreetingPicture,
} from '@/composables/useGreetingPictures'
import { clearLinkDraft, useLinkDraft } from '@/composables/useLinkDraft'
import { addThankYouGreetingPicture, createTransactionLink } from '@/graphql/mutations'
import { thankYouGreetingPictureRenditions } from '@/graphql/queries'
import { THANK_YOU_PICTURE_GROUND } from '@/utils/thankYouPicture'
import ThankYouGreeting from './ThankYouGreeting.vue'

/**
 * Writing a thank-you greeting, with the wallet's own texts, its real router and the real
 * sheet: the steps are entries of the history, and what must hold is what a member can reach
 * with the arrow, the back key and the forward key -- not what a stub of the router would
 * agree to. Only the server is stood in for.
 */
const server = vi.hoisted(() => ({ documents: [], mutate: null, add: null, query: null }))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => {
    server.documents.push(document)
    // `mutate` makes the link; `add` takes the large rendition of a photo afterwards.
    return {
      mutate: (...args) =>
        document === addThankYouGreetingPicture ? server.add(...args) : server.mutate(...args),
    }
  },
  // The server is asked for a photo in one place alone: where a greeting is duplicated that
  // carried one of the member's own (`server.query`, set by the tests of that). Everywhere else
  // a question throws -- "Fertig" offers the greeting on paper (useThankYouGreetingSheet), and
  // a page that made or fetched the photo itself never asks the server for it.
  useApolloClient: () => ({
    get client() {
      return { query: (...args) => server.query(...args) }
    },
  }),
}))

/**
 * A photo of one's own: opening the file, the picture for the eye and the two renditions have
 * their own specs (utils/chatImage.spec.js, utils/thankYouPicture.spec.js) -- jsdom decodes and
 * paints nothing --, and so has the editor. Here they answer as a test says.
 */
const pictures = vi.hoisted(() => ({
  openChatImage: vi.fn(),
  thankYouPicturePreview: vi.fn(),
  encodeThankYouPictures: vi.fn(),
}))
vi.mock('@/utils/chatImage', async (importOriginal) => ({
  ...(await importOriginal()),
  openChatImage: (...args) => pictures.openChatImage(...args),
}))
vi.mock('@/utils/thankYouPicture', async (importOriginal) => ({
  ...(await importOriginal()),
  thankYouPicturePreview: (...args) => pictures.thankYouPicturePreview(...args),
  encodeThankYouPictures: (...args) => pictures.encodeThankYouPictures(...args),
}))

/** The editor as far as the page uses it: what it was handed, and its "Fertig". */
const EditorStub = {
  name: 'ChatImageEditor',
  props: { modelValue: Boolean, source: Object, edit: Object },
  emits: ['update:modelValue', 'done'],
  template: '<div data-test="editor-stub" />',
}

const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toast }))

const LINK = 'https://ki-playground.gradido.net/redeem/a3f9c2d41b7e19981fa0c4e2'
const LINK_ID = 4711
const VALID_UNTIL = '2026-10-16T12:00:00.000Z'

// What the server answers: the greeting as it was sent, with the link, its id and the date. Of
// a photo it says only that there is one -- never the picture itself.
const answerTo = ({ amount, memo, greeting: { picture, ...greeting } }) => ({
  data: {
    createTransactionLink: {
      id: LINK_ID,
      link: LINK,
      amount,
      memo,
      validUntil: VALID_UNTIL,
      greeting: { ...greeting, hasPicture: picture != null },
    },
  },
})

const Stub = (name) => ({ template: `<div data-test="${name}-page" />` })
let router
let wrapper
const updates = vi.fn()

const data = (name) => wrapper.find(`[data-test="thank-you-greeting-${name}"]`)
const step = () => router.currentRoute.value.query.step ?? 'picture'
const settle = async () => {
  await flushPromises()
  await router.isReady()
  await flushPromises()
}

// The page as the layout holds it: under the router's view, with the balance handed in.
const open = async (path = '/thank-you-greeting', { balance = 100 } = {}) => {
  router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/thank-you-greeting', component: ThankYouGreeting },
      { path: '/transactions', component: Stub('transactions') },
      { path: '/show-friends', component: Stub('show-friends') },
      { path: '/overview', component: Stub('overview') },
    ],
  })
  await router.push(path)
  wrapper = mount(
    {
      data: () => ({ balance }),
      methods: { updates },
      template: '<router-view :balance="balance" @update-transactions="updates" />',
    },
    {
      global: {
        plugins: [
          i18n,
          router,
          createStore({ state: () => ({ username: 'Oma-Emma', gradidoID: 'uuid-emma' }) }),
        ],
        // The house's input (ValidatedInput) takes these from the app's global registration.
        components: { BFormGroup, BFormInput, BFormInvalidFeedback, BFormTextarea },
        stubs: { ChatImageEditor: EditorStub },
      },
      attachTo: document.body,
    },
  )
  await settle()
}

const next = async () => {
  await data('next').trigger('click')
  await settle()
}

// Jsdom walks its history a tick later than it is asked to.
const historyGo = async (delta) => {
  const moved = new Promise((resolve) =>
    window.addEventListener('popstate', resolve, { once: true }),
  )
  window.history.go(delta)
  await moved
  await settle()
}

const fill = async ({
  name = 'Sarah',
  line = 'just-so',
  words = 'Eure Oma',
  amount = '20',
} = {}) => {
  if (name) await data('name').setValue(name)
  if (line) await data(`line-${line}`).trigger('click')
  if (words) await data('words-input').setValue(words)
  if (amount) await wrapper.find('#amount-input-field').setValue(amount)
  await flushPromises()
}

const toPreview = async (form) => {
  await next()
  await fill(form)
  await next()
}

/** A phone's photo as openChatImage hands it on, and what is made of it. */
const PHOTO = { image: { name: 'photo' }, width: 3000, height: 4000 }
const CARD_EDIT = {
  turn: 0,
  mirrored: false,
  shape: 'original',
  zoom: 1,
  panX: 0,
  panY: 0,
  frame: 36 / 25,
  ground: THANK_YOU_PICTURE_GROUND,
}
const PREVIEW = 'data:image/jpeg;base64,PREVIEW'
// Base64, as the encoder hands them on: "Noch einen für jemand anderen" reads them again.
const SMALL = { data: btoa('the small rendition'), width: 831, height: 577, bytes: 30000 }
const LARGE = {
  data: btoa('the large rendition, the picture of the card'),
  width: 1080,
  height: 750,
  bytes: 66000,
}

const editor = () => wrapper.findComponent(EditorStub)

/** On the step "Bild": a photo chosen from the device, and "Fertig" in the editor. */
const choosePhoto = async (edit = CARD_EDIT) => {
  const field = data('photo-picker')
  Object.defineProperty(field.element, 'files', {
    value: [new File(['x'], 'oma.jpg', { type: 'image/jpeg' })],
    configurable: true,
  })
  await field.trigger('change')
  await flushPromises()
  editor().vm.$emit('done', edit)
  await flushPromises()
}

/** A promise a test settles when it wants. */
const deferred = () => {
  const settle = {}
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
  return { promise, ...settle }
}

describe('ThankYouGreeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
    server.documents = []
    server.mutate = vi.fn((variables) => Promise.resolve(answerTo(variables)))
    server.add = vi.fn(() => Promise.resolve({ data: { addThankYouGreetingPicture: true } }))
    server.query = vi.fn(() => {
      throw new Error('the server was asked for a photo the page holds itself')
    })
    pictures.openChatImage.mockResolvedValue(PHOTO)
    pictures.thankYouPicturePreview.mockReturnValue(PREVIEW)
    pictures.encodeThankYouPictures.mockResolvedValue({ small: SMALL, large: LARGE })
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    wrapper?.unmount()
    forgetAllGreetingPictures()
    vi.unstubAllGlobals()
  })

  describe('the picture', () => {
    it('asks which picture, and shows the five motifs with their names', async () => {
      await open()

      expect(wrapper.text()).toContain('Welches Bild soll Dein Gruß tragen?')
      const tiles = wrapper.findAll('.tyg-motifs > button')
      expect(tiles.map((tile) => tile.text())).toEqual([
        'Herz und Blätter',
        'Gebende Hände',
        'Blumenstrauß',
        'Leuchtender Kringel',
        'Morgenlicht',
      ])
      expect(tiles.map((tile) => tile.find('img').attributes('src'))).toEqual([
        '/img/thank-you-greeting/heart-leaves.svg',
        '/img/thank-you-greeting/giving-hands.svg',
        '/img/thank-you-greeting/bouquet.svg',
        '/img/thank-you-greeting/glowing-swirl.svg',
        '/img/thank-you-greeting/morning-light.svg',
      ])
    })

    it('has one motif chosen from the start, and exactly one after another tap', async () => {
      await open()
      const pressed = () =>
        wrapper
          .findAll('.tyg-motif')
          .filter((tile) => tile.attributes('aria-pressed') === 'true')
          .map((tile) => tile.text())

      expect(pressed()).toEqual(['Herz und Blätter'])

      await data('motif-morning-light').trigger('click')
      expect(pressed()).toEqual(['Morgenlicht'])
    })

    // Sixth, a photo of one's own; and under the tiles, where the device has one, the camera
    // (jsdom knows no kind of pointer, which is how a phone answers: ThankYouPictureChoice.spec).
    it('offers a photo of one’s own beside the five motifs, and the camera', async () => {
      await open()

      expect(wrapper.findAll('.tyg-motif')).toHaveLength(6)
      expect(data('own').text()).toBe('Eigenes Foto')
      expect(data('camera').text()).toBe('Foto aufnehmen')
      expect(wrapper.findAll('input[type="file"]')).toHaveLength(2)
    })

    it('shows the three steps, the first of them the current one', async () => {
      await open()
      const steps = wrapper.findAll('.tyg-step')

      expect(steps.map((item) => item.find('.tyg-step-name').text())).toEqual([
        'Bild',
        'Worte',
        'Ansehen',
      ])
      expect(steps.map((item) => item.attributes('aria-current'))).toEqual([
        'step',
        undefined,
        undefined,
      ])
    })

    it('leads on to the words', async () => {
      await open()
      await next()

      expect(step()).toBe('words')
      expect(data('words').exists()).toBe(true)
      expect(wrapper.findAll('.tyg-step')[1].attributes('aria-current')).toBe('step')
      expect(wrapper.findAll('.tyg-step')[0].classes()).toContain('is-passed')
    })
  })

  describe('the words', () => {
    beforeEach(async () => {
      await open()
      await next()
    })

    it('asks whom it is for, with room for forty characters', () => {
      expect(wrapper.text()).toContain('Für wen?')
      expect(wrapper.text()).toContain('Der Name steht auf Deinem Gruß.')
      expect(data('name').attributes('maxlength')).toBe('40')
    })

    it('shows four suggestions for the first line, none of them chosen', () => {
      const chips = wrapper.findAll('.tyg-chip')

      expect(chips.map((chip) => chip.text())).toEqual([
        'Danke für Deine Hilfe!',
        'Danke für das gute Gespräch.',
        'Einfach so — weil es Dich gibt.',
        'Du hast mir den Tag verschönert.',
      ])
      expect(chips.every((chip) => chip.attributes('aria-pressed') === 'false')).toBe(true)
    })

    it('chooses a suggestion with a tap and takes the choice back with a second one', async () => {
      await data('line-help').trigger('click')
      expect(data('line-help').attributes('aria-pressed')).toBe('true')

      await data('line-joy').trigger('click')
      expect(data('line-help').attributes('aria-pressed')).toBe('false')
      expect(data('line-joy').attributes('aria-pressed')).toBe('true')

      await data('line-joy').trigger('click')
      expect(
        wrapper.findAll('.tyg-chip').every((chip) => chip.attributes('aria-pressed') === 'false'),
      ).toBe(true)
    })

    it('unfolds all twelve suggestions in their three groups', async () => {
      expect(data('all-lines').text()).toBe('Alle zwölf Vorschläge')
      expect(data('all-lines').attributes('aria-expanded')).toBe('false')

      await data('all-lines').trigger('click')

      expect(data('all-lines').attributes('aria-expanded')).toBe('true')
      expect(wrapper.findAll('.tyg-line-group-title').map((title) => title.text())).toEqual([
        'Danke für etwas',
        'Danke einfach so',
        'Danke zum Anlass',
      ])
      expect(wrapper.findAll('.tyg-chip')).toHaveLength(12)
      expect(
        data('group-occasion')
          .findAll('.tyg-chip')
          .map((chip) => chip.text()),
      ).toEqual([
        'Herzlich willkommen — schön, dass Du da bist!',
        'Zum Geburtstag: Danke, dass es Dich gibt.',
        'Gute Besserung — ich denk an Dich.',
        'Alles Gute auf Deinem Weg — und Danke für die gemeinsame Zeit.',
      ])
    })

    it('keeps a line chosen among the other eight in sight when the groups fold in', async () => {
      await data('all-lines').trigger('click')
      await data('line-birthday').trigger('click')
      await data('all-lines').trigger('click')

      const chips = wrapper.findAll('.tyg-chip')
      expect(chips).toHaveLength(5)
      expect(chips[4].text()).toBe('Zum Geburtstag: Danke, dass es Dich gibt.')
      expect(chips[4].attributes('aria-pressed')).toBe('true')
    })

    it('opens a field for a line of one’s own, with room for eighty characters', async () => {
      expect(data('own-line-input').exists()).toBe(false)

      await data('own-line').trigger('click')

      expect(data('own-line').attributes('aria-pressed')).toBe('true')
      expect(data('own-line-input').attributes('maxlength')).toBe('80')

      // A suggestion takes the choice over; the field goes, what was typed stays for later.
      await data('own-line-input').setValue('Für Dich, einfach so')
      await data('line-help').trigger('click')
      expect(data('own-line-input').exists()).toBe(false)
      await data('own-line').trigger('click')
      expect(data('own-line-input').element.value).toBe('Für Dich, einfach so')
    })

    it('asks for the words and, small and last, for the amount', () => {
      expect(wrapper.text()).toContain('Deine Worte')
      expect(data('words-input').element.tagName).toBe('TEXTAREA')
      expect(wrapper.text()).toContain('Wie viel Gradido legst Du dazu?')
    })

    describe('going on', () => {
      // ⛔ The first line is the title of the card: on paper it stands on the front, under the
      // picture (Bernd, 04.10.2026). Words alone are not a greeting any more.
      it('needs a first line: without one it says so at the lines, and stays', async () => {
        await fill({ line: null, words: null })
        expect(data('line-error').exists()).toBe(false)

        await next()

        expect(step()).toBe('words')
        expect(data('line-error').text()).toBe('Wähle eine erste Zeile oder schreib eine eigene.')
        expect(data('line-error').attributes('role')).toBe('alert')
        // One thing is said at a time: nothing at the words while the line is missing.
        expect(data('memo-error').exists()).toBe(false)
      })

      it('does not go on with words alone, however many', async () => {
        await fill({ line: null, words: 'Du hast den ganzen Samstag mit angepackt.' })
        await next()

        expect(step()).toBe('words')
        expect(data('line-error').exists()).toBe(true)

        await data('line-just-so').trigger('click')
        expect(data('line-error').exists()).toBe(false)
        await next()
        expect(step()).toBe('preview')
      })

      it('takes a suggestion that was tapped away again for no line', async () => {
        await fill({ words: 'Eure Oma' })
        await data('line-just-so').trigger('click')
        await next()

        expect(step()).toBe('words')
        expect(data('line-error').exists()).toBe(true)
      })

      it('takes "Eigene Zeile" without a word in it for no line, and marks the field', async () => {
        await data('own-line').trigger('click')
        await fill({ line: null, words: 'Eure Oma' })
        await next()

        expect(step()).toBe('words')
        expect(data('line-error').exists()).toBe(true)
        expect(data('own-line-input').classes()).toContain('is-invalid')

        await data('own-line-input').setValue('   ')
        await next()
        expect(step()).toBe('words')

        await data('own-line-input').setValue('Für Dich, einfach so')
        expect(data('line-error').exists()).toBe(false)
        await next()
        expect(step()).toBe('preview')
      })

      // role="alert" is said once, when the sentence appears. As the description of the lines
      // it is said again whenever the member comes back to them.
      describe('the sentence at the lines, for a screen reader', () => {
        const lines = () => wrapper.find('[aria-labelledby="thank-you-greeting-line-label"]')

        it('is the description of the lines for as long as it stands', async () => {
          await fill({ line: null, words: null })
          expect(lines().attributes('role')).toBe('group')
          expect(lines().attributes('aria-describedby')).toBeUndefined()

          await next()

          expect(data('line-error').attributes('id')).toBe('thank-you-greeting-line-error')
          expect(wrapper.findAll('#thank-you-greeting-line-error')).toHaveLength(1)
          expect(lines().attributes('aria-describedby')).toBe('thank-you-greeting-line-error')

          await data('line-just-so').trigger('click')
          expect(lines().attributes('aria-describedby')).toBeUndefined()
        })

        it('is the description of the field for a line of one’s own as well', async () => {
          await data('own-line').trigger('click')
          await fill({ line: null, words: null })
          expect(data('own-line-input').attributes('aria-describedby')).toBeUndefined()

          await next()

          expect(data('own-line-input').attributes('aria-describedby')).toBe(
            'thank-you-greeting-line-error',
          )
          expect(data('own-line-input').attributes('aria-invalid')).toBe('true')
          expect(lines().attributes('aria-describedby')).toBe('thank-you-greeting-line-error')

          await data('own-line-input').setValue('Für Dich, einfach so')
          expect(data('own-line-input').attributes('aria-describedby')).toBeUndefined()
          expect(lines().attributes('aria-describedby')).toBeUndefined()
        })

        it('leaves the words without a description: nothing is said about them', async () => {
          await fill({ line: null, words: 'Eure Oma' })
          await next()

          expect(data('words-input').attributes('aria-describedby')).toBeUndefined()
        })
      })

      // A refused "Weiter" is no step: it leaves no entry behind, and one press of the back
      // key still leads to the picture.
      it('leaves no entry in the history when it stays', async () => {
        await fill({ line: null, words: null })
        await next()
        await next()

        await historyGo(-1)

        expect(step()).toBe('picture')
      })

      it('goes on with a line alone: the words may be missing', async () => {
        await fill({ words: null })
        await next()
        expect(step()).toBe('preview')
      })

      // The check is the memo's own, on line and words together.
      it('holds line and words together to the five characters of a memo', async () => {
        await data('own-line').trigger('click')
        await data('own-line-input').setValue('Hi')
        await fill({ line: null, words: 'x' })
        await next()

        // "Hi" + line break + "x" are four characters.
        expect(step()).toBe('words')
        expect(data('memo-error').text()).toBe(
          'Die Nachricht sollte mindestens 5 Zeichen lang sein.',
        )

        await data('words-input').setValue('xy')
        await next()
        expect(step()).toBe('preview')
      })

      it('holds line and words together to the 512 characters of a memo', async () => {
        // The line has 31 characters; with the line break 480 more are the limit.
        await fill({ words: 'a'.repeat(481) })
        await next()

        expect(step()).toBe('words')
        expect(data('memo-error').text()).toBe(
          'Die Nachricht sollte höchstens 512 Zeichen lang sein.',
        )

        await data('words-input').setValue('a'.repeat(480))
        await next()
        expect(step()).toBe('preview')
      })

      it('names the sentence at the words as their description, for as long as it stands', async () => {
        await fill({ words: 'a'.repeat(481) })
        expect(data('words-input').attributes('aria-describedby')).toBeUndefined()

        await next()

        expect(data('memo-error').attributes('id')).toBe('thank-you-greeting-memo-error')
        expect(wrapper.findAll('#thank-you-greeting-memo-error')).toHaveLength(1)
        expect(data('words-input').attributes('aria-describedby')).toBe(
          'thank-you-greeting-memo-error',
        )
        // The lines are not what is wrong: they carry no description.
        expect(
          wrapper
            .find('[aria-labelledby="thank-you-greeting-line-label"]')
            .attributes('aria-describedby'),
        ).toBeUndefined()

        await data('words-input').setValue('a'.repeat(480))
        expect(data('words-input').attributes('aria-describedby')).toBeUndefined()
      })

      it('needs an amount', async () => {
        await fill({ amount: null })
        await next()

        expect(step()).toBe('words')
        expect(wrapper.find('#amount-input-field').classes()).toContain('is-invalid')
      })

      // A link holds a little more than its amount: out of 100 GDD at most 97.37 go.
      it('names the most a link may carry out of the balance, and takes exactly that', async () => {
        await fill({ amount: '97,38' })
        await next()

        expect(step()).toBe('words')
        expect(wrapper.find('.invalid-feedback').text()).toBe(
          'Der Betrag sollte höchstens 97.37 groß sein.',
        )

        await wrapper.find('#amount-input-field').setValue('97,37')
        await next()
        expect(step()).toBe('preview')
      })

      it('takes no amount under a cent and none with three decimals', async () => {
        await fill({ amount: '0' })
        await next()
        expect(step()).toBe('words')

        await wrapper.find('#amount-input-field').setValue('1,234')
        await next()
        expect(step()).toBe('words')
      })
    })
  })

  describe('the last look', () => {
    it('says whose eyes it is seen with, where the greeting names somebody', async () => {
      await open()
      await toPreview()

      expect(data('preview-title').text()).toBe('So wird Sarah Deinen Dank sehen.')
      expect(data('waits').text()).toBe(
        'Dein Gruß wartet 14 Tage. Nimmt ihn Sarah nicht an, kommt Dein Gradido einfach zu Dir zurück — nichts geht verloren.',
      )
    })

    it('says it without a name where there is none', async () => {
      await open()
      await toPreview({ name: '   ' })

      expect(data('preview-title').text()).toBe('So wird Dein Dank aussehen.')
      expect(data('waits').text()).toBe(
        'Dein Gruß wartet 14 Tage. Nimmt ihn niemand an, kommt Dein Gradido einfach zu Dir zurück — nichts geht verloren.',
      )
      expect(wrapper.find('[data-test="redeem-thanks-paper-for"]').exists()).toBe(false)
    })

    // The sheet of the redeem page, fed with the form: what is shown here is what arrives.
    it('shows the sheet the link will open as, with the member’s own user name', async () => {
      await open()
      await data('motif-bouquet').trigger('click')
      await toPreview({ amount: '12,5' })
      const paper = wrapper.find('[data-test="redeem-thanks-paper"]')

      expect(paper.find('[data-test="redeem-thanks-paper-motif"]').attributes('src')).toBe(
        '/img/thank-you-greeting/bouquet.svg',
      )
      expect(paper.find('[data-test="redeem-thanks-paper-for"]').text()).toBe('FÜR SARAH')
      expect(paper.find('[data-test="redeem-thanks-paper-line"]').text()).toBe(
        'Einfach so — weil es Dich gibt.',
      )
      expect(paper.find('[data-test="redeem-thanks-paper-message"]').text()).toBe('Eure Oma')
      expect(paper.find('[data-test="redeem-thanks-paper-from"]').element.textContent).toBe(
        'Oma-Emma dankt Dir mit 12,5 Gradido',
      )
    })

    it('shows all three steps as passed or current', async () => {
      await open()
      await toPreview()

      expect(wrapper.findAll('.tyg-step').map((item) => item.classes().sort())).toEqual([
        ['is-passed', 'tyg-step'],
        ['is-passed', 'tyg-step'],
        ['is-current', 'tyg-step'],
      ])
    })
  })

  describe('making the greeting', () => {
    it('sends the link with its greeting: the amount as a string, the memo line and words', async () => {
      await open()
      await data('motif-morning-light').trigger('click')
      await toPreview({ amount: '12,5', words: '  Liebe Sarah,\nes war schön.  ' })
      await data('finish').trigger('click')
      await settle()

      expect(server.documents).toEqual([createTransactionLink, addThankYouGreetingPicture])
      expect(server.mutate).toHaveBeenCalledTimes(1)
      // ⛔ A greeting with a motif is, line for line, the one it was: one request, no picture.
      expect(server.add).not.toHaveBeenCalled()
      expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
      const [sent] = server.mutate.mock.calls[0]
      expect(sent).toEqual({
        amount: '12.5',
        memo: 'Einfach so — weil es Dich gibt.\nLiebe Sarah,\nes war schön.',
        greeting: {
          motif: 'morning-light',
          line: 'Einfach so — weil es Dich gibt.',
          recipientName: 'Sarah',
        },
      })
      // `GradidoUnit` refuses anything but a string, before a resolver runs.
      expect(typeof sent.amount).toBe('string')
    })

    it('sends null for a missing name, and the line alone as the memo where there are no words', async () => {
      await open()
      await toPreview({ name: null, words: null })
      await data('finish').trigger('click')
      await settle()

      expect(server.mutate.mock.calls[0][0]).toEqual({
        amount: '20',
        memo: 'Einfach so — weil es Dich gibt.',
        greeting: {
          motif: 'heart-leaves',
          line: 'Einfach so — weil es Dich gibt.',
          recipientName: null,
        },
      })
    })

    it('sends a line of one’s own, trimmed', async () => {
      await open()
      await next()
      await data('own-line').trigger('click')
      await data('own-line-input').setValue('  Für Dich, Sarah  ')
      await fill({ line: null, words: null })
      await next()
      await data('finish').trigger('click')
      await settle()

      expect(server.mutate.mock.calls[0][0]).toMatchObject({
        memo: 'Für Dich, Sarah',
        greeting: { line: 'Für Dich, Sarah' },
      })
    })

    it('shows the result and tells the layout that balance and links have changed', async () => {
      await open()
      await toPreview()
      await data('finish').trigger('click')
      await settle()

      expect(step()).toBe('done')
      expect(data('done').exists()).toBe(true)
      expect(data('steps').exists()).toBe(false)
      expect(updates).toHaveBeenCalledTimes(1)
      expect(updates).toHaveBeenCalledWith({})
    })

    describe('while the request is under way', () => {
      let answer

      beforeEach(async () => {
        server.mutate = vi.fn(
          (variables) =>
            new Promise((resolve, reject) => {
              answer = { resolve: () => resolve(answerTo(variables)), reject }
            }),
        )
        await open()
        await toPreview()
        await data('finish').trigger('click')
        await flushPromises()
      })

      it('locks the button and the arrow, and a second tap sends nothing', async () => {
        expect(data('finish').attributes('disabled')).toBeDefined()
        expect(data('back').attributes('disabled')).toBeDefined()

        await data('finish').trigger('click')
        await data('finish').element.click()
        await flushPromises()

        expect(server.mutate).toHaveBeenCalledTimes(1)
      })

      // The lock is held twice: the button is disabled, and the function itself turns a
      // second call away. This one goes past the button, as a tap does that was already on
      // its way when the button locked.
      it('sends nothing a second time even past the locked button', async () => {
        const button = wrapper
          .findAllComponents({ name: 'BButton' })
          .find((candidate) => candidate.attributes('data-test') === 'thank-you-greeting-finish')

        button.vm.$emit('click', new MouseEvent('click'))
        button.vm.$emit('click', new MouseEvent('click'))
        await flushPromises()

        expect(server.mutate).toHaveBeenCalledTimes(1)
      })

      // The back key is not the page's to lock. Whatever the member does meanwhile: the
      // greeting that was sent exists, and the result is what is shown.
      it('shows the result even where the member walked back meanwhile', async () => {
        await historyGo(-1)
        expect(step()).toBe('words')

        answer.resolve()
        await settle()

        expect(step()).toBe('done')
        expect(data('done-title').text()).toBe('Dein Dank-Gruß für Sarah ist fertig.')
      })

      it('does not pull back a member who left for another page', async () => {
        await router.push('/overview')
        await settle()

        answer.resolve()
        await settle()

        // Not even the address of the page they are on is touched.
        expect(router.currentRoute.value.fullPath).toBe('/overview')
      })

      it('says what went wrong where the server refuses, and lets the member try again', async () => {
        answer.reject(new Error('User has not enough GDD'))
        await settle()

        expect(step()).toBe('preview')
        expect(data('create-error').text()).toBe('User has not enough GDD')
        expect(data('finish').attributes('disabled')).toBeUndefined()
        expect(updates).not.toHaveBeenCalled()

        await data('finish').trigger('click')
        await flushPromises()
        expect(server.mutate).toHaveBeenCalledTimes(2)
        expect(data('create-error').exists()).toBe(false)
        answer.resolve()
        await settle()
        expect(step()).toBe('done')
      })

      // What is thrown need not be an error -- a text, or nothing at all: the page still says
      // something, and the button is free again.
      it('says something and frees the button where what was thrown is no error', async () => {
        answer.reject('the line is gone')
        await settle()

        expect(step()).toBe('preview')
        expect(data('create-error').text()).toBe('the line is gone')
        expect(data('finish').attributes('disabled')).toBeUndefined()
      })

      it('and stays usable where nothing at all was thrown', async () => {
        answer.reject(undefined)
        await settle()

        expect(step()).toBe('preview')
        expect(data('create-error').exists()).toBe(true)
        expect(data('finish').attributes('disabled')).toBeUndefined()
      })
    })
  })

  /**
   * A photo of the member's own in the place of a motif (ZE-019, ZE-024). Making the greeting is
   * a chain then, and each of its steps runs once: both renditions are made, the link goes with
   * the small one, the large one follows in a request of its own.
   */
  describe('a greeting with a photo of one’s own', () => {
    const finish = async () => {
      await data('finish').trigger('click')
      await settle()
    }
    const greetingSent = () => server.mutate.mock.calls[0][0].greeting

    describe('choosing it', () => {
      it('puts the photo into its tile as the choice, and no motif is chosen', async () => {
        await open()

        await choosePhoto()

        expect(pictures.thankYouPicturePreview).toHaveBeenCalledWith(PHOTO, CARD_EDIT)
        expect(data('photo-picture').attributes('src')).toBe(PREVIEW)
        expect(data('photo').attributes('aria-pressed')).toBe('true')
        expect(
          wrapper
            .findAll('.tyg-motifs > button')
            .every((tile) => tile.attributes('aria-pressed') === 'false'),
        ).toBe(true)
        expect(wrapper.findAll('.tyg-motif-check')).toHaveLength(1)
      })

      // The choice leaves the page with the step and comes back with it: the photo is the page's.
      it('keeps the photo in its tile over the steps and back', async () => {
        await open()
        await choosePhoto()
        await next()
        expect(data('own').exists()).toBe(false)

        await historyGo(-1)

        expect(step()).toBe('picture')
        expect(data('photo-picture').attributes('src')).toBe(PREVIEW)
        expect(data('photo').attributes('aria-pressed')).toBe('true')
      })

      it('lets a motif be the choice again, the photo staying in its tile', async () => {
        await open()
        await choosePhoto()

        await data('motif-bouquet').trigger('click')

        expect(data('motif-bouquet').attributes('aria-pressed')).toBe('true')
        expect(data('photo').attributes('aria-pressed')).toBe('false')
        expect(data('photo-picture').attributes('src')).toBe(PREVIEW)
      })

      /**
       * ⛔ The photo lives in the memory of the page only: the store is mirrored into the
       * device's storage, and nothing of a picture may get there.
       */
      it('puts nothing of the photo into the store', async () => {
        await open()
        const store = wrapper.vm.$store
        const before = JSON.stringify(store.state)
        const committed = vi.spyOn(store, 'commit')
        const dispatched = vi.spyOn(store, 'dispatch')

        await choosePhoto()
        await toPreview()
        await finish()

        expect(step()).toBe('done')
        expect(committed).not.toHaveBeenCalled()
        expect(dispatched).not.toHaveBeenCalled()
        expect(JSON.stringify(store.state)).toBe(before)
      })
    })

    /**
     * The photo the member just made is shown as the page holds it -- on the last look and on
     * "Fertig" -- without asking the server for it.
     */
    describe('showing it', () => {
      const paperPhoto = () => wrapper.find('[data-test="redeem-thanks-paper-photo"]')

      it('stands on the sheet of the last look, in the place of the motif', async () => {
        await open()
        await choosePhoto()
        await toPreview()

        expect(paperPhoto().attributes('src')).toBe(PREVIEW)
        // whose photo it is: the member's own user name, as the sheet names the sender
        expect(paperPhoto().attributes('alt')).toBe('Foto von Oma-Emma')
        expect(wrapper.find('[data-test="redeem-thanks-paper-motif"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="redeem-thanks-paper-for"]').text()).toBe('FÜR SARAH')
      })

      it('gives way to the motif on the last look where a motif was chosen again', async () => {
        await open()
        await choosePhoto()
        await data('motif-bouquet').trigger('click')
        await toPreview()

        expect(paperPhoto().exists()).toBe(false)
        expect(wrapper.find('[data-test="redeem-thanks-paper-photo-room"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="redeem-thanks-paper-motif"]').attributes('src')).toBe(
          '/img/thank-you-greeting/bouquet.svg',
        )
      })

      it('stands on "Fertig", small, with the sentence that names it', async () => {
        await open()
        await choosePhoto()
        await toPreview()
        await data('finish').trigger('click')
        await settle()

        expect(data('done-photo').attributes('src')).toBe(PREVIEW)
        expect(data('done-photo').attributes('alt')).toBe('Foto von Oma-Emma')
        expect(data('done-motif').exists()).toBe(false)
        expect(data('link-hint').text()).toBe(
          'Wer den Link hat, sieht Dein Foto und kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
        )
      })

      // The photo that was SENT, even where another picture was chosen while the chain ran.
      it('shows on "Fertig" the photo that was sent', async () => {
        const encoding = deferred()
        pictures.encodeThankYouPictures.mockReturnValue(encoding.promise)
        await open()
        await choosePhoto()
        await toPreview()
        await data('finish').trigger('click')
        await flushPromises()
        await historyGo(-1)
        await historyGo(-1)
        pictures.thankYouPicturePreview.mockReturnValue('data:image/jpeg;base64,ANOTHER')
        await choosePhoto()

        encoding.resolve({ small: SMALL, large: LARGE })
        await settle()

        expect(step()).toBe('done')
        expect(data('done-photo').attributes('src')).toBe(PREVIEW)
      })

      it('asks the server for no picture, from the choice to "Fertig"', async () => {
        const fetched = vi.fn()
        vi.stubGlobal('fetch', fetched)
        await open()
        await choosePhoto()
        await toPreview()
        await data('finish').trigger('click')
        await settle()

        expect(step()).toBe('done')
        expect(fetched).not.toHaveBeenCalled()
        // two requests in all: the link, and the large rendition
        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.add).toHaveBeenCalledTimes(1)
      })

      /**
       * The member's list of links shows the small rendition: kept from what was just sent,
       * under the id of the link the server made -- in memory, until the member signs out.
       */
      it('keeps the small rendition for the list of links, under the id of the link', async () => {
        await open()
        await choosePhoto()
        await toPreview()
        expect(greetingPicture(LINK_ID)).toBeNull()

        await data('finish').trigger('click')
        await settle()

        expect(greetingPicture(LINK_ID)).toEqual({
          state: 'ready',
          src: `data:image/jpeg;base64,${SMALL.data}`,
        })
      })

      it('keeps no picture for a greeting with a motif', async () => {
        await open()
        await toPreview()
        await data('finish').trigger('click')
        await settle()

        expect(greetingPicture(LINK_ID)).toBeNull()
        expect(data('done-motif').exists()).toBe(true)
        expect(data('link-hint').text()).toBe(
          'Wer den Link hat, kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
        )
      })
    })

    describe('making it', () => {
      it('makes both renditions of the photo as it was cut, once', async () => {
        const edit = { ...CARD_EDIT, zoom: 0.52 }
        await open()
        await choosePhoto(edit)
        await toPreview()
        expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()

        await finish()

        expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
        expect(pictures.encodeThankYouPictures).toHaveBeenCalledWith(PHOTO, edit)
      })

      it('sends the link with the small rendition in the place of the motif', async () => {
        await open()
        await choosePhoto()
        await toPreview({ amount: '12,5' })
        await finish()

        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.mutate.mock.calls[0][0]).toEqual({
          amount: '12.5',
          memo: 'Einfach so — weil es Dich gibt.\nEure Oma',
          greeting: {
            // a motif or a photo, never both
            motif: null,
            line: 'Einfach so — weil es Dich gibt.',
            recipientName: 'Sarah',
            // the JPEG and its size, as a chat picture goes: no bytes, nothing else
            picture: { data: SMALL.data, width: 831, height: 577 },
          },
        })
      })

      it('sends the large rendition afterwards, for the link the server made', async () => {
        await open()
        await choosePhoto()
        await toPreview()
        await finish()

        expect(server.add).toHaveBeenCalledTimes(1)
        expect(server.add).toHaveBeenCalledWith({
          linkId: LINK_ID,
          picture: { data: LARGE.data, width: 1080, height: 750 },
        })
        expect(server.mutate.mock.invocationCallOrder[0]).toBeLessThan(
          server.add.mock.invocationCallOrder[0],
        )
        expect(step()).toBe('done')
        expect(updates).toHaveBeenCalledTimes(1)
      })

      it('sends the motif alone where a motif was chosen again after the photo', async () => {
        await open()
        await choosePhoto()
        await data('motif-bouquet').trigger('click')
        await toPreview()
        await finish()

        expect(greetingSent()).toEqual({
          motif: 'bouquet',
          line: 'Einfach so — weil es Dich gibt.',
          recipientName: 'Sarah',
        })
        expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
        expect(server.add).not.toHaveBeenCalled()
      })

      // A photo that could not be made large enough for the page goes with the small one alone.
      it('sends no second request where there is no large rendition', async () => {
        pictures.encodeThankYouPictures.mockResolvedValue({ small: SMALL, large: null })
        await open()
        await choosePhoto()
        await toPreview()
        await finish()

        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.add).not.toHaveBeenCalled()
        expect(step()).toBe('done')
      })
    })

    /** ⛔ The button is locked for the whole chain, and no step of it runs twice. */
    describe('while the chain is under way', () => {
      let encoding
      let making
      let adding

      beforeEach(async () => {
        encoding = deferred()
        making = deferred()
        adding = deferred()
        pictures.encodeThankYouPictures.mockReturnValue(encoding.promise)
        server.mutate = vi.fn((variables) => making.promise.then(() => answerTo(variables)))
        server.add = vi.fn(() => adding.promise)
        await open()
        await choosePhoto()
        await toPreview()
        await data('finish').trigger('click')
        await flushPromises()
      })

      const pressAgain = async () => {
        await data('finish').trigger('click')
        wrapper
          .findAllComponents({ name: 'BButton' })
          .find((candidate) => candidate.attributes('data-test') === 'thank-you-greeting-finish')
          .vm.$emit('click', new MouseEvent('click'))
        await flushPromises()
      }
      const locked = () => data('finish').attributes('disabled') !== undefined

      it('is locked while the renditions are made, and sends nothing yet', async () => {
        expect(locked()).toBe(true)
        expect(data('back').attributes('disabled')).toBeDefined()

        await pressAgain()

        expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
        expect(server.mutate).not.toHaveBeenCalled()
        expect(server.add).not.toHaveBeenCalled()
      })

      it('is locked while the link is made, and the large rendition waits for it', async () => {
        encoding.resolve({ small: SMALL, large: LARGE })
        await flushPromises()
        expect(locked()).toBe(true)

        await pressAgain()

        expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.add).not.toHaveBeenCalled()
        expect(step()).toBe('preview')
      })

      // "Fertig" appears only after the large rendition is through.
      it('is locked while the large rendition is sent, and shows no result yet', async () => {
        encoding.resolve({ small: SMALL, large: LARGE })
        making.resolve()
        await flushPromises()
        expect(locked()).toBe(true)
        expect(step()).toBe('preview')
        expect(data('done').exists()).toBe(false)
        expect(updates).not.toHaveBeenCalled()

        await pressAgain()

        expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.add).toHaveBeenCalledTimes(1)

        adding.resolve({ data: { addThankYouGreetingPicture: true } })
        await settle()
        expect(step()).toBe('done')
        expect(data('done').exists()).toBe(true)
        expect(updates).toHaveBeenCalledTimes(1)
      })

      /**
       * ⛔ The large rendition may fail without a word: the greeting stands, the page of its link
       * shows the small one. No error for the member, and no second try.
       */
      it('shows the result where the large rendition did not get through', async () => {
        encoding.resolve({ small: SMALL, large: LARGE })
        making.resolve()
        await flushPromises()

        adding.reject(new Error('Network error'))
        await settle()

        expect(step()).toBe('done')
        expect(data('done').exists()).toBe(true)
        expect(data('create-error').exists()).toBe(false)
        expect(server.add).toHaveBeenCalledTimes(1)
        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(updates).toHaveBeenCalledTimes(1)
      })

      // The server says no -- the link was accepted meanwhile, or is no longer open: the same.
      it('shows the result where the server did not take the large rendition', async () => {
        encoding.resolve({ small: SMALL, large: LARGE })
        making.resolve()
        await flushPromises()

        adding.resolve({ data: { addThankYouGreetingPicture: false } })
        await settle()

        expect(step()).toBe('done')
        expect(server.add).toHaveBeenCalledTimes(1)
      })

      /**
       * What is sent is the greeting as it stood at the press. The back key is not the page's to
       * lock: the member may walk back and choose a motif while the renditions are being made.
       */
      it('sends the photo that was chosen at the press, whatever is chosen meanwhile', async () => {
        await historyGo(-1)
        await historyGo(-1)
        expect(step()).toBe('picture')
        await data('motif-bouquet').trigger('click')

        encoding.resolve({ small: SMALL, large: LARGE })
        making.resolve()
        adding.resolve({ data: { addThankYouGreetingPicture: true } })
        await settle()

        expect(server.mutate.mock.calls[0][0].greeting).toMatchObject({
          motif: null,
          picture: { data: SMALL.data, width: 831, height: 577 },
        })
        expect(server.add).toHaveBeenCalledTimes(1)
        expect(step()).toBe('done')
      })

      // The greeting gets its large rendition even where the member has left the page.
      it('finishes the chain for a member who left for another page, and pulls nobody back', async () => {
        await router.push('/overview')
        await settle()

        encoding.resolve({ small: SMALL, large: LARGE })
        making.resolve()
        adding.resolve({ data: { addThankYouGreetingPicture: true } })
        await settle()

        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.add).toHaveBeenCalledTimes(1)
        expect(router.currentRoute.value.fullPath).toBe('/overview')
      })

      it('says so where the photo cannot be made small enough, and sends nothing', async () => {
        encoding.reject(
          Object.assign(new Error('CHAT_IMAGE_NOT_SMALL_ENOUGH'), {
            name: 'ChatImageError',
            problem: 'NOT_SMALL_ENOUGH',
          }),
        )
        await settle()

        expect(step()).toBe('preview')
        expect(data('create-error').text()).toBe(
          'Dieses Bild lässt sich nicht klein genug rechnen.',
        )
        expect(server.mutate).not.toHaveBeenCalled()
        expect(server.add).not.toHaveBeenCalled()
        expect(updates).not.toHaveBeenCalled()
        expect(locked()).toBe(false)
      })

      it('says so where the server did not take the photo, and lets the member try again', async () => {
        encoding.resolve({ small: SMALL, large: LARGE })
        server.mutate.mockImplementationOnce(() =>
          Promise.reject(new Error('CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE')),
        )
        await settle()

        expect(step()).toBe('preview')
        expect(data('create-error').text()).toBe('Das Bild wurde nicht angenommen.')
        expect(server.add).not.toHaveBeenCalled()
        expect(updates).not.toHaveBeenCalled()
        expect(locked()).toBe(false)

        // Another go is the member's own: the chain runs anew, each step once more.
        making.resolve()
        adding.resolve({ data: { addThankYouGreetingPicture: true } })
        await data('finish').trigger('click')
        await settle()

        expect(data('create-error').exists()).toBe(false)
        expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(2)
        expect(server.mutate).toHaveBeenCalledTimes(2)
        expect(server.add).toHaveBeenCalledTimes(1)
        expect(step()).toBe('done')
      })

      it('says what went wrong where the link was not made, and sends no large rendition', async () => {
        encoding.resolve({ small: SMALL, large: LARGE })
        making.reject(new Error('User has not enough GDD'))
        await settle()

        expect(step()).toBe('preview')
        expect(data('create-error').text()).toBe('User has not enough GDD')
        expect(server.add).not.toHaveBeenCalled()
        expect(locked()).toBe(false)
      })
    })
  })

  describe('going back', () => {
    it('goes one step back with the arrow, and keeps what was entered', async () => {
      await open()
      await data('motif-bouquet').trigger('click')
      await toPreview()

      await data('back').trigger('click')
      await settle()
      await new Promise((resolve) => setTimeout(resolve, 20))
      await settle()
      expect(step()).toBe('words')
      expect(data('name').element.value).toBe('Sarah')
      expect(data('line-just-so').attributes('aria-pressed')).toBe('true')
      expect(data('words-input').element.value).toBe('Eure Oma')
      expect(wrapper.find('#amount-input-field').element.value).toBe('20')

      await historyGo(-1)
      expect(step()).toBe('picture')
      expect(data('motif-bouquet').attributes('aria-pressed')).toBe('true')
    })

    it('goes one step back with the back key of the device, the same way', async () => {
      await open()
      await toPreview()

      await historyGo(-1)
      expect(step()).toBe('words')
      expect(data('words-input').element.value).toBe('Eure Oma')

      await historyGo(1)
      expect(step()).toBe('preview')
    })

    // The forward key into the last look, after the line was taken away on the way back.
    it('does not show the last look for a form that no longer holds', async () => {
      await open()
      await toPreview({ words: null })
      await historyGo(-1)
      await data('line-just-so').trigger('click')

      await historyGo(1)

      expect(step()).toBe('words')
      expect(data('line-error').exists()).toBe(true)
    })

    it('leaves the page from the first step: to the page of the two doors where it was opened by its address', async () => {
      await open()

      await data('back').trigger('click')
      await settle()

      expect(router.currentRoute.value.path).toBe('/show-friends')
    })

    it('starts at the picture when the page is loaded anew on a later step', async () => {
      for (const asked of ['words', 'preview', 'done']) {
        await open(`/thank-you-greeting?step=${asked}`)

        expect(step()).toBe('picture')
        expect(data('picture').exists()).toBe(true)
        wrapper.unmount()
      }
    })

    it('shows the picture for a step it does not know', async () => {
      await open('/thank-you-greeting?step=nonsense')

      expect(data('picture').exists()).toBe(true)
    })
  })

  // ⛔ A second tap on "Gruß fertigstellen" would make a second greeting and hold the amount
  // twice. Once the greeting is made, no way leads back to that button.
  describe('after the greeting is made', () => {
    beforeEach(async () => {
      await open()
      await toPreview()
      await data('finish').trigger('click')
      await settle()
    })

    it('leads to the list of links with the back key, not back into the steps', async () => {
      await historyGo(-1)

      expect(router.currentRoute.value.path).toBe('/transactions')
      expect(data('finish').exists()).toBe(false)
      expect(server.mutate).toHaveBeenCalledTimes(1)
    })

    it('begins a new, empty greeting where the member walks further back', async () => {
      await historyGo(-1)
      await historyGo(-1)

      expect(router.currentRoute.value.path).toBe('/thank-you-greeting')
      expect(step()).toBe('picture')
      await next()
      expect(data('name').element.value).toBe('')
      expect(data('words-input').element.value).toBe('')
    })

    it('shows no step with the forward key either', async () => {
      await historyGo(-1)
      await historyGo(1)

      expect(data('finish').exists()).toBe(false)
      expect(data('done').exists()).toBe(false)
      expect(server.mutate).toHaveBeenCalledTimes(1)
    })

    it('has no arrow and no steps on the result', () => {
      expect(data('back').exists()).toBe(false)
      expect(data('steps').exists()).toBe(false)
      expect(data('finish').exists()).toBe(false)
    })
  })

  /**
   * "Noch einen für jemand anderen" on the result (ZE-030): a NEW greeting with everything the
   * one just made carried, for the next person -- only "Für wen?" is empty. It has a number of
   * its own in the address: no entry of the first greeting ever shows the second, and the first
   * one is never made a second time.
   */
  describe('one more for somebody else', () => {
    const LINE = 'Einfach so — weil es Dich gibt.'
    const finish = async () => {
      await data('finish').trigger('click')
      await settle()
    }
    const another = async () => {
      await data('another').trigger('click')
      await settle()
    }
    const nameField = () => data('name').element.value
    const wordsField = () => data('words-input').element.value
    const amountField = () => wrapper.find('#amount-input-field').element.value
    const chosenLines = () => wrapper.findAll('.tyg-chip.is-chosen').map((chip) => chip.text())
    const chosenMotifs = () =>
      wrapper
        .findAll('.tyg-motif')
        .filter((tile) => tile.attributes('aria-pressed') === 'true')
        .map((tile) => tile.text())
    const greetingsSent = () => server.mutate.mock.calls.map(([sent]) => sent)
    const address = () => router.currentRoute.value.fullPath

    // The page reached as the wallet leads to it, so that there is somewhere to walk back to.
    const reach = async () => {
      await open('/transactions')
      await router.push('/thank-you-greeting')
      await settle()
    }

    /** A first greeting, made: the bouquet, for Sarah, with 20 Gradido. */
    const made = async () => {
      await reach()
      await data('motif-bouquet').trigger('click')
      await toPreview()
      await finish()
    }

    it('is offered on the result', async () => {
      await made()

      expect(data('another').text()).toBe('Noch einen für jemand anderen')
    })

    /**
     * ⛔ The wallet's guard may lead a navigation elsewhere: a session that ran out ends at the
     * sign-in page. The new greeting begins only where its first step arrived at this page --
     * its words are pushed onto no other page's address.
     */
    it('pushes nothing onto another page where the wallet leads away from this one', async () => {
      await made()
      router.beforeEach((to) => (to.path === '/thank-you-greeting' ? '/overview' : true))

      await another()

      expect(address()).toBe('/overview')
      expect(greetingsSent()).toHaveLength(1)
    })

    describe('begun', () => {
      beforeEach(async () => {
        await made()
        await another()
      })

      it('opens at the words of a new greeting, which has a number of its own in the address', () => {
        expect(step()).toBe('words')
        expect(data('words').exists()).toBe(true)
        expect(data('done').exists()).toBe(false)
        expect(address()).toBe('/thank-you-greeting?step=words&greeting=2')
      })

      it('has everything the greeting just made carried, and nobody’s name', () => {
        expect(nameField()).toBe('')
        expect(chosenLines()).toEqual([LINE])
        expect(wordsField()).toBe('Eure Oma')
        expect(amountField()).toBe('20')
      })

      it('puts the caret into "Für wen?"', () => {
        expect(document.activeElement).toBe(data('name').element)
      })

      it('says nothing is missing', () => {
        expect(data('line-error').exists()).toBe(false)
        expect(data('memo-error').exists()).toBe(false)
        expect(data('create-error').exists()).toBe(false)
      })

      it('has its picture one step back: the one the first carried, as the choice', async () => {
        await historyGo(-1)

        expect(step()).toBe('picture')
        expect(address()).toBe('/thank-you-greeting?greeting=2')
        expect(chosenMotifs()).toEqual(['Blumenstrauß'])
      })

      it('makes nothing by beginning', () => {
        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(updates).toHaveBeenCalledTimes(1)
      })

      // A new greeting says what is missing only once the member wants to go on, as every
      // greeting does -- though the first one went on already.
      it('says nothing of a line taken away until the member wants to go on', async () => {
        await data('line-just-so').trigger('click')
        expect(chosenLines()).toEqual([])
        expect(data('line-error').exists()).toBe(false)

        await next()

        expect(step()).toBe('words')
        expect(data('line-error').exists()).toBe(true)
      })

      // The steps the page led to belong to the first greeting: the new one has not been to
      // its last look yet, and an address that names it is turned back to the picture.
      it('knows no step of the new greeting it has not led to', async () => {
        await router.push('/thank-you-greeting?step=preview&greeting=2')
        await settle()

        expect(step()).toBe('picture')
        expect(address()).toBe('/thank-you-greeting?greeting=2')
        expect(data('finish').exists()).toBe(false)
      })

      // Nothing of the greeting is in the address, the history or the storage of the device.
      it('names a count in the address, and nothing of the greeting anywhere a browser keeps things', () => {
        const kept = [
          address(),
          JSON.stringify(window.history.state),
          JSON.stringify(wrapper.vm.$store.state),
          JSON.stringify({ ...localStorage }),
          JSON.stringify({ ...sessionStorage }),
        ].join(' ')

        for (const secret of ['Sarah', 'Einfach so', 'Eure Oma', 'bouquet']) {
          expect(kept).not.toContain(secret)
        }
      })
    })

    // The first greeting had all twelve lines unfolded and one of the other eight chosen: the
    // new one opens folded, with that line in sight.
    it('opens with the lines folded in, the chosen one in sight', async () => {
      await reach()
      await next()
      await data('all-lines').trigger('click')
      await fill({ line: 'birthday' })
      await next()
      await finish()

      await another()

      expect(data('group-occasion').exists()).toBe(false)
      expect(wrapper.findAll('.tyg-chip')).toHaveLength(5)
      expect(chosenLines()).toEqual(['Zum Geburtstag: Danke, dass es Dich gibt.'])
    })

    it('begins one greeting for two taps', async () => {
      await made()

      data('another').trigger('click')
      data('another').trigger('click')
      await settle()

      expect(address()).toBe('/thank-you-greeting?step=words&greeting=2')
    })

    // What exists is the greeting that was SENT: the member may have walked back and changed a
    // field while the request was under way.
    it('carries what was sent, whatever was changed while the request was under way', async () => {
      let answer
      server.mutate = vi.fn(
        (variables) =>
          new Promise((resolve) => {
            answer = () => resolve(answerTo(variables))
          }),
      )
      await reach()
      await toPreview()
      await data('finish').trigger('click')
      await flushPromises()
      await historyGo(-1)
      await data('name').setValue('Jemand anderes')
      await data('words-input').setValue('Etwas ganz anderes')
      await historyGo(-1)
      await data('motif-giving-hands').trigger('click')
      answer()
      await settle()
      expect(step()).toBe('done')

      await another()

      expect(nameField()).toBe('')
      expect(wordsField()).toBe('Eure Oma')
      await historyGo(-1)
      expect(chosenMotifs()).toEqual(['Herz und Blätter'])
    })

    describe('made', () => {
      beforeEach(async () => {
        await made()
        await another()
      })

      it('is a second greeting: for the name typed, with all else as the first', async () => {
        await data('name').setValue('Claude')
        await next()

        await finish()

        expect(greetingsSent()).toHaveLength(2)
        expect(greetingsSent()[1]).toEqual({
          amount: '20',
          memo: `${LINE}\nEure Oma`,
          greeting: { motif: 'bouquet', line: LINE, recipientName: 'Claude' },
        })
      })

      it('names nobody where no name is typed', async () => {
        await next()

        await finish()

        expect(greetingsSent()[1].greeting.recipientName).toBeNull()
      })

      it('takes what is changed: other words, another amount, another picture', async () => {
        await data('name').setValue('Claude')
        await data('words-input').setValue('Lieber Claude, bis bald.')
        await wrapper.find('#amount-input-field').setValue('7,5')
        await historyGo(-1)
        await data('motif-giving-hands').trigger('click')
        await next()
        await next()

        await finish()

        expect(greetingsSent()[1]).toEqual({
          amount: '7.5',
          memo: `${LINE}\nLieber Claude, bis bald.`,
          greeting: { motif: 'giving-hands', line: LINE, recipientName: 'Claude' },
        })
        // The first went out as it was.
        expect(greetingsSent()[0].greeting).toEqual({
          motif: 'bouquet',
          line: LINE,
          recipientName: 'Sarah',
        })
      })

      it('makes one greeting for two taps on "Gruß fertigstellen"', async () => {
        await next()

        data('finish').trigger('click')
        data('finish').trigger('click')
        await settle()

        expect(server.mutate).toHaveBeenCalledTimes(2)
      })

      it('has a result of its own, which tells the layout and offers the same way on', async () => {
        await data('name').setValue('Claude')
        await next()
        await finish()

        expect(step()).toBe('done')
        expect(address()).toBe('/thank-you-greeting?step=done&greeting=2')
        expect(data('done-title').text()).toBe('Dein Dank-Gruß für Claude ist fertig.')
        expect(updates).toHaveBeenCalledTimes(2)

        await another()

        expect(address()).toBe('/thank-you-greeting?step=words&greeting=3')
        expect(nameField()).toBe('')
        expect(wordsField()).toBe('Eure Oma')
      })

      it('leads to the list of links from its result, and makes no third', async () => {
        await next()
        await finish()

        await historyGo(-1)

        expect(router.currentRoute.value.path).toBe('/transactions')
        expect(server.mutate).toHaveBeenCalledTimes(2)
      })
    })

    /**
     * A photo of the member's own goes on to the next greeting as the page still holds it: with
     * the two renditions it sent a moment ago. Nothing is chosen anew, nothing is encoded anew,
     * and the server is not asked for it.
     */
    /**
     * ⛔ The picture as the device handed it over is let go once a greeting is made: it is many
     * times the size of what was sent, and the result is the page the member leaves for a
     * messenger and comes back to. The photo of the next greeting is read from the two
     * renditions that went out -- as the photo of a duplicated greeting is.
     */
    describe('with a photo of one’s own', () => {
      const LARGE_BYTES = atob(LARGE.data).length
      const SENT_PREVIEW = `data:image/jpeg;base64,${LARGE.data}`
      const LARGE_AGAIN = { image: { name: 'large-again' }, width: 1080, height: 750 }
      const SMALL_AGAIN = { image: { name: 'small-again' }, width: 831, height: 577 }
      // The first greeting's cut: it is in the renditions, and no cut of the next one.
      const FIRST_CUT = { ...CARD_EDIT, zoom: 1.3 }
      const readAgain = () =>
        pictures.openChatImage.mock.calls
          .map(([file]) => file)
          .filter((file) => file.name !== 'oma.jpg')
      const notTakenOver = () => data('photo-not-taken-over')

      beforeEach(() => {
        pictures.openChatImage.mockImplementation(async (file) => {
          if (file.name === 'oma.jpg') return PHOTO
          return file.size === LARGE_BYTES ? LARGE_AGAIN : SMALL_AGAIN
        })
      })

      const madeWithPhoto = async () => {
        await reach()
        await choosePhoto(FIRST_CUT)
        await toPreview()
        await finish()
      }

      describe('begun', () => {
        beforeEach(async () => {
          await madeWithPhoto()
          await another()
        })

        it('opens at the words, with the photo in its tile as the choice', async () => {
          expect(address()).toBe('/thank-you-greeting?step=words&greeting=2')

          await historyGo(-1)

          expect(data('photo').attributes('aria-pressed')).toBe('true')
          expect(data('photo-picture').attributes('src')).toBe(SENT_PREVIEW)
          expect(chosenMotifs()).toEqual([])
          expect(notTakenOver().exists()).toBe(false)
        })

        it('reads it from the two renditions that went out, and asks nobody for it', () => {
          expect(readAgain().map((file) => [file.type, file.size])).toEqual([
            ['image/jpeg', atob(SMALL.data).length],
            ['image/jpeg', LARGE_BYTES],
          ])
          expect(server.query).not.toHaveBeenCalled()
        })

        it('shows it on the last look', async () => {
          await next()

          expect(wrapper.find('[data-test="redeem-thanks-paper-photo"]').attributes('src')).toBe(
            SENT_PREVIEW,
          )
        })

        it('sends the two renditions that went out with the first, and encodes nothing anew', async () => {
          await data('name').setValue('Claude')
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
          expect(greetingsSent()[1].greeting).toEqual({
            motif: null,
            line: LINE,
            recipientName: 'Claude',
            picture: { data: SMALL.data, width: 831, height: 577 },
          })
          expect(greetingsSent()[1].greeting.picture).toEqual(greetingsSent()[0].greeting.picture)
          expect(server.add).toHaveBeenCalledTimes(2)
          expect(server.add.mock.calls[1]).toEqual(server.add.mock.calls[0])
          expect(server.add.mock.calls[1][0].picture).toEqual({
            data: LARGE.data,
            width: 1080,
            height: 750,
          })
          expect(server.query).not.toHaveBeenCalled()
          expect(data('done-photo').attributes('src')).toBe(SENT_PREVIEW)
        })

        // A third greeting, from the result of the second: still the renditions of the first.
        it('sends them once more with the greeting after that', async () => {
          await next()
          await finish()
          await another()
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
          expect(greetingsSent()[2].greeting.picture).toEqual(greetingsSent()[0].greeting.picture)
          expect(server.add.mock.calls[2]).toEqual(server.add.mock.calls[0])
        })

        // The large rendition is the picture now, uncut: the first cut is in it.
        it('makes both renditions anew, of the large one, once the photo is cut anew', async () => {
          const cut = { ...CARD_EDIT, zoom: 1.4 }
          await historyGo(-1)
          await data('photo').trigger('click')
          expect(editor().props('source')).toEqual(LARGE_AGAIN)
          expect(editor().props('edit')).toEqual(CARD_EDIT)
          editor().vm.$emit('done', cut)
          await flushPromises()
          await next()
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(2)
          expect(pictures.encodeThankYouPictures).toHaveBeenLastCalledWith(LARGE_AGAIN, cut)
        })

        it('goes out with a motif where one is chosen instead', async () => {
          await historyGo(-1)
          await data('motif-morning-light').trigger('click')
          await next()
          await next()

          await finish()

          expect(greetingsSent()[1].greeting).toEqual({
            motif: 'morning-light',
            line: LINE,
            recipientName: null,
          })
          expect(server.add).toHaveBeenCalledTimes(1)
        })
      })

      /**
       * The photo opens in a moment of its own. ⛔ One tap begins one greeting, whatever is
       * tapped meanwhile; and a page that was left meanwhile begins none.
       */
      describe('while the photo opens', () => {
        let opening

        beforeEach(async () => {
          await madeWithPhoto()
          opening = deferred()
          pictures.openChatImage.mockImplementation(() => opening.promise)
          await data('another').trigger('click')
        })

        it('still shows the result', () => {
          expect(step()).toBe('done')
          expect(data('done').exists()).toBe(true)
        })

        it('begins one greeting for two taps', async () => {
          await data('another').trigger('click')
          opening.resolve(LARGE_AGAIN)
          await settle()

          expect(address()).toBe('/thank-you-greeting?step=words&greeting=2')
          expect(readAgain()).toHaveLength(2)
        })

        it('begins none in a page that was left', async () => {
          await router.push('/overview')
          await settle()

          opening.resolve(LARGE_AGAIN)
          await settle()

          expect(address()).toBe('/overview')
        })
      })

      // What the browser made a moment ago it reads again -- and where it does not, the page
      // says so, as it does of the photo of a duplicated greeting that did not come.
      describe('where the photo does not open again', () => {
        beforeEach(async () => {
          await madeWithPhoto()
          pictures.openChatImage.mockRejectedValue(new Error('no picture'))
          await another()
        })

        it('stays at the picture of the new greeting, the first motif chosen, and says so', () => {
          expect(address()).toBe('/thank-you-greeting?greeting=2')
          expect(data('picture').exists()).toBe(true)
          expect(chosenMotifs()).toEqual(['Herz und Blätter'])
          expect(data('photo').exists()).toBe(false)
          expect(notTakenOver().text()).toBe(
            'Das Foto ließ sich nicht übernehmen. Wähle es neu aus oder nimm ein Motiv.',
          )
        })

        it('carries the words all the same, and nobody’s name', async () => {
          await next()

          expect(nameField()).toBe('')
          expect(chosenLines()).toEqual([LINE])
          expect(wordsField()).toBe('Eure Oma')
          expect(amountField()).toBe('20')
        })

        it('goes out with the motif, and without a picture', async () => {
          await next()
          await next()

          await finish()

          expect(greetingsSent()[1].greeting).toEqual({
            motif: 'heart-leaves',
            line: LINE,
            recipientName: null,
          })
          expect(server.add).toHaveBeenCalledTimes(1)
        })
      })
    })

    // The first greeting had no large rendition (it could not be made): neither has the next.
    it('sends no large rendition where the first had none', async () => {
      pictures.encodeThankYouPictures.mockResolvedValue({ small: SMALL, large: null })
      await reach()
      await choosePhoto()
      await toPreview()
      await finish()
      await another()
      await next()

      await finish()

      expect(greetingsSent()[1].greeting.picture.data).toBe(SMALL.data)
      expect(server.add).not.toHaveBeenCalled()
      expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
    })

    /**
     * ⛔ The entries of the history belong to one greeting each. Behind the new greeting lie
     * the words and the picture of the first: none of them shows the new one, and none makes
     * the first a second time.
     */
    describe('the history', () => {
      beforeEach(async () => {
        await made()
        await another()
      })

      it('leads back to the picture of the new greeting, and from there to the list of links', async () => {
        await historyGo(-1)
        expect(step()).toBe('picture')
        expect(address()).toBe('/thank-you-greeting?greeting=2')

        await historyGo(-1)

        expect(router.currentRoute.value.path).toBe('/transactions')
        expect(wrapper.find('[data-test="transactions-page"]').exists()).toBe(true)
      })

      it('leads back with the arrow of the page the same way', async () => {
        // Jsdom walks its history a tick later than it is asked to.
        const arrow = async () => {
          await data('back').trigger('click')
          await settle()
          await new Promise((resolve) => setTimeout(resolve, 20))
          await settle()
        }

        await arrow()
        expect(step()).toBe('picture')
        expect(address()).toBe('/thank-you-greeting?greeting=2')

        await arrow()
        expect(router.currentRoute.value.path).toBe('/transactions')
      })

      // Two steps back at once land on the words of the FIRST greeting: the same step, another
      // greeting.
      it('never shows an entry of the first greeting with what the second holds', async () => {
        await data('name').setValue('Claude')

        await historyGo(-2)

        expect(router.currentRoute.value.path).toBe('/transactions')
        expect(data('words').exists()).toBe(false)
        expect(data('finish').exists()).toBe(false)
      })

      it('comes to the words of the new greeting again with the forward key, everything still there', async () => {
        await data('name').setValue('Claude')
        await historyGo(-1)

        await historyGo(1)

        expect(step()).toBe('words')
        expect(nameField()).toBe('Claude')
        expect(chosenLines()).toEqual([LINE])
        expect(wordsField()).toBe('Eure Oma')
      })

      // Left for the list and come back with the forward key: the page is built anew and knows
      // no second greeting -- it starts empty, at its own address.
      it('starts empty where the page is come back to after it was left, and makes nothing', async () => {
        await historyGo(-1)
        await historyGo(-1)
        expect(router.currentRoute.value.path).toBe('/transactions')

        await historyGo(1)

        expect(address()).toBe('/thank-you-greeting')
        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Herz und Blätter'])
        await next()
        expect(nameField()).toBe('')
        expect(chosenLines()).toEqual([])
        expect(wordsField()).toBe('')
        expect(amountField()).toBe('')
        expect(server.mutate).toHaveBeenCalledTimes(1)
      })

      it('and further forward: no step of a visit that is over', async () => {
        await historyGo(-1)
        await historyGo(-1)

        await historyGo(1)
        await historyGo(1)

        expect(address()).toBe('/thank-you-greeting')
        expect(data('finish').exists()).toBe(false)
        expect(server.mutate).toHaveBeenCalledTimes(1)
      })
    })

    describe('an address that names a greeting this page did not begin', () => {
      it.each([
        '/thank-you-greeting?step=words&greeting=2',
        '/thank-you-greeting?greeting=2',
        '/thank-you-greeting?step=preview&greeting=7',
        '/thank-you-greeting?step=done&greeting=2',
        '/thank-you-greeting?greeting=abc',
        '/thank-you-greeting?greeting=0',
        '/thank-you-greeting?greeting',
      ])('starts empty, at the picture and at the page’s own address: %s', async (path) => {
        await open(path)

        expect(address()).toBe('/thank-you-greeting')
        expect(step()).toBe('picture')
        await next()
        expect(nameField()).toBe('')
        expect(wordsField()).toBe('')
      })
    })

    /**
     * ⛔ A greeting is made once. Two things hold that, and each has a test of its own: the
     * watcher that shows no step of a greeting that is made (above, and "after the greeting is
     * made"), and the lock in `create` -- which matters where the step to the result does not
     * happen, and the button of the last look still stands.
     */
    describe('the lock on a greeting that is made', () => {
      it('makes it once where the result cannot be shown and the button still stands', async () => {
        await reach()
        await toPreview()
        const replace = vi.spyOn(router, 'replace').mockResolvedValue(undefined)

        await finish()
        expect(step()).toBe('preview')
        expect(data('finish').attributes('disabled')).toBeUndefined()
        await finish()
        await finish()

        expect(server.mutate).toHaveBeenCalledTimes(1)
        replace.mockRestore()
      })

      it('is open again for the next greeting, and holds that one as well', async () => {
        await made()
        await another()
        await next()
        const replace = vi.spyOn(router, 'replace').mockResolvedValue(undefined)

        await finish()
        await finish()

        expect(server.mutate).toHaveBeenCalledTimes(2)
        replace.mockRestore()
      })
    })
  })

  describe('in another language', () => {
    it('writes the chosen line in the language the wallet is in when the greeting is made', async () => {
      await open()
      await next()
      await fill()
      i18n.global.locale.value = 'en'
      await next()
      await data('finish').trigger('click')
      await settle()

      expect(server.mutate.mock.calls[0][0]).toMatchObject({
        memo: 'Just because — because you’re you.\nEure Oma',
        greeting: { line: 'Just because — because you’re you.' },
      })
    })
  })

  /**
   * A greeting duplicated from the member's own list (ZE-030): the row hands over what the old
   * link carried (useLinkDraft, in memory), and this page opens with it -- at the words,
   * everything filled in, the picture one step back. What is made of it is a NEW greeting, on
   * the way of every greeting; the handover makes nothing, and the old link is not touched.
   */
  describe('a duplicated greeting', () => {
    const LINE = 'Einfach so — weil es Dich gibt.'
    const OWN_WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma'
    const OLD = {
      id: 815,
      amount: 20,
      memo: `${LINE}\n${OWN_WORDS}`,
      greeting: { motif: 'bouquet', line: LINE, recipientName: 'Sarah', hasPicture: false },
    }
    const old = (greeting = {}, rest = {}) => ({
      ...OLD,
      ...rest,
      greeting: { ...OLD.greeting, ...greeting },
    })

    // What the row of the list does, as the member whose list it is.
    // ⚠️ Before the page is mounted: the test utils keep the stubs of the LAST mount for every
    // component drawn after it, and this one names none -- the editor would be the real one.
    const handOver = (link = OLD, gradidoID = 'uuid-emma') => {
      mount(
        {
          setup() {
            useLinkDraft().put(link)
            return () => null
          },
        },
        { global: { provide: { store: { state: { gradidoID } } } } },
      )
    }

    // The way the list leads: from the transactions to the address of the page, and no further.
    const duplicate = async (link = OLD, gradidoID = 'uuid-emma') => {
      handOver(link, gradidoID)
      await open('/transactions')
      await router.push('/thank-you-greeting')
      await settle()
    }

    const nameField = () => data('name').element.value
    const wordsField = () => data('words-input').element.value
    const amountField = () => wrapper.find('#amount-input-field').element.value
    const chosenLines = () => wrapper.findAll('.tyg-chip.is-chosen').map((chip) => chip.text())
    const chosenMotifs = () =>
      wrapper
        .findAll('.tyg-motif')
        .filter((tile) => tile.attributes('aria-pressed') === 'true')
        .map((tile) => tile.text())
    const notTakenOver = () => data('photo-not-taken-over')

    beforeEach(() => {
      clearLinkDraft()
      localStorage.clear()
      sessionStorage.clear()
    })

    describe('as it opens', () => {
      it('opens at the words', async () => {
        await duplicate()

        expect(step()).toBe('words')
        expect(data('words').exists()).toBe(true)
        expect(wrapper.findAll('.tyg-step')[1].attributes('aria-current')).toBe('step')
      })

      it('has everything the old greeting carried standing in the fields', async () => {
        await duplicate()

        expect(nameField()).toBe('Sarah')
        expect(chosenLines()).toEqual([LINE])
        expect(wordsField()).toBe(OWN_WORDS)
        expect(amountField()).toBe('20')
      })

      // Nothing is wrong yet, so nothing says so: the fields speak up once the member goes on.
      it('says nothing is missing', async () => {
        await duplicate()

        expect(data('line-error').exists()).toBe(false)
        expect(data('memo-error').exists()).toBe(false)
      })

      it('writes the amount as the wallet’s language writes it', async () => {
        await duplicate(old({}, { amount: 12.5 }))
        expect(amountField()).toBe('12,5')
        wrapper.unmount()

        i18n.global.locale.value = 'en'
        await duplicate(old({}, { amount: 12.5 }))
        expect(amountField()).toBe('12.5')
      })

      it('leaves "Für wen?" empty for a greeting that named nobody', async () => {
        await duplicate(old({ recipientName: null }))

        expect(nameField()).toBe('')
        expect(chosenLines()).toEqual([LINE])
      })

      // The memo of a greeting is its line, a line break and the words -- or the line alone.
      it('leaves the words empty for a greeting that was its first line and nothing else', async () => {
        await duplicate(old({}, { memo: LINE }))

        expect(chosenLines()).toEqual([LINE])
        expect(wordsField()).toBe('')
      })
    })

    /**
     * The first line is kept by its key while a greeting is written, and goes out as text. Coming
     * back, it is told by its wording, in the language the wallet is in now.
     */
    describe('the first line', () => {
      it.each([
        ['one of the four that stand there at first', 'help', 'Danke für Deine Hilfe!'],
        ['one of the eight behind "Alle zwölf Vorschläge"', 'birthday', null],
      ])('is the suggestion again where it is %s', async (_, key, wording) => {
        const line = i18n.global.t(`thank-you-greeting.line.${key}`)
        if (wording) expect(line).toBe(wording)

        await duplicate(old({ line }, { memo: `${line}\n${OWN_WORDS}` }))

        expect(chosenLines()).toEqual([line])
        // In sight without the twelve being opened, and not a line of the member's own.
        expect(data('all-lines').attributes('aria-expanded')).toBe('false')
        expect(data(`line-${key}`).attributes('aria-pressed')).toBe('true')
        expect(data('own-line-input').exists()).toBe(false)
        expect(wordsField()).toBe(OWN_WORDS)
      })

      it('stands as a line of the member’s own where it is none of the twelve', async () => {
        await duplicate(old({ line: 'Für Dein Lachen' }, { memo: 'Für Dein Lachen\nBis bald!' }))

        expect(chosenLines()).toEqual([])
        expect(data('own-line').attributes('aria-pressed')).toBe('true')
        expect(data('own-line-input').element.value).toBe('Für Dein Lachen')
        expect(wordsField()).toBe('Bis bald!')
      })

      // The old greeting carries its line in the language it was chosen in.
      it('stands as a line of the member’s own where the wallet is in another language now', async () => {
        i18n.global.locale.value = 'en'

        await duplicate()

        expect(chosenLines()).toEqual([])
        expect(data('own-line-input').element.value).toBe(LINE)
        expect(wordsField()).toBe(OWN_WORDS)
      })

      // A greeting from before a first line was asked for (04.10.2026).
      it('is not chosen for an old greeting without one, and the page asks for one as of every greeting', async () => {
        await duplicate(old({ line: null }, { memo: 'Danke Dir für alles!' }))

        expect(chosenLines()).toEqual([])
        expect(data('own-line-input').exists()).toBe(false)
        // The whole memo was the words then.
        expect(wordsField()).toBe('Danke Dir für alles!')

        await next()

        expect(step()).toBe('words')
        expect(data('line-error').text()).toBe('Wähle eine erste Zeile oder schreib eine eigene.')
      })
    })

    describe('the picture', () => {
      it('lies one step back, the old motif chosen', async () => {
        await duplicate()

        await historyGo(-1)

        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Blumenstrauß'])
        expect(notTakenOver().exists()).toBe(false)
      })

      // A motif this wallet does not know (a newer one made the greeting): the member sees the
      // picture before anything else, and nothing is said of a photo.
      it('is asked for first where this wallet does not know the old motif', async () => {
        await duplicate(old({ motif: 'from-a-newer-wallet' }))

        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Herz und Blätter'])
        expect(notTakenOver().exists()).toBe(false)

        await next()
        expect(nameField()).toBe('Sarah')
        expect(chosenLines()).toEqual([LINE])
      })
    })

    /**
     * The old greeting carried a photo of the member's own, and the duplicate carries it along:
     * the page fetches both renditions of the old link -- in one request of its own, past every
     * cache --, puts the photo into its tile as the choice and goes on to the words. As long as
     * the member does not cut it anew, the two renditions go out again as they came, byte for
     * byte. Where the photo does not come, the page stays at the picture and says so.
     */
    describe('one that carried a photo', () => {
      const WITH_PHOTO = old({ motif: null, hasPicture: true })
      // Base64, as the server answers; told apart by their length where they are decoded.
      const OLD_SMALL = btoa('the small rendition of the old photo')
      const OLD_LARGE = btoa('the large rendition of the old photo, as large as the page shows it')
      const OLD_LARGE_BYTES = atob(OLD_LARGE).length
      const OLD_SOURCE = { image: { name: 'old-large' }, width: 1080, height: 750 }
      const OLD_SMALL_SOURCE = { image: { name: 'old-small' }, width: 831, height: 577 }
      const OLD_PREVIEW = `data:image/jpeg;base64,${OLD_LARGE}`

      const answered = (small = OLD_SMALL, large = OLD_LARGE) =>
        Promise.resolve({ data: { small, large } })
      const paperPhoto = () => wrapper.find('[data-test="redeem-thanks-paper-photo"]')
      const finish = async () => {
        await next()
        await data('finish').trigger('click')
        await settle()
      }
      const greetingSent = () => server.mutate.mock.calls[0][0].greeting

      beforeEach(() => {
        server.query = vi.fn(() => answered())
        // A photo chosen from the device is the phone's; what the server answered is decoded
        // as the rendition it is.
        pictures.openChatImage.mockImplementation(async (file) => {
          if (file.name === 'oma.jpg') return PHOTO
          return file.size === OLD_LARGE_BYTES ? OLD_SOURCE : OLD_SMALL_SOURCE
        })
      })

      describe('fetching it', () => {
        it('asks the server once, for both renditions of the old link, past every cache', async () => {
          await duplicate(WITH_PHOTO)

          expect(server.query).toHaveBeenCalledTimes(1)
          expect(server.query).toHaveBeenCalledWith({
            query: thankYouGreetingPictureRenditions,
            variables: { linkId: OLD.id },
            fetchPolicy: 'no-cache',
          })
        })

        /**
         * ⛔ Not through the store of the list's photos: that one knows the link by its id and
         * would hand back the small rendition it remembers, without asking -- the duplicate
         * would be made of the small picture.
         */
        it('asks the server though the list remembers the small rendition of that link', async () => {
          rememberGreetingPicture(OLD.id, 'REMEMBERED-SMALL')

          await duplicate(WITH_PHOTO)
          await historyGo(-1)

          expect(server.query).toHaveBeenCalledTimes(1)
          expect(data('photo-picture').attributes('src')).toBe(OLD_PREVIEW)
        })

        it('decodes what came, the large rendition and the small one', async () => {
          await duplicate(WITH_PHOTO)

          const sizes = pictures.openChatImage.mock.calls.map(([file]) => file.size).sort()
          expect(sizes).toEqual([atob(OLD_SMALL).length, OLD_LARGE_BYTES].sort())
        })

        it('makes nothing, and asks for no photo of a greeting that carried a motif', async () => {
          await duplicate(WITH_PHOTO)
          expect(server.mutate).not.toHaveBeenCalled()
          expect(server.add).not.toHaveBeenCalled()
          wrapper.unmount()
          server.query.mockClear()

          await duplicate(OLD)

          expect(server.query).not.toHaveBeenCalled()
        })
      })

      describe('once it is here', () => {
        it('opens at the words, everything filled in', async () => {
          await duplicate(WITH_PHOTO)

          expect(step()).toBe('words')
          expect(nameField()).toBe('Sarah')
          expect(chosenLines()).toEqual([LINE])
          expect(wordsField()).toBe(OWN_WORDS)
          expect(amountField()).toBe('20')
        })

        it('lies in its tile one step back, as the choice, and nothing says it is missing', async () => {
          await duplicate(WITH_PHOTO)

          await historyGo(-1)

          expect(step()).toBe('picture')
          expect(data('photo').attributes('aria-pressed')).toBe('true')
          expect(data('photo-picture').attributes('src')).toBe(OLD_PREVIEW)
          expect(chosenMotifs()).toEqual([])
          expect(notTakenOver().exists()).toBe(false)
          // The tile waits no more, and takes another photo again.
          expect(data('own').classes()).not.toContain('is-busy')
          expect(data('photo-picker').attributes('disabled')).toBeUndefined()
          expect(data('next').attributes('disabled')).toBeUndefined()
        })

        it('leads back from the picture to where the member came from', async () => {
          await duplicate(WITH_PHOTO)

          await historyGo(-1)
          await historyGo(-1)

          expect(router.currentRoute.value.path).toBe('/transactions')
        })

        it('stands on the sheet of the last look as it came', async () => {
          await duplicate(WITH_PHOTO)
          await next()

          expect(paperPhoto().attributes('src')).toBe(OLD_PREVIEW)
          expect(wrapper.find('[data-test="redeem-thanks-paper-motif"]').exists()).toBe(false)
        })

        /**
         * ⛔ In the memory of the page only: not under the id of the old link in the store of
         * the list's photos, and nowhere a browser keeps things.
         */
        it('is kept by the page alone', async () => {
          await duplicate(WITH_PHOTO)

          const kept = [
            JSON.stringify(window.history.state),
            JSON.stringify(wrapper.vm.$store.state),
            JSON.stringify({ ...localStorage }),
            JSON.stringify({ ...sessionStorage }),
            window.location.href,
          ].join(' ')
          expect(kept).not.toContain(OLD_SMALL)
          expect(kept).not.toContain(OLD_LARGE)
          expect(greetingPicture(OLD.id)).toBeNull()
        })
      })

      describe('making it', () => {
        /**
         * ⛔ The very bytes that were fetched: the new greeting carries the picture the old one
         * carries. Nothing is encoded -- a second encoding would be a step coarser.
         */
        it('sends the two renditions as they came, and encodes nothing', async () => {
          await duplicate(WITH_PHOTO)

          await finish()

          expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
          expect(server.mutate).toHaveBeenCalledTimes(1)
          expect(greetingSent()).toEqual({
            motif: null,
            line: LINE,
            recipientName: 'Sarah',
            picture: { data: OLD_SMALL, width: 831, height: 577 },
          })
          expect(server.add).toHaveBeenCalledTimes(1)
          expect(server.add).toHaveBeenCalledWith({
            linkId: LINK_ID,
            picture: { data: OLD_LARGE, width: 1080, height: 750 },
          })
          expect(step()).toBe('done')
        })

        // The old greeting never got its large rendition: the server answers the small one twice.
        it('sends the small rendition alone where the old greeting had no large one', async () => {
          server.query = vi.fn(() => answered(OLD_SMALL, OLD_SMALL))
          await duplicate(WITH_PHOTO)

          await finish()

          expect(greetingSent().picture).toEqual({ data: OLD_SMALL, width: 831, height: 577 })
          expect(server.add).not.toHaveBeenCalled()
          expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
        })

        it('shows on "Fertig" the photo that came, and keeps the small one for the list under the NEW link', async () => {
          await duplicate(WITH_PHOTO)

          await finish()

          expect(data('done-photo').attributes('src')).toBe(OLD_PREVIEW)
          expect(greetingPicture(LINK_ID)).toEqual({
            state: 'ready',
            src: `data:image/jpeg;base64,${OLD_SMALL}`,
          })
          expect(greetingPicture(OLD.id)).toBeNull()
          expect(server.query).toHaveBeenCalledTimes(1)
        })

        /**
         * Cut anew -- a tap on the chosen photo, as ever --, the large rendition is the picture
         * the editor is handed, and both renditions are made of it on the way of every photo.
         */
        it('hands the large rendition to the editor where the chosen photo is tapped', async () => {
          await duplicate(WITH_PHOTO)
          await historyGo(-1)

          await data('photo').trigger('click')

          expect(editor().props('modelValue')).toBe(true)
          expect(editor().props('source')).toEqual(OLD_SOURCE)
          expect(editor().props('edit')).toEqual(CARD_EDIT)
        })

        it('makes both renditions anew once the photo was cut anew', async () => {
          const cut = { ...CARD_EDIT, zoom: 1.6, panX: 0.2 }
          await duplicate(WITH_PHOTO)
          await historyGo(-1)
          await data('photo').trigger('click')
          editor().vm.$emit('done', cut)
          await flushPromises()
          expect(data('photo-picture').attributes('src')).toBe(PREVIEW)
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).toHaveBeenCalledTimes(1)
          expect(pictures.encodeThankYouPictures).toHaveBeenCalledWith(OLD_SOURCE, cut)
          expect(greetingSent().picture).toEqual({ data: SMALL.data, width: 831, height: 577 })
          expect(server.add).toHaveBeenCalledWith({
            linkId: LINK_ID,
            picture: { data: LARGE.data, width: 1080, height: 750 },
          })
        })

        // The editor left with "Abbrechen" hands nothing back: the photo stays the one that came.
        it('still sends them as they came where the editor was left without a cut', async () => {
          await duplicate(WITH_PHOTO)
          await historyGo(-1)
          await data('photo').trigger('click')
          editor().vm.$emit('update:modelValue', false)
          await flushPromises()
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
          expect(greetingSent().picture.data).toBe(OLD_SMALL)
        })

        it('lets another photo take its place', async () => {
          await duplicate(WITH_PHOTO)
          await historyGo(-1)
          await choosePhoto()
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).toHaveBeenCalledWith(PHOTO, CARD_EDIT)
          expect(greetingSent().picture.data).toBe(SMALL.data)
        })

        it('goes out with a motif where one was chosen instead, the photo staying in its tile', async () => {
          await duplicate(WITH_PHOTO)
          await historyGo(-1)
          await data('motif-bouquet').trigger('click')
          expect(data('photo-picture').attributes('src')).toBe(OLD_PREVIEW)
          await next()

          await finish()

          expect(greetingSent()).toEqual({ motif: 'bouquet', line: LINE, recipientName: 'Sarah' })
          expect(server.add).not.toHaveBeenCalled()
        })

        // Chosen again after a motif, it is still the photo that came: not a photo cut anew.
        it('sends them as they came where the photo was chosen again after a motif', async () => {
          await duplicate(WITH_PHOTO)
          await historyGo(-1)
          await data('motif-bouquet').trigger('click')
          await data('photo').trigger('click')
          expect(editor().props('modelValue')).toBe(false)
          await next()

          await finish()

          expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
          expect(greetingSent().picture.data).toBe(OLD_SMALL)
          expect(server.add.mock.calls[0][0].picture.data).toBe(OLD_LARGE)
        })

        it('makes one greeting for two taps on "Gruß fertigstellen"', async () => {
          await duplicate(WITH_PHOTO)
          await next()

          data('finish').trigger('click')
          data('finish').trigger('click')
          await settle()

          expect(server.mutate).toHaveBeenCalledTimes(1)
          expect(server.add).toHaveBeenCalledTimes(1)
        })

        // "Noch einen für jemand anderen" after a duplicate: the photo that came goes out a
        // third time as it came, and the server is asked for it once in all.
        it('goes on to one more greeting as it came, without asking the server again', async () => {
          await duplicate(WITH_PHOTO)
          await finish()

          await data('another').trigger('click')
          await settle()
          expect(nameField()).toBe('')
          await finish()

          expect(server.query).toHaveBeenCalledTimes(1)
          expect(pictures.encodeThankYouPictures).not.toHaveBeenCalled()
          expect(server.mutate).toHaveBeenCalledTimes(2)
          expect(server.mutate.mock.calls[1][0].greeting).toEqual({
            motif: null,
            line: LINE,
            recipientName: null,
            picture: { data: OLD_SMALL, width: 831, height: 577 },
          })
          expect(server.add.mock.calls[1][0].picture.data).toBe(OLD_LARGE)
        })
      })

      /**
       * ⛔ No greeting is made with another picture than the page shows: while the photo is on
       * its way the first motif stands there, and no way leads on to "Gruß fertigstellen".
       */
      describe('while it is on its way', () => {
        let coming

        beforeEach(async () => {
          coming = deferred()
          server.query = vi.fn(() => coming.promise)
          await duplicate(WITH_PHOTO)
        })

        it('stays at the picture, the first motif chosen, and says nothing yet', () => {
          expect(step()).toBe('picture')
          expect(chosenMotifs()).toEqual(['Herz und Blätter'])
          expect(notTakenOver().exists()).toBe(false)
          expect(data('photo').exists()).toBe(false)
        })

        it('shows that the tile of the photo waits, and says so for the ear', () => {
          expect(data('own').classes()).toContain('is-busy')
          expect(data('own').attributes('aria-busy')).toBe('true')
          expect(data('picture-status').text()).toBe('Bild wird vorbereitet …')
        })

        // What is about to land in the tile would land under an open editor.
        it('takes no photo from the device meanwhile', () => {
          expect(data('photo-picker').attributes('disabled')).toBeDefined()
        })

        it('does not go on: "Weiter" waits', async () => {
          expect(data('next').attributes('disabled')).toBeDefined()

          await data('next').trigger('click')
          await settle()

          expect(step()).toBe('picture')
        })

        it('shows no last look for an address that names it', async () => {
          await router.push('/thank-you-greeting?step=preview')
          await settle()

          expect(step()).toBe('picture')
          expect(data('finish').exists()).toBe(false)
        })

        it('puts the photo into its tile and goes on to the words when it lands', async () => {
          coming.resolve({ data: { small: OLD_SMALL, large: OLD_LARGE } })
          await settle()

          expect(step()).toBe('words')
          await historyGo(-1)
          expect(data('photo').attributes('aria-pressed')).toBe('true')
          expect(data('photo-picture').attributes('src')).toBe(OLD_PREVIEW)
        })

        /**
         * ⛔ An answer is placed only where it is still waited for. A motif the member chose
         * meanwhile is their answer: it stands, the page goes on at their word, and the photo
         * is let go when it lands.
         */
        it('lets a motif the member chose stand, and lets the photo go when it lands', async () => {
          await data('motif-bouquet').trigger('click')
          expect(data('next').attributes('disabled')).toBeUndefined()
          expect(data('own').classes()).not.toContain('is-busy')

          coming.resolve({ data: { small: OLD_SMALL, large: OLD_LARGE } })
          await settle()

          expect(step()).toBe('picture')
          expect(chosenMotifs()).toEqual(['Blumenstrauß'])
          expect(data('photo').exists()).toBe(false)
          expect(notTakenOver().exists()).toBe(false)
        })

        it('goes out with the motif the member chose meanwhile', async () => {
          await data('motif-bouquet').trigger('click')
          await next()
          await finish()
          coming.resolve({ data: { small: OLD_SMALL, large: OLD_LARGE } })
          await settle()

          expect(greetingSent()).toEqual({ motif: 'bouquet', line: LINE, recipientName: 'Sarah' })
          expect(server.add).not.toHaveBeenCalled()
          expect(step()).toBe('done')
        })

        it('puts nothing into a page that was left, and leads nowhere', async () => {
          await router.push('/transactions')
          await settle()

          coming.resolve({ data: { small: OLD_SMALL, large: OLD_LARGE } })
          await settle()

          expect(router.currentRoute.value.fullPath).toBe('/transactions')
        })

        it('says that it did not come where the answer fails at last', async () => {
          coming.reject(new Error('Failed to fetch'))
          await settle()

          expect(step()).toBe('picture')
          expect(notTakenOver().exists()).toBe(true)
          expect(data('next').attributes('disabled')).toBeUndefined()
        })
      })

      // A line that neither answers nor fails: the page waits fifteen seconds and no longer.
      describe('where no answer comes at all', () => {
        afterEach(() => {
          vi.useRealTimers()
        })

        it('waits fifteen seconds, then says that the photo did not come, and lets a late answer go', async () => {
          vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
          const late = deferred()
          server.query = vi.fn(() => late.promise)
          await duplicate(WITH_PHOTO)

          vi.advanceTimersByTime(14999)
          await settle()
          expect(notTakenOver().exists()).toBe(false)
          expect(data('next').attributes('disabled')).toBeDefined()

          vi.advanceTimersByTime(1)
          await settle()
          expect(notTakenOver().exists()).toBe(true)
          expect(data('next').attributes('disabled')).toBeUndefined()
          expect(data('photo-picker').attributes('disabled')).toBeUndefined()

          late.resolve({ data: { small: OLD_SMALL, large: OLD_LARGE } })
          await settle()
          expect(step()).toBe('picture')
          expect(data('photo').exists()).toBe(false)
          expect(notTakenOver().exists()).toBe(true)
        })
      })

      /**
       * It does not come along -- the old link was deleted meanwhile, the line, an answer that
       * is no picture: the page opens at the picture, the first motif is the choice, and a
       * sentence says so.
       */
      describe('where it does not come', () => {
        const NOT_COMING = {
          'the server answers nothing': () => answered(null, null),
          'the server answers no small rendition': () => answered(null, OLD_LARGE),
          'the line fails': () => Promise.reject(new Error('Failed to fetch')),
          'the answer carries no data': () => Promise.resolve({}),
          'what came is not base64': () => answered('%%%', '%%%'),
        }

        it.each(Object.keys(NOT_COMING))(
          'opens at the picture, the first motif chosen, and says so: %s',
          async (how) => {
            server.query = vi.fn(NOT_COMING[how])

            await duplicate(WITH_PHOTO)

            expect(step()).toBe('picture')
            expect(chosenMotifs()).toEqual(['Herz und Blätter'])
            expect(notTakenOver().text()).toBe(
              'Das Foto ließ sich nicht übernehmen. Wähle es neu aus oder nimm ein Motiv.',
            )
            // The tile of the photo is empty, and takes a photo: it is chosen anew there.
            expect(data('photo-choose').exists()).toBe(true)
            expect(data('photo').exists()).toBe(false)
            expect(data('own').classes()).not.toContain('is-busy')
            expect(data('photo-picker').attributes('disabled')).toBeUndefined()
            expect(data('next').attributes('disabled')).toBeUndefined()
          },
        )

        it('and where what came is no picture a browser decodes', async () => {
          pictures.openChatImage.mockRejectedValue(new Error('decode'))

          await duplicate(WITH_PHOTO)

          expect(step()).toBe('picture')
          expect(notTakenOver().exists()).toBe(true)
          expect(data('photo').exists()).toBe(false)
        })

        describe('with nothing answered', () => {
          beforeEach(() => {
            server.query = vi.fn(() => answered(null, null))
          })

          it('has the words filled in all the same', async () => {
            await duplicate(WITH_PHOTO)
            await next()

            expect(nameField()).toBe('Sarah')
            expect(chosenLines()).toEqual([LINE])
            expect(wordsField()).toBe(OWN_WORDS)
            expect(amountField()).toBe('20')
          })

          it('says it until a photo is chosen anew, and not after', async () => {
            await duplicate(WITH_PHOTO)
            await data('motif-morning-light').trigger('click')
            expect(notTakenOver().exists()).toBe(true)
            await next()
            await historyGo(-1)
            expect(notTakenOver().exists()).toBe(true)

            await choosePhoto()

            expect(notTakenOver().exists()).toBe(false)
            expect(data('photo').attributes('aria-pressed')).toBe('true')
          })

          it('goes out with the motif that stands there where no photo is chosen anew', async () => {
            await duplicate(WITH_PHOTO)
            await next()
            await next()
            await data('finish').trigger('click')
            await settle()

            expect(server.mutate).toHaveBeenCalledTimes(1)
            expect(greetingSent()).toEqual({
              motif: 'heart-leaves',
              line: LINE,
              recipientName: 'Sarah',
            })
            expect(server.add).not.toHaveBeenCalled()
          })

          // The next greeting is one more of the greeting that was MADE, and that had a motif.
          it('says nothing of the photo any more in one more greeting after it', async () => {
            await duplicate(WITH_PHOTO)
            await next()
            await next()
            await data('finish').trigger('click')
            await settle()

            await data('another').trigger('click')
            await settle()
            await historyGo(-1)

            expect(step()).toBe('picture')
            expect(notTakenOver().exists()).toBe(false)
            expect(chosenMotifs()).toEqual(['Herz und Blätter'])
          })
        })
      })
    })

    describe('the history', () => {
      it('leads back to the picture, and from there to where the member came from', async () => {
        await duplicate()

        await historyGo(-1)
        expect(step()).toBe('picture')
        expect(router.currentRoute.value.path).toBe('/thank-you-greeting')

        await historyGo(-1)
        expect(router.currentRoute.value.path).toBe('/transactions')
        expect(wrapper.find('[data-test="transactions-page"]').exists()).toBe(true)
      })

      it('leads back with the arrow of the page as with the key of the device', async () => {
        await duplicate()

        // Jsdom walks its history a tick later than it is asked to.
        await data('back').trigger('click')
        await settle()
        await new Promise((resolve) => setTimeout(resolve, 20))
        await settle()

        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Blumenstrauß'])
      })

      it('comes to the words again with the forward key, everything still there', async () => {
        await duplicate()
        await data('name').setValue('Claude')
        await historyGo(-1)

        await historyGo(1)

        expect(step()).toBe('words')
        expect(nameField()).toBe('Claude')
        expect(chosenLines()).toEqual([LINE])
        expect(wordsField()).toBe(OWN_WORDS)
      })

      // Left for the list and come back with the forward key: the page is built anew, and
      // what was handed over was handed over once.
      it('starts empty where the page is come back to after it was left', async () => {
        await duplicate()
        await historyGo(-1)
        await historyGo(-1)
        expect(router.currentRoute.value.path).toBe('/transactions')

        await historyGo(1)
        await historyGo(1)

        // The entry of the words belongs to the visit that is over: back at the picture.
        expect(router.currentRoute.value.path).toBe('/thank-you-greeting')
        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Herz und Blätter'])
        await next()
        expect(nameField()).toBe('')
        expect(chosenLines()).toEqual([])
        expect(wordsField()).toBe('')
        expect(amountField()).toBe('')
      })

      // A reload builds the page anew at the address of the words.
      it('starts empty, at the picture, where the page is loaded anew', async () => {
        await duplicate()
        wrapper.unmount()

        await open('/thank-you-greeting?step=words')

        expect(step()).toBe('picture')
        await next()
        expect(nameField()).toBe('')
        expect(chosenLines()).toEqual([])
        expect(amountField()).toBe('')
      })
    })

    /**
     * ⛔ A new link, made once, by the member: `createTransactionLink` with what stands in the
     * fields. Nothing of the old link goes along -- no id, no code: the server makes a link as
     * it makes every link.
     */
    describe('making it', () => {
      const finish = async () => {
        await next()
        await data('finish').trigger('click')
        await settle()
      }

      it('makes nothing by opening', async () => {
        await duplicate()

        expect(server.mutate).not.toHaveBeenCalled()
      })

      it('makes a greeting of what stands there, in two taps', async () => {
        await duplicate()

        await finish()

        expect(server.mutate).toHaveBeenCalledTimes(1)
        expect(server.mutate.mock.calls[0]).toEqual([
          {
            amount: '20',
            memo: OLD.memo,
            greeting: { motif: 'bouquet', line: LINE, recipientName: 'Sarah' },
          },
        ])
        expect(step()).toBe('done')
        expect(wrapper.text()).toContain('Dein Dank-Gruß für Sarah ist fertig.')
      })

      it('makes it with what was changed: another name, other words, another amount, another picture', async () => {
        await duplicate()
        await data('name').setValue('Claude')
        await data('words-input').setValue('Lieber Claude, bis bald.')
        await wrapper.find('#amount-input-field').setValue('7,5')
        await historyGo(-1)
        await data('motif-giving-hands').trigger('click')
        await next()

        await finish()

        expect(server.mutate.mock.calls[0]).toEqual([
          {
            amount: '7.5',
            memo: `${LINE}\nLieber Claude, bis bald.`,
            greeting: { motif: 'giving-hands', line: LINE, recipientName: 'Claude' },
          },
        ])
      })

      it('makes one greeting for two taps on "Gruß fertigstellen"', async () => {
        await duplicate()
        await next()

        data('finish').trigger('click')
        data('finish').trigger('click')
        await settle()

        expect(server.mutate).toHaveBeenCalledTimes(1)
      })

      // As after every greeting: no way leads back to the button.
      it('leads to the list of links from the result, and makes no second one', async () => {
        await duplicate()
        await finish()

        await historyGo(-1)

        expect(router.currentRoute.value.path).toBe('/transactions')
        expect(server.mutate).toHaveBeenCalledTimes(1)
      })
    })

    /**
     * ⛔ What is handed over is an amount, a memo and the name of a third person. It stands in
     * the fields of this page and nowhere a browser keeps things.
     */
    describe('where it is kept', () => {
      const SECRETS = ['Sarah', 'Einfach so', 'iPad', 'bouquet', '815']

      it('names the step in the address, and nothing of the greeting', async () => {
        await duplicate()

        expect(router.currentRoute.value.fullPath).toBe('/thank-you-greeting?step=words')
        expect(window.location.href).toMatch(/\/thank-you-greeting\?step=words$/)
      })

      it('puts nothing of it into the history, the store or the storage of the device', async () => {
        await duplicate()
        await historyGo(-1)
        await historyGo(1)

        const kept = [
          JSON.stringify(window.history.state),
          JSON.stringify(wrapper.vm.$store.state),
          JSON.stringify({ ...localStorage }),
          JSON.stringify({ ...sessionStorage }),
        ].join(' ')
        for (const secret of SECRETS) expect(kept).not.toContain(secret)
        // The fixture proves itself: the page does hold it.
        expect(nameField()).toBe('Sarah')
      })
    })

    /** The handover belongs to the member who made it, and to this page's kind of link. */
    describe('whose it is', () => {
      // A session ran out, the tap led to the sign-in page, and another member signed in there.
      it('is empty for another member', async () => {
        await duplicate(OLD, 'uuid-dave')

        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Herz und Blätter'])
        await next()
        expect(nameField()).toBe('')
        expect(chosenLines()).toEqual([])
        expect(wordsField()).toBe('')
        expect(amountField()).toBe('')
      })

      // A sign-out between the tap and the page (store.js) leaves nothing to be found.
      it('is empty after a sign-out', async () => {
        handOver()
        clearLinkDraft()
        await open('/transactions')
        await router.push('/thank-you-greeting')
        await settle()

        expect(step()).toBe('picture')
        await next()
        expect(nameField()).toBe('')
      })

      it('does not take what a plain link handed over', async () => {
        await duplicate({ id: 7, amount: 12.5, memo: 'Danke fürs Rasenmähen!', greeting: null })

        expect(step()).toBe('picture')
        await next()
        expect(wordsField()).toBe('')
        expect(amountField()).toBe('')
      })
    })
  })
})
