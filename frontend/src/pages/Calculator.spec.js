// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import Calculator from './Calculator.vue'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

/**
 * The calculator page.
 *
 * ⛔ Mounted with the REAL language files rather than a handful of invented keys: half of
 * what this page shows is a number drawn through `$n`, and the point of the whole exercise
 * is that it comes out in the language's own notation. A stubbed formatter would assert
 * about our own mock instead of about the wallet's number formats.
 */

const state = { gradidoID: 'user-one' }
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

/**
 * The page's own back arrow. `historyState.back` is what vue-router remembers about where
 * we came from -- null on a deep link, and that difference is the whole test.
 */
const historyState = { back: null }
const mockRouter = {
  back: vi.fn(),
  push: vi.fn(),
  options: { history: { state: historyState } },
}
vi.mock('vue-router', () => ({ useRouter: () => mockRouter }))

const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: toastSuccessMock, toastError: toastErrorMock }),
}))

/** What the copy buttons hand to the clipboard -- jsdom brings no clipboard of its own. */
const writeTextMock = vi.fn(() => Promise.resolve())

/**
 * The house way of testing a modal (see `AliasFirstChoice.spec.js`): a stub that renders its
 * slot when it is open. The real one teleports, and a teleported panel is not inside the
 * wrapper -- so a field in it can neither be found nor filled in.
 *
 * The stub also offers the OK button, because closing is where the typed values are kept.
 */
vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot></slot></button>',
  },
  BFormInput: {
    props: ['modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
  },
  BFormCheckbox: {
    props: ['modelValue'],
    template:
      '<input type="checkbox" :checked="modelValue" @change="$emit(`update:modelValue`, $event.target.checked)" />',
  },
  BModal: {
    props: ['modelValue'],
    emits: ['ok', 'hidden'],
    template:
      '<div v-if="modelValue"><slot></slot><button class="modal-ok" @click="$emit(`ok`)">ok</button></div>',
  },
}))

const DECIMAL = {
  decimal: { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 },
  // What the copy buttons write: the same two decimals, but NEVER grouped -- see the page.
  ungroupedDecimal: {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  },
}

/**
 * ⛔ Every mounted page is kept and taken down again afterwards. The page registers
 * `storage` and `visibilitychange` on the WINDOW and lets go of them in `onUnmounted`, so a
 * page that is never unmounted keeps listening: the two event tests further down would
 * otherwise reach the handlers of every instance left over from an earlier test, and one of
 * those could answer instead of the one under test.
 */
const mounted = []
const mountCalculator = (locale = 'de') => {
  const wrapper = mount(Calculator, {
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale,
          messages: { de, en },
          numberFormats: { de: DECIMAL, en: DECIMAL },
        }),
      ],
      stubs: ['IMdiSettings'],
    },
  })
  mounted.push(wrapper)
  return wrapper
}

const key = (wrapper, name) => wrapper.find(`[data-test="calculator-${name}"]`)
const press = async (wrapper, ...names) => {
  for (const name of names) {
    await key(wrapper, name).trigger('click')
  }
}

describe('Calculator page', () => {
  beforeEach(() => {
    state.gradidoID = 'user-one'
    historyState.back = null
    mockRouter.back.mockClear()
    mockRouter.push.mockClear()
    writeTextMock.mockClear()
    writeTextMock.mockImplementation(() => Promise.resolve())
    toastSuccessMock.mockClear()
    toastErrorMock.mockClear()
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    while (mounted.length) {
      mounted.pop().unmount()
    }
    // ⚠️ Here rather than at the end of the test that sets them: a failing assertion above
    // would skip that line and leave a fake clock running for everything after it.
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('the keypad', () => {
    it('has all twenty keys', () => {
      expect(mountCalculator().findAll('.key')).toHaveLength(20)
    })

    it('carries the separator of the interface language', () => {
      expect(key(mountCalculator('de'), 'separator').text()).toBe(',')
      expect(key(mountCalculator('en'), 'separator').text()).toBe('.')
    })

    it('adds up and shows both sums', async () => {
      const wrapper = mountCalculator('de')
      // 4,50 + 3,20 + 2,80 -- the basket from the plan
      await press(wrapper, 'digit-4', 'separator', 'digit-5', 'digit-0', 'operator-plus')
      await press(wrapper, 'digit-3', 'separator', 'digit-2', 'digit-0', 'operator-plus')
      await press(wrapper, 'digit-2', 'separator', 'digit-8', 'digit-0', 'equals')

      expect(key(wrapper, 'display').text()).toBe('10,50')
      expect(key(wrapper, 'sub-gdd').text()).toContain('10,50')
    })

    it('clears everything on AC', async () => {
      const wrapper = mountCalculator()
      await press(wrapper, 'digit-5', 'equals')
      expect(key(wrapper, 'sub').text()).not.toBe('')
      await press(wrapper, 'ac')
      expect(key(wrapper, 'display').text()).toBe('')
      expect(key(wrapper, 'sub').text()).toBe('')
    })

    it('converts DankBar to Gradido', async () => {
      const wrapper = mountCalculator()
      await press(wrapper, 'digit-1', 'digit-0', 'digit-0', 'dankbar')
      expect(key(wrapper, 'sub-dankbar').text()).toContain('DankBar')
    })
  })

  /**
   * ⛔ Switching the DankBar off must leave a BLANK, not a gap: with the grid reflowed every
   * key below would move under the finger of somebody who has used this till for weeks. And
   * the blank must not be clickable -- a dead button that looks like one is worse than none.
   */
  describe('with the DankBar switched off', () => {
    beforeEach(() => {
      window.localStorage.setItem(
        'calculator-prefs:user-one',
        JSON.stringify({ showDankBar: false }),
      )
    })

    it('keeps the keypad at twenty places', () => {
      expect(mountCalculator().findAll('.key')).toHaveLength(20)
    })

    it('leaves an unreachable blank where the key was', () => {
      const wrapper = mountCalculator()
      expect(key(wrapper, 'dankbar').exists()).toBe(false)
      expect(wrapper.find('.key-blank').exists()).toBe(true)
      expect(wrapper.find('.key-blank').element.tagName).not.toBe('BUTTON')
    })
  })

  describe('handing an amount to a card', () => {
    it('offers nothing before there is a result', () => {
      expect(key(mountCalculator(), 'park').attributes('disabled')).toBeDefined()
    })

    it('parks the Gradido side, not the total', async () => {
      window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ percent: 60 }))
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-1', 'digit-0', 'separator', 'digit-5', 'digit-0', 'equals')
      await press(wrapper, 'park')

      const stored = JSON.parse(window.localStorage.getItem('calculator-parked-amount:user-one'))
      expect(stored.amount).toBe(6.3)
      expect(key(wrapper, 'parked').text()).toContain('6,30')
    })

    /**
     * "With thank-you card" is ONE act since the wallet has its own scanner (Bernd,
     * 21.08.2026): park the amount AND open the camera. The write comes first — it is
     * the net under the act if the camera says no or the scan is interrupted.
     */
    it('opens the wallet scanner in the same act', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'equals', 'park')

      expect(window.localStorage.getItem('calculator-parked-amount:user-one')).not.toBeNull()
      expect(mockRouter.push).toHaveBeenCalledWith('/scan')
    })

    /**
     * ★ The navigation UNMOUNTS this page — the router mock here cannot show that, so
     * the round trip is played by hand: park, unmount, mount again. The WHOLE basket
     * comes back (Bernd, 21.08.2026): the display, and above all the fiat sum the
     * customer still owes, which lives nowhere else.
     */
    it('the whole basket survives the round trip to the scanner', async () => {
      window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ percent: 60 }))
      const before = mountCalculator('de')
      await press(before, 'digit-1', 'digit-0', 'separator', 'digit-5', 'digit-0', 'equals')
      await press(before, 'park')
      before.unmount()

      const after = mountCalculator('de')
      expect(key(after, 'display').text()).toBe('10,50')
      expect(key(after, 'sub-fiat').text()).toContain('4,20')
      expect(key(after, 'parked').text()).toContain('6,30')
    })

    /**
     * ⛔ A parked entry that is GONE was consumed: the payment went through over there,
     * the sale is over — the calculator starts clean rather than laying yesterday's
     * basket over a new customer (the same rule syncParked applies at runtime).
     */
    it('a consumed parked amount buries the basket', async () => {
      const before = mountCalculator('de')
      await press(before, 'digit-5', 'equals', 'park')
      before.unmount()
      window.localStorage.removeItem('calculator-parked-amount:user-one')

      const after = mountCalculator('de')
      expect(key(after, 'display').text()).toBe('')
      expect(key(after, 'parked').exists()).toBe(false)
    })

    /** The basket is for the ONE way back: a second arrival starts fresh. */
    it('does not restore the same basket twice', async () => {
      const before = mountCalculator('de')
      await press(before, 'digit-5', 'equals', 'park')
      before.unmount()

      const once = mountCalculator('de')
      expect(key(once, 'display').text()).toBe('5,00')
      once.unmount()

      const twice = mountCalculator('de')
      expect(key(twice, 'display').text()).toBe('')
    })

    /** Parking is a visible act with a way back -- and the way back must not clear the sum. */
    it('takes it back without touching the calculation', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'equals', 'park')
      expect(key(wrapper, 'parked').exists()).toBe(true)

      await press(wrapper, 'park-undo')
      expect(key(wrapper, 'parked').exists()).toBe(false)
      expect(window.localStorage.getItem('calculator-parked-amount:user-one')).toBeNull()
      expect(key(wrapper, 'display').text()).toBe('5,00')
    })

    /**
     * ⛔ The offer goes the moment the calculation moves on. The sums under the display stay
     * standing as they do in the PWA, so a till that starts the next customer by typing
     * rather than by pressing AC still SEES the old figure -- and that is exactly why the
     * button must not still be holding it.
     */
    it('withdraws the offer as soon as the next customer is started', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'digit-0', 'equals')
      expect(key(wrapper, 'park').attributes('disabled')).toBeUndefined()

      await press(wrapper, 'digit-7')
      expect(key(wrapper, 'display').text()).toBe('7')
      expect(key(wrapper, 'park').attributes('disabled')).toBeDefined()
    })

    /**
     * ⛔ A share this small is greater than zero -- so the button used to be live -- but it
     * rounds to 0.00, and zero cannot be parked. Pressing it did nothing at all, forever,
     * with no way to tell that apart from a missed tap.
     */
    it('offers nothing for a sum that rounds away to nothing', async () => {
      window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ percent: 40 }))
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-0', 'separator', 'digit-0', 'digit-1', 'equals')
      expect(key(wrapper, 'park').attributes('disabled')).toBeDefined()
    })

    /**
     * ⛔ Storage refusing to remember is the one failure the till cannot see: the card gets
     * scanned and the amount field opens empty, with a customer waiting.
     */
    it('says so when the amount cannot be remembered', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('denied')
      })
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'equals', 'park')

      expect(key(wrapper, 'parked').exists()).toBe(false)
      expect(key(wrapper, 'park-failed').exists()).toBe(true)
      // And it STAYS here: the message under the button is the one moment to learn the
      // amount must be typed after scanning — on the scanner page it would be gone.
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    /**
     * ★ Scanning leaves the wallet -- the phone's camera opens `/dk/CODE`, on a phone
     * usually in a NEW tab -- and the payment goes through over there. This page stays
     * behind with the finished basket on it, so it listens: the amount disappearing from
     * storage while another document holds it can only mean the payment went through.
     *
     * *(Bernd, 19.08.2026: once the payment has gone through, the calculator has to be
     * cleared -- the same as AC.)*
     */
    it('clears itself when the payment goes through in the tab the camera opened', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'digit-0', 'equals', 'park')
      expect(key(wrapper, 'parked').exists()).toBe(true)

      // what the payment screen does on SUCCESS, seen from this tab
      window.localStorage.removeItem('calculator-parked-amount:user-one')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'calculator-parked-amount:user-one',
          newValue: null,
        }),
      )
      await wrapper.vm.$nextTick()

      expect(key(wrapper, 'parked').exists()).toBe(false)
      expect(key(wrapper, 'display').text()).toBe('')
      expect(key(wrapper, 'sub').text()).toBe('')
    })

    /**
     * ⛔ …but a window that merely ran out must NOT wipe the basket. The panel stops claiming
     * an amount the payment screen would already refuse, and the sum on the display belongs
     * to the customer who is still standing there.
     */
    it('drops the panel but keeps the basket when the ten minutes run out', async () => {
      vi.useFakeTimers()
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'digit-0', 'equals', 'park')
      expect(key(wrapper, 'parked').exists()).toBe(true)

      vi.advanceTimersByTime(11 * 60 * 1000)
      document.dispatchEvent(new Event('visibilitychange'))
      await wrapper.vm.$nextTick()

      expect(key(wrapper, 'parked').exists()).toBe(false)
      expect(key(wrapper, 'display').text()).toBe('50,00')
    })
  })

  describe('copying a sum', () => {
    /**
     * ⛔ Ungrouped is the whole point. Three of the wallet's amount fields still read with
     * the plain comma-to-dot rule, so a copied `1.234,50` would turn to NaN in Send --
     * `1234,50` is read correctly by every field, old rule and new.
     */
    it('copies the GDD sum ungrouped, in the notation of the language', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-1', 'digit-2', 'digit-3', 'digit-4', 'separator', 'digit-5')
      await press(wrapper, 'equals')
      await key(wrapper, 'copy-gdd').trigger('click')
      await flushPromises()

      expect(writeTextMock).toHaveBeenCalledWith('1234,50')
      expect(toastSuccessMock).toHaveBeenCalled()
    })

    /** The local currency goes into an official till app -- the second copy case. */
    it('copies the currency side of a mixed sale', async () => {
      window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ percent: 60 }))
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-1', 'digit-0', 'equals')
      await key(wrapper, 'copy-fiat').trigger('click')
      await flushPromises()

      expect(writeTextMock).toHaveBeenCalledWith('4,00')
    })

    it('offers the copy on a DankBar conversion too', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-1', 'digit-0', 'digit-0', 'dankbar')
      expect(key(wrapper, 'copy-gdd').exists()).toBe(true)
    })

    /** No clipboard at all, or one that throws instead of rejecting: same audible refusal. */
    it.each([
      ['is missing entirely', () => delete window.navigator.clipboard],
      [
        'throws synchronously',
        () =>
          writeTextMock.mockImplementation(() => {
            throw new Error('denied')
          }),
      ],
    ])('still answers when the clipboard %s', async (_name, sabotage) => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'equals')
      sabotage()
      await key(wrapper, 'copy-gdd').trigger('click')
      await flushPromises()

      expect(toastErrorMock).toHaveBeenCalled()
    })

    /** A refused clipboard must say so -- a silent nothing looks exactly like a missed tap. */
    it('says so when the clipboard refuses', async () => {
      writeTextMock.mockImplementation(() => Promise.reject(new Error('denied')))
      const wrapper = mountCalculator('de')
      await press(wrapper, 'digit-5', 'equals')
      await key(wrapper, 'copy-gdd').trigger('click')
      await flushPromises()

      expect(toastErrorMock).toHaveBeenCalled()
      expect(toastSuccessMock).not.toHaveBeenCalled()
    })
  })

  describe('the way back', () => {
    /** Reachable from every page, so it returns to whichever page that was. */
    it('steps back through the history when there is one', async () => {
      historyState.back = '/overview'
      const wrapper = mountCalculator()
      await key(wrapper, 'back').trigger('click')

      expect(mockRouter.back).toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    /**
     * ⚠️ A deep link has no wallet history, and a bare history step would walk OUT of the
     * wallet -- to whatever the browser had open before. The overview is the safe landing.
     */
    it('lands on the overview when the calculator was opened directly', async () => {
      const wrapper = mountCalculator()
      await key(wrapper, 'back').trigger('click')

      expect(mockRouter.push).toHaveBeenCalledWith('/overview')
      expect(mockRouter.back).not.toHaveBeenCalled()
    })
  })

  describe('settings', () => {
    it('keeps what was typed, and keeps it for next time', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'settings-open')
      await key(wrapper, 'settings-factor').setValue('5')
      await key(wrapper, 'settings-currency').setValue('THB')
      await wrapper.find('.modal-ok').trigger('click')

      const stored = JSON.parse(window.localStorage.getItem('calculator-prefs:user-one'))
      expect(stored.factor).toBe(5)
      expect(stored.currency).toBe('THB')
    })

    /**
     * ⚠️ The factor goes through the same reader as every other amount, so a comma typed on
     * a German keyboard is a factor and not a refusal.
     */
    it('reads a comma in the factor', async () => {
      const wrapper = mountCalculator('de')
      await press(wrapper, 'settings-open')
      await key(wrapper, 'settings-factor').setValue('1,5')
      await wrapper.find('.modal-ok').trigger('click')

      expect(JSON.parse(window.localStorage.getItem('calculator-prefs:user-one')).factor).toBe(1.5)
    })

    /**
     * ⚠️ Starts from a factor that is NOT the default, or there would be nothing to observe:
     * an unusable entry falls back to 1, and 1 is where it starts -- so a test against a
     * fresh calculator would pass with the setting never written at all.
     */
    it('falls back rather than storing an unusable factor', async () => {
      window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ factor: 5 }))
      const wrapper = mountCalculator()
      await press(wrapper, 'settings-open')
      await key(wrapper, 'settings-factor').setValue('nonsense')
      await wrapper.find('.modal-ok').trigger('click')

      expect(JSON.parse(window.localStorage.getItem('calculator-prefs:user-one')).factor).toBe(1)
    })

    it.each([
      ['150', 100],
      ['-20', 0],
    ])('holds a share of %s at %s', async (typed, expected) => {
      // Same reason as above: 60 first, so the clamped value is a change either way.
      window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ percent: 60 }))
      const wrapper = mountCalculator()
      await press(wrapper, 'percent')
      await key(wrapper, 'share-input').setValue(typed)
      await wrapper.find('.modal-ok').trigger('click')

      expect(JSON.parse(window.localStorage.getItem('calculator-prefs:user-one')).percent).toBe(
        expected,
      )
    })

    /**
     * ⛔ An emptied field is not an answer of zero. `Number('')` is 0, and 0 is a perfectly
     * legal Gradido share, so it slipped past the "is this a number" guard: clearing the
     * field and closing the panel set the share to nothing, the sub-result disappeared, and
     * the card button never armed again. Whoever did it would see a calculator that had
     * simply stopped offering Gradido, with nothing to say why.
     */
    it.each([[''], ['   ']])(
      'leaves the share alone when the field is emptied (%s)',
      async (typed) => {
        window.localStorage.setItem('calculator-prefs:user-one', JSON.stringify({ percent: 60 }))
        const wrapper = mountCalculator()
        await press(wrapper, 'percent')
        await key(wrapper, 'share-input').setValue(typed)
        await wrapper.find('.modal-ok').trigger('click')

        await press(wrapper, 'digit-1', 'digit-0', 'equals')
        expect(key(wrapper, 'sub-gdd').text()).toContain('6,00')
      },
    )
  })
})
