// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Breadcrumb from './breadcrumb.vue'
import { createStore } from 'vuex'

vi.mock('@/config', () => ({ default: { COMMUNITY_NAME: 'KI Playground' } }))

const store = createStore({ state: () => ({ firstName: 'Margret' }) })

const mountWith = (meta) =>
  mount(Breadcrumb, {
    global: {
      plugins: [store],
      mocks: {
        $t: (key, values) => (values ? `${key}:${JSON.stringify(values)}` : key),
        $route: { meta },
      },
    },
  })

/**
 * The page heading, and the box it stands in.
 *
 * ⛔ The two are NOT the same thing, and that is the whole of this file. Below 450px the
 * navigation bar is `position: fixed`, and this box's top margin is the only thing holding
 * the page out from under it. A route that wants its vertical space back drops its
 * `pageTitle` — the heading goes, the clearance stays. (Bernd, 22.08.2026)
 */
describe('Breadcrumb', () => {
  it('shows the heading a route names', () => {
    const wrapper = mountWith({ pageTitle: 'overview' })

    expect(wrapper.find('[data-test="page-title"]').text()).toContain('pageTitle.overview')
  })

  it('passes the name and the community, which some headings ask for', () => {
    const wrapper = mountWith({ pageTitle: 'overview' })

    expect(wrapper.find('[data-test="page-title"]').text()).toContain('"name":"Margret"')
    expect(wrapper.find('[data-test="page-title"]').text()).toContain('"community":"KI Playground"')
  })

  describe('a route that names no heading', () => {
    it('shows none', () => {
      const wrapper = mountWith({})

      expect(wrapper.find('[data-test="page-title"]').exists()).toBe(false)
    })

    /**
     * ⛔ And it must not print "pageTitle.undefined" instead, which is what the raw lookup
     * did: a missing key came back as the key itself, so a route that simply said nothing
     * about its heading got a line of code where its title belonged.
     */
    it('does not print the key it did not find', () => {
      const wrapper = mountWith({})

      expect(wrapper.text()).not.toContain('pageTitle')
      expect(wrapper.text()).not.toContain('undefined')
    })

    /**
     * ⛔⛔ The box stays. Removing it with the heading would pull the content under the
     * fixed navigation bar on exactly the phone the space was being won for -- a jsdom test
     * cannot measure that, but it can keep the element from disappearing.
     */
    it('keeps the box, which is what holds the page clear of the fixed navigation bar', () => {
      const wrapper = mountWith({})

      expect(wrapper.find('.page-breadcrumb').exists()).toBe(true)
      expect(wrapper.find('.page-breadcrumb').classes()).toContain('is-untitled')
    })
  })
})
