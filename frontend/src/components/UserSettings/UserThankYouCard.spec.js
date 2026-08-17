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
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: routeQuery })),
}))

vi.mock('vuex', () => ({
  useStore: vi.fn(() => ({ state: { community: { name: 'Gradido Community' } } })),
}))

const mockDrawThankYouCard = vi.fn()
vi.mock('@/utils/thankYouCard', () => ({
  drawThankYouCard: (...args) => mockDrawThankYouCard(...args),
  thankYouCardFileName: (label) => `Dank-Karte ${label}.png`,
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

  const createWrapper = () =>
    mount(UserThankYouCard, {
      global: {
        mocks: {
          $t: (key, values) => (values ? `${key}:${JSON.stringify(values)}` : key),
          $d: (date) => `date(${date.toISOString().slice(0, 10)})`,
        },
        stubs: {
          BButton,
          BFormInput,
          // The dialog's own machinery is not what is under test here, and the real one
          // teleports its content out of the wrapper. This stub keeps the two things the
          // tests do care about: it shows its content only while open, and it closes.
          BModal: {
            props: ['modelValue'],
            template: '<div v-if="modelValue" class="modal-stub"><slot /></div>',
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
    routeQuery = {}
    onSettingsResult = undefined
    onCardsResult = undefined
    mockSaveSettings.mockResolvedValue({})
    mockSaveLimits.mockResolvedValue({})
    mockDisable.mockResolvedValue({})
    mockAddCard.mockResolvedValue({})
    mockBlockCard.mockResolvedValue({})
    mockRefetchSettings.mockResolvedValue({})
    mockRefetchCards.mockResolvedValue({})
    mockDrawThankYouCard.mockResolvedValue('data:image/png;base64,AAAA')
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

    it('saves the pin with the limits, then empties the field and closes', async () => {
      await mountWith()
      await buttonWith('thank-you-card.settings.change-pin').trigger('click')
      await field('new-pin').setValue('407312')
      await dialogButtonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockSaveSettings).toHaveBeenCalledWith({
        pin: '407312',
        maxPerPayment: 50,
        maxPerDay: 100,
      })
      expect(wrapper.find('.modal-stub').exists()).toBe(false)
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
        maxPerPayment: 50,
        maxPerDay: 100,
      })
    })
  })

  describe('the limits', () => {
    it('fills the fields from what the account has', async () => {
      await mountWith()

      expect(wrapper.find('#tyc-max-payment').element.value).toBe('50')
      expect(wrapper.find('#tyc-max-day').element.value).toBe('100')
    })

    it('saves them as numbers, with a comma accepted', async () => {
      await mountWith()
      await wrapper.find('#tyc-max-payment').setValue('12,50')
      await buttonWith('form.save').trigger('click')
      await flushPromises()

      expect(mockSaveLimits).toHaveBeenCalledWith({ maxPerPayment: 12.5, maxPerDay: 100 })
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

    it('blocks the card that works, by its own id', async () => {
      await mountWith()
      await buttonWith('thank-you-card.settings.block').trigger('click')
      await flushPromises()

      expect(mockBlockCard).toHaveBeenCalledWith({ cardId: ACTIVE_CARD.id })
    })

    // Blocked cards are kept rather than deleted, so an old card can still say what happened
    // to it instead of turning into an unknown code.
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
    it('draws it with the address a scanner will reach and saves it under the label', async () => {
      // ⚠️ Only for the anchor. A blanket mock also answers Vue's own createElement, and
      // the component stops rendering halfway through — with an error that names neither.
      const anchor = { href: '', download: '', click: vi.fn() }
      const realCreateElement = document.createElement.bind(document)
      const createElement = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tag) => (tag === 'a' ? anchor : realCreateElement(tag)))

      await mountWith()
      await buttonWith('thank-you-card.settings.print').trigger('click')
      await flushPromises()

      expect(mockDrawThankYouCard).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${window.location.origin}/dk/${ACTIVE_CARD.code}`,
          label: 'Portemonnaie',
        }),
      )
      expect(anchor.download).toBe('Dank-Karte Portemonnaie.png')
      expect(anchor.click).toHaveBeenCalled()
      createElement.mockRestore()
      expect(document.createElement('div').tagName).toBe('DIV')
    })

    it('says so instead of failing silently when the drawing goes wrong', async () => {
      mockDrawThankYouCard.mockRejectedValue(new Error('canvas'))
      await mountWith()
      await buttonWith('thank-you-card.settings.print').trigger('click')
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith('canvas')
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
