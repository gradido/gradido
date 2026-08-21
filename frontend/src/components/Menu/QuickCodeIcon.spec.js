// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuickCodeIcon from './QuickCodeIcon.vue'

/**
 * The arrow IS the difference between the two shortcuts. Both carry the same square, and a
 * member who reaches for the wrong one at a counter shows a code that moves the Gradido the
 * other way -- so which arrow appears is behaviour, not decoration.
 */
describe('QuickCodeIcon', () => {
  it('points up when the Gradido leave: somebody takes payment from me', () => {
    const wrapper = mount(QuickCodeIcon, { props: { direction: 'out' } })

    expect(wrapper.find('[data-test="quick-code-arrow-out"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="quick-code-arrow-in"]').exists()).toBe(false)
  })

  it('points down when the Gradido come: somebody sends to me', () => {
    const wrapper = mount(QuickCodeIcon, { props: { direction: 'in' } })

    expect(wrapper.find('[data-test="quick-code-arrow-in"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="quick-code-arrow-out"]').exists()).toBe(false)
  })

  // The square is the half that says "this is a code at all", and it is there either way.
  it('always carries the code symbol', () => {
    for (const direction of ['in', 'out']) {
      const wrapper = mount(QuickCodeIcon, { props: { direction } })

      expect(wrapper.find('.quick-code-icon-code').exists()).toBe(true)
    }
  })
})
