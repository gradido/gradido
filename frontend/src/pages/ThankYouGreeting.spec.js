// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { BFormGroup, BFormInput, BFormInvalidFeedback, BFormTextarea } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { forgetAllGreetingPictures, greetingPicture } from '@/composables/useGreetingPictures'
import { clearLinkDraft, useLinkDraft } from '@/composables/useLinkDraft'
import { addThankYouGreetingPicture, createTransactionLink } from '@/graphql/mutations'
import { THANK_YOU_PICTURE_GROUND } from '@/utils/thankYouPicture'
import ThankYouGreeting from './ThankYouGreeting.vue'

/**
 * Writing a thank-you greeting, with the wallet's own texts, its real router and the real
 * sheet: the steps are entries of the history, and what must hold is what a member can reach
 * with the arrow, the back key and the forward key -- not what a stub of the router would
 * agree to. Only the server is stood in for.
 */
const server = vi.hoisted(() => ({ documents: [], mutate: null, add: null }))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => {
    server.documents.push(document)
    // `mutate` makes the link; `add` takes the large rendition of a photo afterwards.
    return {
      mutate: (...args) =>
        document === addThankYouGreetingPicture ? server.add(...args) : server.mutate(...args),
    }
  },
  // "Fertig" offers the greeting on paper (useThankYouGreetingSheet). That asks for the client
  // only where the server has to be asked for a photo -- which a page that made the photo
  // itself never is: a client that is looked at here throws.
  useApolloClient: () => ({
    get client() {
      throw new Error('"Fertig" asked the server for a photo it holds itself')
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
const SMALL = { data: 'SMALL-JPEG', width: 831, height: 577, bytes: 30000 }
const LARGE = { data: 'LARGE-JPEG', width: 1080, height: 750, bytes: 66000 }

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
          src: 'data:image/jpeg;base64,SMALL-JPEG',
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
            picture: { data: 'SMALL-JPEG', width: 831, height: 577 },
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
          picture: { data: 'LARGE-JPEG', width: 1080, height: 750 },
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
          picture: { data: 'SMALL-JPEG', width: 831, height: 577 },
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
     * The old greeting carried a photo of the member's own. It does not come along: the page
     * opens at the picture, the first motif is the choice, and a sentence says so.
     */
    describe('one that carried a photo', () => {
      const WITH_PHOTO = old({ motif: null, hasPicture: true })

      it('opens at the picture, the first motif chosen, and says that the photo did not come along', async () => {
        await duplicate(WITH_PHOTO)

        expect(step()).toBe('picture')
        expect(chosenMotifs()).toEqual(['Herz und Blätter'])
        expect(notTakenOver().text()).toBe(
          'Das Foto ließ sich nicht übernehmen. Wähle es neu aus oder nimm ein Motiv.',
        )
        // The tile of the photo is empty: it is chosen anew there.
        expect(data('photo-choose').exists()).toBe(true)
        expect(data('photo').exists()).toBe(false)
      })

      // (A client that is looked at throws: see the stand-in for Apollo above.)
      it('asks the server for nothing', async () => {
        await duplicate(WITH_PHOTO)

        expect(server.mutate).not.toHaveBeenCalled()
        expect(server.add).not.toHaveBeenCalled()
        expect(greetingPicture(OLD.id)).toBeNull()
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
        expect(server.mutate.mock.calls[0][0].greeting).toEqual({
          motif: 'heart-leaves',
          line: LINE,
          recipientName: 'Sarah',
        })
        expect(server.add).not.toHaveBeenCalled()
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
