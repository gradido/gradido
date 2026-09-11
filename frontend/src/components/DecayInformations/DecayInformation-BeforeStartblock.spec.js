// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DecayInformationBeforeStartblock from './DecayInformation-BeforeStartblock.vue'

const MARKUP = 'hi <b>there</b> <img src="x" data-probe>'

const mountWith = (memo) =>
  mount(DecayInformationBeforeStartblock, {
    props: { memo },
    global: { mocks: { $t: (key) => key } },
  })

describe('DecayInformationBeforeStartblock', () => {
  // ⛔ The same memo as in an ordinary booking, for bookings from before decay began -- and it
  // was handed to the page as markup here too. It is text now; only its addresses are links.
  it('shows the memo as text, and builds no element from markup in it', () => {
    const wrapper = mountWith(MARKUP)
    const memo = wrapper.find('.my-4')

    expect(memo.find('[data-probe]').exists()).toBe(false)
    expect(memo.findAll('b')).toHaveLength(0)
    expect(memo.text()).toContain(MARKUP)
  })

  // The old links here opened without `rel`; the shared ones carry it.
  it('makes a web address a link that opens apart from the wallet', () => {
    const link = mountWith('see https://gradido.net/de/').find('.my-4 a')

    expect(link.attributes('href')).toBe('https://gradido.net/de/')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })
})
