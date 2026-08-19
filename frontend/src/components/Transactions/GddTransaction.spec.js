// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import GddTransaction from './GddTransaction.vue'

/**
 * The row every booking in the wallet is drawn with.
 *
 * ⛔ Written because it had no test at all, while its two dead neighbours
 * (`TransactionSend.vue`, `TransactionReceive.vue`) have one each. Nothing imports those
 * two — this is the row that actually reaches a screen, so this is where the marker under
 * the amount has to be held.
 */

vi.mock('vuex', () => ({
  useStore: () => ({ state: { firstName: 'Max', lastName: 'Mustermann' } }),
}))

const BOOKING = {
  id: 7,
  typeId: 'SEND',
  amount: '-12.5',
  balance: '100',
  previousBalance: '112.5',
  balanceDate: new Date('2026-08-19T10:31:00Z'),
  memo: 'Pizzeria Napoli',
  decay: { decay: '0', start: null, end: null, duration: 0 },
  linkedUser: { firstName: 'Pizzeria', lastName: 'Napoli', alias: 'napoli' },
  linkId: null,
  viaThankYouCard: false,
  thankYouCardLabel: null,
}

describe('GddTransaction', () => {
  let wrapper

  const mountWith = (extra) => {
    wrapper = mount(GddTransaction, {
      props: { transaction: { ...BOOKING, ...extra } },
      global: {
        mocks: { $t: (key) => key, $d: (d) => String(d), $filters: { GDD: (a) => String(a) } },
        stubs: {
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          BCollapse: { template: '<div><slot /></div>' },
          BAvatar: true,
          AppAvatar: true,
          Name: true,
          CollapseIcon: true,
          DecayInformation: true,
          VariantIcon: { props: ['icon'], template: '<i :data-icon="icon" />' },
        },
      },
    })
    return wrapper
  }

  const marker = () => wrapper.find('[data-test="transaction-via-card"]')

  afterEach(() => {
    wrapper?.unmount()
  })

  it('says nothing under the amount for a plain transfer', () => {
    mountWith({})

    expect(marker().exists()).toBe(false)
    expect(wrapper.text()).not.toContain('via_link')
  })

  it('keeps saying "via a link" for a booking that came from one', () => {
    mountWith({ linkId: 42 })

    expect(wrapper.text()).toContain('via_link')
    expect(marker().exists()).toBe(false)
  })

  /**
   * The payer's own row. The name is the answer to "which of my cards was that?" for
   * somebody who has printed more than one over the years.
   */
  it('names the card on the row of the member who paid with it', () => {
    mountWith({ viaThankYouCard: true, thankYouCardLabel: 'Portemonnaie' })

    expect(marker().text()).toContain('Portemonnaie')
    expect(marker().find('[data-icon="cards"]').exists()).toBe(true)
  })

  /**
   * ⛔ The till's row, and the half that had to be pinned: a card was used, and that is
   * ALL it says. The name never arrives here — the backend leaves it off this side — and
   * this test fails the moment the screen starts inventing one.
   */
  it('says only that a card was used when no name came with the booking', () => {
    mountWith({ typeId: 'RECEIVE', viaThankYouCard: true, thankYouCardLabel: null })

    expect(marker().text()).toContain('via_card')
    expect(marker().text()).not.toContain('Portemonnaie')
    expect(marker().find('[data-icon="cards"]').exists()).toBe(true)
  })

  // A link and a card are mutually exclusive, and the link wins the branch. Pinned so that
  // adding a third marker later cannot quietly make a row show two.
  it('shows one marker at a time, never two', () => {
    mountWith({ linkId: 42, viaThankYouCard: true, thankYouCardLabel: 'Portemonnaie' })

    expect(wrapper.text()).toContain('via_link')
    expect(marker().exists()).toBe(false)
  })
})
