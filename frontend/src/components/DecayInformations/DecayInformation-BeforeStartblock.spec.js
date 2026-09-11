// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DecayInformationBeforeStartblock from './DecayInformation-BeforeStartblock.vue'

describe('DecayInformationBeforeStartblock', () => {
  // ⛔ The memo moved up into the booking's row (GddTransaction); here it would stand twice.
  it('says the booking is from before decay, with no memo and no memo heading of its own', () => {
    const wrapper = mount(DecayInformationBeforeStartblock, {
      global: { mocks: { $t: (key) => key } },
    })

    expect(wrapper.text()).toBe('decay.before_startblock_transaction')
  })
})
