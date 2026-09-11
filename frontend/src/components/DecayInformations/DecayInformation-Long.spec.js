// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DecayInformationLong from './DecayInformation-Long.vue'

const MARKUP = 'hi <b>there</b> <img src="x" data-probe>'

const mountWith = (memo) =>
  mount(DecayInformationLong, {
    props: {
      memo,
      decay: { start: '2026-08-24T09:44:00Z', end: '2026-08-24T09:45:00Z', decay: '-0.02' },
      amount: '7.2',
      typeId: 'RECEIVE',
      balance: '12077.5',
      previousBalance: '12070.32',
    },
    global: {
      mocks: { $t: (key) => key, $d: (date) => String(date), $filters: { GDD: (a) => String(a) } },
      stubs: {
        BRow: { template: '<div><slot /></div>' },
        BCol: { template: '<div><slot /></div>' },
        DurationRow: true,
        IBiDropletHalf: true,
      },
    },
  })

describe('DecayInformationLong', () => {
  /**
   * ⛔ The memo in an opened booking. It is written by the OTHER side of the booking, and it
   * used to be handed to the page as markup (`v-html`) so its addresses could be links -- with
   * whatever else it carried. It is text now; only its addresses become links.
   */
  it('shows the memo as text, and builds no element from markup in it', () => {
    const wrapper = mountWith(MARKUP)
    const memo = wrapper.find('.word-break')

    expect(memo.find('[data-probe]').exists()).toBe(false)
    expect(memo.find('b').exists()).toBe(false)
    expect(memo.text()).toContain(MARKUP)
  })

  it('still makes the addresses in it links', () => {
    const wrapper = mountWith('see https://gradido.net/de/')
    expect(wrapper.find('.word-break a').attributes('href')).toBe('https://gradido.net/de/')
  })
})
