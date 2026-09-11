// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DecayInformationLong from './DecayInformation-Long.vue'

const mountIt = () =>
  mount(DecayInformationLong, {
    props: {
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
   * ⛔ The memo moved up into the booking's row, where its first line is readable before the
   * booking opens and the whole of it once it does (GddTransaction). This part starts with the
   * decay calculation now -- a memo or its old heading here again would show the memo twice.
   */
  it('starts with the decay calculation, with no memo and no memo heading of its own', () => {
    const wrapper = mountIt()

    expect(wrapper.text()).not.toContain('form.memo')
    expect(wrapper.find('.decayinformation-long').element.firstElementChild.textContent).toContain(
      'decay.calculation_decay',
    )
  })
})
