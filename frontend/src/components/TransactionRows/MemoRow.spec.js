// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MemoRow from './MemoRow.vue'

const MARKUP = 'hi <b>there</b> <img src="x" data-probe>'

const mountWith = (memo) =>
  mount(MemoRow, {
    props: { memo },
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        BRow: { template: '<div><slot /></div>' },
        BCol: { template: '<div><slot /></div>' },
      },
    },
  })

describe('MemoRow', () => {
  // ⛔ The memo of a link in "my links". It was handed to the page as markup; it is text now,
  // and only its addresses become links.
  it('shows the memo as text, and builds no element from markup in it', () => {
    const memo = mountWith(MARKUP).find('.gdd-transaction-list-message')

    expect(memo.find('[data-probe]').exists()).toBe(false)
    expect(memo.find('b').exists()).toBe(false)
    expect(memo.text()).toBe(MARKUP)
  })

  it('still makes the addresses in it links', () => {
    const memo = mountWith('write to info@gradido.net').find('.gdd-transaction-list-message')
    expect(memo.find('a').attributes('href')).toBe('mailto:info@gradido.net')
  })
})
