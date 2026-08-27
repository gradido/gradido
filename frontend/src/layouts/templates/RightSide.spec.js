import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RightSide from './RightSide'

vi.mock('bootstrap-vue-next', () => ({
  BContainer: {
    name: 'BContainer',
    template: '<div><slot></slot></div>',
  },
}))

/**
 * ⛔ There is nothing left here about routes, and that is the change. This column used to
 * work out which panel it carried by parsing `$route.path` -- the second reading of a
 * decision the layout had already made in order to render it at all. The route names the
 * panel now (`meta.rightSide`), the layout passes it on, and this is a wrapper again.
 */
describe('RightSide', () => {
  const mountWith = (panel) =>
    mount(RightSide, {
      props: { panel },
      slots: {
        transactions: '<div data-test="panel-transactions" />',
        contributions: '<div data-test="panel-contributions" />',
        matching: '<div data-test="panel-matching" />',
      },
    })

  it.each(['transactions', 'contributions', 'matching'])(
    'renders the %s panel it was given',
    (panel) => {
      const wrapper = mountWith(panel)

      expect(wrapper.find(`[data-test="panel-${panel}"]`).exists()).toBe(true)
      expect(wrapper.findAll('[data-test^="panel-"]')).toHaveLength(1)
    },
  )

  // Nothing here decides anything, so an unknown name simply has no slot -- the guard against
  // that is on the route, where the panel is named, and in the routes spec that checks it.
  it('renders nothing for a panel it has no slot for', () => {
    expect(mountWith('nonesuch').findAll('[data-test^="panel-"]')).toHaveLength(0)
  })
})
