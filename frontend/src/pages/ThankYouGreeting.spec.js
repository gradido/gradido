// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { BFormGroup, BFormInput, BFormInvalidFeedback, BFormTextarea } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { createTransactionLink } from '@/graphql/mutations'
import ThankYouGreeting from './ThankYouGreeting.vue'

/**
 * Writing a thank-you greeting, with the wallet's own texts, its real router and the real
 * sheet: the steps are entries of the history, and what must hold is what a member can reach
 * with the arrow, the back key and the forward key -- not what a stub of the router would
 * agree to. Only the server is stood in for.
 */
const server = vi.hoisted(() => ({ documents: [], mutate: null }))
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document) => {
    server.documents.push(document)
    return { mutate: (...args) => server.mutate(...args) }
  },
}))

const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toast }))

const LINK = 'https://ki-playground.gradido.net/redeem/a3f9c2d41b7e19981fa0c4e2'
const VALID_UNTIL = '2026-10-16T12:00:00.000Z'

// What the server answers: the greeting as it was sent, with the link and the date.
const answerTo = (variables) => ({
  data: {
    createTransactionLink: {
      link: LINK,
      amount: variables.amount,
      memo: variables.memo,
      validUntil: VALID_UNTIL,
      greeting: variables.greeting,
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

describe('ThankYouGreeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
    server.documents = []
    server.mutate = vi.fn((variables) => Promise.resolve(answerTo(variables)))
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('the picture', () => {
    it('asks which picture, and shows the five motifs with their names', async () => {
      await open()

      expect(wrapper.text()).toContain('Welches Bild soll Dein Gruß tragen?')
      const tiles = wrapper.findAll('.tyg-motif')
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

    // Slice 5 and 6: no photo of one's own, no camera.
    it('offers nothing but the five motifs and the way on', async () => {
      await open()

      expect(wrapper.findAll('.tyg-motifs button')).toHaveLength(5)
      expect(wrapper.find('input[type="file"]').exists()).toBe(false)
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
      it('needs a line or words: with neither it says so and stays', async () => {
        await fill({ line: null, words: null })
        expect(data('memo-error').exists()).toBe(false)

        await next()

        expect(step()).toBe('words')
        expect(data('memo-error').text()).toBe(
          'Wähle eine erste Zeile oder schreib ein paar eigene Worte.',
        )
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

      it('goes on with a line alone, and with words alone', async () => {
        await fill({ words: null })
        await next()
        expect(step()).toBe('preview')

        await historyGo(-1)
        await data('line-just-so').trigger('click')
        await data('words-input').setValue('Ein paar eigene Worte')
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

      expect(server.documents).toEqual([createTransactionLink])
      expect(server.mutate).toHaveBeenCalledTimes(1)
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

    it('sends null for a missing name and a missing line, and the words alone as the memo', async () => {
      await open()
      await toPreview({ name: null, line: null, words: 'Nur ein paar Worte' })
      await data('finish').trigger('click')
      await settle()

      expect(server.mutate.mock.calls[0][0]).toEqual({
        amount: '20',
        memo: 'Nur ein paar Worte',
        greeting: { motif: 'heart-leaves', line: null, recipientName: null },
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

    // The forward key into the last look, after the words were emptied on the way back.
    it('does not show the last look for a form that no longer holds', async () => {
      await open()
      await toPreview({ words: null })
      await historyGo(-1)
      await data('line-just-so').trigger('click')

      await historyGo(1)

      expect(step()).toBe('words')
      expect(data('memo-error').exists()).toBe(true)
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
})
