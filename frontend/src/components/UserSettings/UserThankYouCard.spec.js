// AI-GENERATED — not an architecture reference
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { BButton, BFormInput } from 'bootstrap-vue-next'
import UserThankYouCard from './UserThankYouCard.vue'

/**
 * "Mit Karte danken" in the settings: the PIN, the limits, and the card itself.
 *
 * ⛔ Everything here writes to somebody's own account, and two of the buttons are one click
 * away from being irreversible-ish — blocking a card, and switching card payment off, which
 * deletes the PIN. So the tests are written against what must NOT happen as much as against
 * what must: no blocking without a card id, no silent raw key in a toast, no limit that
 * quietly becomes zero.
 */

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({ toastError: mockToastError, toastSuccess: mockToastSuccess })),
}))

/**
 * ⚠️ Prefixed on purpose. With `t` returning the key unchanged, a raw key handed to a toast
 * and a translated one are the SAME STRING, and the test could not tell them apart — which
 * is exactly the mistake this component already had once (a toast that showed
 * `thank-you-card.settings.saved` to the user).
 */
const translate = (key) => `translated:${key}`
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({ t: (key) => `translated:${key}` })),
}))

let routeQuery = {}
const mockRouterReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: routeQuery })),
  useRouter: vi.fn(() => ({ replace: mockRouterReplace })),
}))

vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({ state: { community: { name: 'Gradido Community' } } })),
}))

const mockPrintThankYouCardSheet = vi.fn()
vi.mock('@/utils/thankYouCard', () => ({
  printThankYouCardSheet: (...args) => mockPrintThankYouCardSheet(...args),
}))

vi.mock('@/config', () => ({ default: { COMMUNITY_NAME: 'Gradido Community' } }))

// The two queries hand their answers over through onResult, so the test keeps the callbacks
// and plays the account's state back through them — the same way the server would.
let onSettingsResult
let onCardsResult
const mockRefetchSettings = vi.fn()
const mockRefetchCards = vi.fn()

const mockSaveSettings = vi.fn()
const mockSaveLimits = vi.fn()
const mockDisable = vi.fn()
const mockAddCard = vi.fn()
const mockBlockCard = vi.fn()
const mockUnblockCard = vi.fn()

/**
 * ⛔ Matched in full and loud when it matches nothing. A substring rule with a fallback would
 * send a renamed operation to the WRONG mock, and the tests would keep passing while
 * asserting about a call the component never made.
 */
const MUTATIONS = {
  setThankYouCardSettings: () => mockSaveSettings,
  setThankYouCardLimits: () => mockSaveLimits,
  deleteThankYouCardSettings: () => mockDisable,
  createThankYouCard: () => mockAddCard,
  blockThankYouCard: () => mockBlockCard,
  unblockThankYouCard: () => mockUnblockCard,
}

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document) => {
    const name = document?.definitions?.[0]?.name?.value ?? ''
    if (name === 'thankYouCardSettings') {
      return {
        refetch: mockRefetchSettings,
        onResult: (callback) => {
          onSettingsResult = callback
        },
      }
    }
    if (name === 'thankYouCards') {
      return {
        refetch: mockRefetchCards,
        onResult: (callback) => {
          onCardsResult = callback
        },
      }
    }
    throw new Error(`this spec has no query mock for "${name}"`)
  }),
  useMutation: vi.fn((document) => {
    const name = document?.definitions?.[0]?.name?.value ?? ''
    const mock = MUTATIONS[name]
    if (!mock) {
      throw new Error(`this spec has no mutation mock for "${name}"`)
    }
    return { mutate: (variables) => mock()(variables) }
  }),
}))

const SETTINGS = { maxPerPayment: 50, maxPerDay: 100 }
const ACTIVE_CARD = { id: 7, label: 'Portemonnaie', code: 'DK-abc123', blockedAt: null }
const BLOCKED_CARD = {
  id: 3,
  label: 'Alte Karte',
  code: 'DK-old',
  blockedAt: '2026-08-01T10:00:00Z',
}

describe('UserThankYouCard', () => {
  let wrapper
  /**
   * ⚠️ Vue catches what a click handler throws and logs it, so a test that only looks at
   * the mutations passes whether the handler worked or threw. Everything thrown lands here
   * instead, and the tests that care can look.
   */
  let handlerErrors

  const createWrapper = () =>
    mount(UserThankYouCard, {
      global: {
        config: {
          errorHandler: (error) => {
            handlerErrors.push(error)
          },
        },
        mocks: {
          $t: (key, values) => (values ? `${key}:${JSON.stringify(values)}` : key),
          $d: (date) => `date(${date.toISOString().slice(0, 10)})`,
        },
        stubs: {
          BButton,
          BFormInput,
          // The dialog's own machinery is not what is under test here, and the real one
          // teleports its content out of the wrapper. This stub keeps what the tests do
          // care about: it shows its content only while open, and it carries the FOOTER
          // buttons, because that is where the save button lives.
          //
          // ⚠️ The emitted payload has a `preventDefault`, and that is not decoration: the
          // page writes `@ok.prevent`, which Vue compiles into a call on this object. A
          // bare payload would throw here — and a stub that cannot take `.prevent` cannot
          // test a dialog whose whole point is that it does not close itself.
          BModal: {
            props: ['modelValue', 'okTitle', 'cancelTitle', 'okDisabled', 'cancelDisabled', 'busy'],
            computed: {
              // Exactly how the library computes them (`disableCancel = cancelDisabled ||
              // busy`, `disableOk = okDisabled || busy`). Modelled rather than simplified:
              // the page passes only `busy`, so a stub that read `okDisabled` alone would
              // report both buttons live and quietly stop testing the guard.
              disableOk() {
                return Boolean(this.okDisabled || this.busy)
              },
              disableCancel() {
                return Boolean(this.cancelDisabled || this.busy)
              },
            },
            emits: ['ok', 'cancel', 'hide', 'update:modelValue'],
            methods: {
              // Cancel is the whole chain the real one runs: it announces itself, announces
              // that the dialog is going, and then goes. A stub that only emitted `cancel`
              // would leave the dialog standing and quietly turn every test about closing
              // into a test about nothing.
              onCancel() {
                this.$emit('cancel', { preventDefault() {} })
                this.$emit('hide', { preventDefault() {} })
                this.$emit('update:modelValue', false)
              },
              /**
               * ⛔ OK closes UNLESS the listener prevents it, which is what the real one
               * does — and modelling that is the whole point of this stub.
               *
               * A stub that simply never closed on OK looked right (the page does prevent
               * it) and measured nothing: removing `.prevent` from the page left all
               * thirty-six tests green. The behaviour under test is a CONDITION, so the
               * stub has to carry the condition, not the outcome the page happens to pick.
               */
              onOk() {
                const event = {
                  defaultPrevented: false,
                  preventDefault() {
                    this.defaultPrevented = true
                  },
                }
                this.$emit('ok', event)
                if (!event.defaultPrevented) {
                  this.$emit('hide', { preventDefault() {} })
                  this.$emit('update:modelValue', false)
                }
              },
            },
            template:
              '<div v-if="modelValue" class="modal-stub"><slot />' +
              '<button data-test="thank-you-card-dialog-cancel" :disabled="disableCancel"' +
              ' @click="onCancel">{{ cancelTitle }}</button>' +
              '<button data-test="thank-you-card-dialog-ok" :disabled="disableOk"' +
              ' @click="onOk">{{ okTitle }}</button>' +
              '</div>',
          },
          // AppModal teleports to body, so its content would leave the wrapper. The stub
          // keeps the two things the tests care about: it shows while open, and its ok
          // button is reachable.
          AppModal: {
            props: ['modelValue', 'title', 'okOnly'],
            emits: ['update:modelValue', 'on-ok'],
            template:
              '<div v-if="modelValue" class="app-modal-stub"><slot />' +
              '<button data-test="app-modal-ok" @click="$emit(\'on-ok\')">ok</button></div>',
          },
        },
      },
    })

  /** Card payment is on, with the settings and cards the account has. */
  const mountWith = async ({ settings = SETTINGS, cards = [ACTIVE_CARD] } = {}) => {
    wrapper = createWrapper()
    await nextTick()
    onSettingsResult({ data: { thankYouCardSettings: settings } })
    onCardsResult({ data: { thankYouCards: cards } })
    await flushPromises()
    return wrapper
  }

  const field = (name) => wrapper.find(`[data-test="thank-you-card-${name}"]`)
  const buttonWith = (text) =>
    wrapper.findAll('button').find((button) => button.text().includes(text))

  /**
   * ⚠️ The dialog has a save button and so does the panel behind it, with the same wording.
   * Looking for the text alone finds the panel's one and saves the LIMITS while the test
   * believes it is saving a PIN — green, and about the wrong call.
   */
  const dialogButtonWith = (text) =>
    wrapper
      .find('.modal-stub')
      .findAll('button')
      .find((button) => button.text().includes(text))

  beforeEach(() => {
    vi.clearAllMocks()
    handlerErrors = []
    routeQuery = {}
    onSettingsResult = undefined
    onCardsResult = undefined
    mockSaveSettings.mockResolvedValue({})
    mockSaveLimits.mockResolvedValue({})
    mockDisable.mockResolvedValue({})
    mockAddCard.mockResolvedValue({})
    mockBlockCard.mockResolvedValue({})
    mockUnblockCard.mockResolvedValue({})
    mockRefetchSettings.mockResolvedValue({})
    mockRefetchCards.mockResolvedValue({})
    mockPrintThankYouCardSheet.mockResolvedValue('data:image/png;base64,AAAA')
  })

  afterEach(() => {
    wrapper?.unmount()
    // A spy that survives its own test breaks the next one somewhere else entirely.
    vi.restoreAllMocks()
  })

  describe('switched off', () => {
    it('explains the feature and offers to switch it on', async () => {
      await mountWith({ settings: null, cards: [] })

      expect(field('off').exists()).toBe(true)
      expect(field('on').exists()).toBe(false)
      expect(wrapper.text()).toContain('thank-you-card.settings.explain-pin')
    })

    // The switch IS the PIN, so switching on must not be possible without setting one.
    it('opens the pin dialog rather than switching anything on by itself', async () => {
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')

      expect(field('new-pin').exists()).toBe(true)
      expect(mockSaveSettings).not.toHaveBeenCalled()
    })
  })

  describe('the pin', () => {
    it('carries a name and its rules for a screen reader', async () => {
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')

      const pin = field('new-pin')
      expect(pin.attributes('aria-label')).toBe('thank-you-card.settings.pin-title')
      expect(pin.attributes('aria-describedby')).toBe('thank-you-card-pin-rules')
      expect(wrapper.find('#thank-you-card-pin-rules').exists()).toBe(true)
    })

    // ⛔ Hidden first, readable on request. A PIN is set once and there is no "forgot it":
    // a typo here is a card that cannot pay, with nothing saying why. The eye is the only
    // chance to check — and it must not be the default, because "at home" is also a kitchen
    // table with somebody sitting across it.
    it('hides the pin until somebody asks to see it', async () => {
      vi.stubGlobal('CSS', { supports: () => true })
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')

      expect(field('new-pin').classes()).toContain('pin-masked')

      await field('pin-eye').trigger('click')
      expect(field('new-pin').classes()).not.toContain('pin-masked')

      await field('pin-eye').trigger('click')
      expect(field('new-pin').classes()).toContain('pin-masked')
      vi.unstubAllGlobals()
    })

    // ⛔ And it must not be a password field, or the browser fills the saved site password in
    // and offers to overwrite it with the PIN — at the very screen where the PIN is set.
    it('is a text field the browser has no reason to touch', async () => {
      vi.stubGlobal('CSS', { supports: () => true })
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')

      expect(field('new-pin').attributes('type')).toBe('text')
      expect(field('new-pin').attributes('autocomplete')).toBe('off')
      vi.unstubAllGlobals()
    })

    it('falls back to a password field where nothing can hide a text one', async () => {
      vi.stubGlobal('CSS', { supports: () => false })
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')

      expect(field('new-pin').attributes('type')).toBe('password')
      vi.unstubAllGlobals()
    })

    it('says which way the eye will go, for somebody who cannot see it', async () => {
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')

      expect(field('pin-eye').attributes('aria-label')).toBe('thank-you-card.settings.pin-show')
      await field('pin-eye').trigger('click')
      expect(field('pin-eye').attributes('aria-label')).toBe('thank-you-card.settings.pin-hide')
    })

    it('saves the pin with the limits, then empties the field and closes', async () => {
      await mountWith()
      await buttonWith('thank-you-card.settings.change-pin').trigger('click')
      await field('new-pin').setValue('407312')
      await dialogButtonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockSaveSettings).toHaveBeenCalledWith({
        pin: '407312',
        maxPerPayment: '50',
        maxPerDay: '100',
      })
      expect(wrapper.find('.modal-stub').exists()).toBe(false)
    })

    /**
     * ⛔ The half the dialog's own footer would get wrong on its own. A BModal closes when
     * its OK is pressed; here it must not, because the PIN may come back refused and the
     * message about it would land on a screen that no longer shows the field it is about --
     * with the six digits gone, so there is nothing to correct either.
     *
     * That is what `@ok.prevent` buys, and it is one dropped modifier away from being lost
     * silently: the happy path above stays green either way.
     */
    it('keeps the dialog standing when the server refuses the pin', async () => {
      mockSaveSettings.mockRejectedValue(new Error('pin too easy'))
      await mountWith()
      await buttonWith('thank-you-card.settings.change-pin').trigger('click')
      await field('new-pin').setValue('407312')
      await dialogButtonWith('form.save').trigger('click')
      await flushPromises()

      expect(wrapper.find('.modal-stub').exists()).toBe(true)
      expect(field('new-pin').element.value).toBe('407312')
    })

    /**
     * ⛔ While the PIN is on its way, NEITHER button may be pressed — which is why the page
     * passes `busy` rather than `ok-disabled`: the library derives both from it. With only
     * OK guarded, Cancel stayed live during the save, and pressing it shut the dialog on a
     * request that was still running.
     *
     * (Deliberately not sealed any further: the x, Escape and the backdrop still work. A
     * request that hangs must not leave anybody locked in a box with two dead buttons.)
     */
    it('takes both buttons out of reach while the pin is on its way', async () => {
      let finish
      mockSaveSettings.mockReturnValue(new Promise((resolve) => (finish = resolve)))
      await mountWith()
      await buttonWith('thank-you-card.settings.change-pin').trigger('click')
      await field('new-pin').setValue('407312')
      await dialogButtonWith('form.save').trigger('click')
      await nextTick()

      expect(field('dialog-ok').attributes('disabled')).toBeDefined()
      expect(field('dialog-cancel').attributes('disabled')).toBeDefined()

      finish({})
      await flushPromises()
    })

    // Backing out has to leave nothing behind: until this dialog had a Cancel at all, the
    // only way out was the little x, and a half-typed PIN sat there until the next visit.
    it('forgets a half-typed pin when the dialog is closed again', async () => {
      await mountWith()
      await buttonWith('thank-you-card.settings.change-pin').trigger('click')
      await field('new-pin').setValue('4073')
      await field('dialog-cancel').trigger('click')
      await flushPromises()
      await buttonWith('thank-you-card.settings.change-pin').trigger('click')

      expect(field('new-pin').element.value).toBe('')
    })

    // ⛔ Without the fallbacks an empty field would send 0, and a limit of zero is a card
    // that cannot pay anything - switched on, and useless, with nothing saying why.
    it('falls back to a usable pair of limits when the fields are empty', async () => {
      await mountWith({ settings: null, cards: [] })
      await field('enable').trigger('click')
      await field('new-pin').setValue('407312')
      await dialogButtonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockSaveSettings).toHaveBeenCalledWith({
        pin: '407312',
        maxPerPayment: '50',
        maxPerDay: '100',
      })
    })
  })

  describe('the limits', () => {
    it('fills the fields from what the account has', async () => {
      await mountWith()

      expect(wrapper.find('#tyc-max-payment').element.value).toBe('50')
      expect(wrapper.find('#tyc-max-day').element.value).toBe('100')
    })

    // ⛔ As STRINGS. The GradidoUnit scalar refuses a number during variable coercion, and
    // that comes back as a bare HTTP 400 with no GraphQL error in it — which is exactly how
    // this component shipped broken: a mocked Apollo takes a number without complaining, so
    // no test in this file could see it. The type assertion is what closes that.
    it('saves the limits as strings, with a comma turned into a dot', async () => {
      await mountWith()
      await wrapper.find('#tyc-max-payment').setValue('12,50')
      await buttonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockSaveLimits).toHaveBeenCalledWith({ maxPerPayment: '12.5', maxPerDay: '100' })
      const sent = mockSaveLimits.mock.calls[0][0]
      expect(typeof sent.maxPerPayment).toBe('string')
      expect(typeof sent.maxPerDay).toBe('string')
    })

    // ⛔ The regression from 1e72c95c3: this one call site handed the toast a raw key while
    // the four next to it translated theirs, so the message read
    // "thank-you-card.settings.saved" to the person who had just saved.
    it('says so in words a person can read, not with the key', async () => {
      await mountWith()
      await buttonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockToastSuccess).toHaveBeenCalledWith(translate('thank-you-card.settings.saved'))
    })

    it('reads the account again after saving, so the screen cannot drift from it', async () => {
      await mountWith()
      await buttonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockRefetchSettings).toHaveBeenCalled()
      expect(mockRefetchCards).toHaveBeenCalled()
    })
  })

  describe('the card', () => {
    it('offers to print and to block the card that works', async () => {
      await mountWith()

      expect(field('active').exists()).toBe(true)
      expect(wrapper.find('#tyc-label').element.value).toBe('Portemonnaie')
    })

    it('creates a card under the label that was typed', async () => {
      await mountWith({ cards: [] })
      await wrapper.find('#tyc-new-label').setValue('Portemonnaie')
      await field('create').trigger('click')
      await flushPromises()

      expect(mockAddCard).toHaveBeenCalledWith({ label: 'Portemonnaie' })
    })

    it('refuses to create one without a label', async () => {
      await mountWith({ cards: [] })

      expect(field('create').attributes('disabled')).toBeDefined()
    })

    // ⛔ Asked first. One click used to end a printed card, and the button then disappeared
    // into a list with nothing to press.
    it('asks before blocking, and does nothing until the question is answered', async () => {
      await mountWith()
      await field('block').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-test="thank-you-card-block-confirm"]').exists()).toBe(true)
      expect(mockBlockCard).not.toHaveBeenCalled()
    })

    it('blocks the card that works, by its own id, once it is confirmed', async () => {
      await mountWith()
      await field('block').trigger('click')
      await wrapper.find('[data-test="app-modal-ok"]').trigger('click')
      await flushPromises()

      expect(mockBlockCard).toHaveBeenCalledWith({ cardId: ACTIVE_CARD.id })
    })

    // ⛔ The way back, which did not exist: the mutation was always there, the button was not.
    it('unblocks an earlier card when no card of theirs works', async () => {
      await mountWith({ cards: [BLOCKED_CARD] })
      await field(`unblock-${BLOCKED_CARD.id}`).trigger('click')
      await flushPromises()

      expect(mockUnblockCard).toHaveBeenCalledWith({ cardId: BLOCKED_CARD.id })
    })

    // The server refuses it anyway - one member, one card that pays - so the button says so
    // by being unavailable rather than by letting somebody press it into an error.
    it('does not offer to unblock while another card works', async () => {
      await mountWith({ cards: [ACTIVE_CARD, BLOCKED_CARD] })

      expect(field(`unblock-${BLOCKED_CARD.id}`).attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toContain('thank-you-card.settings.unblock-needs-no-active')
    })

    // Blocked cards are kept rather than deleted, so an old card can still say what happened
    // to it instead of turning into an unknown code.
    // The dialogue can outlive the card it asks about: every action here reloads the list,
    // and the receipt's own link can block it while the question is on screen. Without the
    // guard the click throws and the dialogue closes as if it had worked.
    it('does nothing when the card is gone by the time the question is answered', async () => {
      await mountWith()
      await field('block').trigger('click')

      onCardsResult({ data: { thankYouCards: [BLOCKED_CARD] } })
      await flushPromises()
      await wrapper.find('[data-test="app-modal-ok"]').trigger('click')
      await flushPromises()

      // ⛔ Both halves. Without the guard nothing is blocked EITHER — because the handler
      // throws on the way, which Vue swallows. Only the second assertion tells the two
      // apart, and the first alone would have been green for the wrong reason.
      expect(mockBlockCard).not.toHaveBeenCalled()
      expect(handlerErrors).toHaveLength(0)
    })

    it('keeps the earlier cards visible with the day they were blocked', async () => {
      await mountWith({ cards: [ACTIVE_CARD, BLOCKED_CARD] })

      expect(wrapper.text()).toContain('Alte Karte')
      expect(wrapper.text()).toContain('date(2026-08-01)')
    })

    it('treats a card without a blocked moment as the one that works', async () => {
      await mountWith({ cards: [BLOCKED_CARD, ACTIVE_CARD] })

      expect(wrapper.find('#tyc-label').element.value).toBe('Portemonnaie')
    })
  })

  describe('the block link out of the receipt', () => {
    // ⛔ The receipt mail links here with ?block=<id>. It is the whole reason the receipt is
    // part of the security model rather than a courtesy: noticing and blocking is what turns
    // a daily cap into a cap for good.
    it('blocks the card the receipt points at, without anybody pressing anything', async () => {
      routeQuery = { block: '7' }
      await mountWith()

      expect(mockBlockCard).toHaveBeenCalledWith({ cardId: 7 })
    })

    // ⛔ An instruction, not a description of the page — so it must not survive being acted
    // on. Left standing it fires again on every reload and every visit through the history,
    // and after the card has been deliberately unblocked a reload would block it a second
    // time, with nothing on the screen connecting the two.
    it('takes the wish out of the address once it has been acted on', async () => {
      routeQuery = { block: '7' }
      await mountWith()

      expect(mockRouterReplace).toHaveBeenCalledWith({ query: {} })
    })

    it('leaves the address alone when there was no wish in it', async () => {
      routeQuery = {}
      await mountWith()

      expect(mockRouterReplace).not.toHaveBeenCalled()
    })

    it('blocks nothing when the address carries no such wish', async () => {
      routeQuery = {}
      await mountWith()

      expect(mockBlockCard).not.toHaveBeenCalled()
    })

    // A query string is whatever somebody typed, so it reaches this having been checked for
    // nothing at all.
    it('blocks nothing for a wish that is not a card id', async () => {
      routeQuery = { block: 'abc' }
      await mountWith()

      expect(mockBlockCard).not.toHaveBeenCalled()

      routeQuery = { block: '0' }
      wrapper.unmount()
      await mountWith()

      expect(mockBlockCard).not.toHaveBeenCalled()
    })
  })

  describe('printing the card', () => {
    /**
     * ⛔ The download button is GONE, and this is what keeps it gone. It handed over a PNG
     * whose physical size nothing states -- right for a business card somebody takes to a
     * print shop, wrong for a thank-you card, which is one card for one person printed at
     * home. (Bernd, 21.08.2026)
     *
     * Absence AND presence in one test on purpose: an "it is not there" alone stays green
     * if the whole block dies, so the sheet has to still be standing beside it.
     */
    it('offers the sheet and no second way that loses the size', async () => {
      await mountWith()

      expect(field('sheet').exists()).toBe(true)
      expect(wrapper.text()).not.toContain(translate('thank-you-card.settings.print'))
    })

    // ⛔ The sheet is what carries the physical size. The PNG deliberately states none — so
    // without this way out there is no way to get a card at 54 x 85.6 mm at all, which is
    // exactly the hole it was built to close.
    it('offers a sheet, and draws it from the same card', async () => {
      await mountWith()
      await field('sheet').trigger('click')
      await flushPromises()

      expect(mockPrintThankYouCardSheet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${window.location.origin}/dk/${ACTIVE_CARD.code}`,
          label: 'Portemonnaie',
        }),
      )
    })

    it('says so instead of failing silently when the sheet cannot be printed', async () => {
      mockPrintThankYouCardSheet.mockRejectedValue(new Error('no printer'))
      await mountWith()
      await field('sheet').trigger('click')
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith('no printer')
    })
  })

  describe('switching it off', () => {
    it('deletes the settings, which is what taking the pin away means', async () => {
      await mountWith()
      await buttonWith('thank-you-card.settings.disable').trigger('click')
      await flushPromises()

      expect(mockDisable).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalledWith(translate('thank-you-card.settings.disabled'))
    })
  })

  describe('when the server refuses', () => {
    it('says what happened and lets the buttons work again', async () => {
      mockSaveLimits.mockRejectedValue(new Error('network'))
      await mountWith()
      await buttonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith('network')
      expect(mockToastSuccess).not.toHaveBeenCalled()
      expect(buttonWith('form.save').attributes('disabled')).toBeUndefined()
    })
  })
})
