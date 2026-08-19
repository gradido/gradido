// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
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
}

const mountCalculator = (locale = 'de') =>
  mount(Calculator, {
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

const key = (wrapper, name) => wrapper.find(`[data-test="calculator-${name}"]`)
const press = async (wrapper, ...names) => {
  for (const name of names) {
    await key(wrapper, name).trigger('click')
  }
}

describe('Calculator page', () => {
  beforeEach(() => {
    state.gradidoID = 'user-one'
    window.localStorage.clear()
  })

  afterEach(() => {
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
      expect(key(wrapper, 'sub-amounts').text()).toContain('10,50')
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
  })
})
