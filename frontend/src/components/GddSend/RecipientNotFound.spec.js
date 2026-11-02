// AI-GENERATED — not an architecture reference
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'
import { LINK_VALID_DAYS } from '@/constants'
import RecipientNotFound from './RecipientNotFound.vue'

const COMMUNITY = 'Gradido-Akademie'
const ADDRESS = 'sarah@kongress-beispiel.de'

describe('RecipientNotFound', () => {
  let wrapper
  const show = (props = {}) => {
    wrapper = mount(RecipientNotFound, {
      attachTo: document.body,
      props: { identifier: ADDRESS, communityName: COMMUNITY, isEmail: true, ...props },
      global: { plugins: [i18n] },
    })
    return wrapper
  }
  const data = (name) => wrapper.find(`[data-test="recipient-not-found-${name}"]`)

  beforeEach(() => {
    i18n.global.locale.value = 'de'
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('says where it looked, and what it looked for', () => {
    it('for an address', () => {
      show()
      expect(data('title').text()).toBe('Zu dieser Adresse gibt es in Gradido-Akademie kein Konto.')
      expect(data('identifier').text()).toBe(ADDRESS)
    })

    it('for a user name', () => {
      show({ identifier: 'Sarah-K', isEmail: false })
      expect(data('title').text()).toBe(
        'Zu diesem Nutzernamen gibt es in Gradido-Akademie kein Konto.',
      )
      expect(data('identifier').text()).toBe('Sarah-K')
    })

    it('for a Gradido ID', () => {
      show({ identifier: '6f1c2b1e-58d1-4d2c-9e4a-0a4b6d8e3f11', isEmail: false })
      expect(data('title').text()).toBe(
        'Zu dieser Gradido-ID gibt es in Gradido-Akademie kein Konto.',
      )
    })

    it('lets a long address break', () => {
      show()
      expect(data('identifier').classes()).toContain('text-break')
    })
  })

  describe('the doors', () => {
    it('has both for an address, where another community can be chosen', () => {
      show({ canChooseCommunity: true })
      expect(data('other-community').text()).toBe(
        'Gehört die Adresse zu einem Mitglied einer anderen Gemeinschaft? Dann wähle die Gemeinschaft.',
      )
      expect(data('choose-community').text()).toBe('Gemeinschaft wählen')
      expect(data('by-email').text()).toBe(
        `Sonst schick Deinen Dank per E-Mail: Gradido legt dafür einen Link an, der ${LINK_VALID_DAYS} Tage wartet. Damit wird ein Konto angelegt — oder der Dank in ein bestehendes genommen.`,
      )
      expect(data('send-by-email').text()).toBe('Dank per E-Mail schicken')
      expect(data('change').text()).toBe('Adresse ändern')
    })

    it('has no door to another community where there is none', () => {
      show({ canChooseCommunity: false })
      expect(data('other-community').exists()).toBe(false)
      expect(data('choose-community').exists()).toBe(false)
      expect(data('send-by-email').exists()).toBe(true)
    })

    it('has no door to a mail without an address', () => {
      show({ identifier: 'Sarah-K', isEmail: false, canChooseCommunity: true })
      expect(data('by-email').exists()).toBe(false)
      expect(data('send-by-email').exists()).toBe(false)
      expect(data('other-community').text()).toBe(
        'Gehört die Eingabe zu einem Mitglied einer anderen Gemeinschaft? Dann wähle die Gemeinschaft.',
      )
      expect(data('choose-community').exists()).toBe(true)
      expect(data('change').text()).toBe('Eingabe ändern')
    })

    it('has only the way back where neither door is open, and that as a button', () => {
      show({ identifier: 'Sarah-K', isEmail: false, canChooseCommunity: false })
      expect(wrapper.findAll('button')).toHaveLength(1)
      expect(data('change').classes()).toContain('btn-outline-secondary')
    })

    it('leads with the mail: the one button in the wallet’s first colour', () => {
      show({ canChooseCommunity: true })
      expect(data('send-by-email').classes()).toContain('btn-gradido')
      expect(data('choose-community').classes()).not.toContain('btn-gradido')
      expect(data('change').classes()).toContain('btn-link')
    })
  })

  describe('what the doors say', () => {
    it.each([
      ['send-by-email', 'send-by-email'],
      ['choose-community', 'choose-community'],
      ['change', 'change-recipient'],
    ])('%s says %s, and nothing else', async (door, event) => {
      show({ canChooseCommunity: true })
      await data(door).trigger('click')
      expect(Object.keys(wrapper.emitted()).filter((name) => name !== 'click')).toEqual([event])
    })
  })

  // While the link is made all three are shut: the answer empties the form and leaves this step.
  describe('while the link is made', () => {
    it('shuts all three doors', () => {
      show({ canChooseCommunity: true, busy: true })
      for (const door of ['send-by-email', 'choose-community', 'change']) {
        expect(data(door).attributes('disabled')).toBeDefined()
      }
    })

    it('has them open otherwise', () => {
      show({ canChooseCommunity: true })
      for (const door of ['send-by-email', 'choose-community', 'change']) {
        expect(data(door).attributes('disabled')).toBeUndefined()
      }
    })
  })

  // The button that was pressed is gone with the step before.
  it('takes the focus on its heading, so that a screen reader says what happened', () => {
    show()
    expect(document.activeElement).toBe(data('title').element)
  })

  // E-018: no "Zahlung", no "bezahlen", in any of the sentences.
  it.each(['de', 'en'])('never speaks of a payment (%s)', (locale) => {
    i18n.global.locale.value = locale
    show({ canChooseCommunity: true })
    expect(wrapper.text()).not.toMatch(/zahl|payment|\bpay\b/i)
  })
})
