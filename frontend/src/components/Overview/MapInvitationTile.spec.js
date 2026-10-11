// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/locales/de.json'
import MapInvitationTile from './MapInvitationTile.vue'

// Mutable, so a case can switch matching off. The tile reads it when it decides, and so
// does `mayFind`'s module beside it.
const config = vi.hoisted(() => ({ MATCHING_ACTIVE: true }))
vi.mock('@/config', () => ({ default: config }))

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/matching/:tab', component: { template: '<div />' } },
  ],
})

const HOME = { latitude: 49.28, longitude: 9.69 }

// Real mutations: one case moves the member onto the map while the tile is on screen.
const storeWith = (state) =>
  createStore({
    state: () => ({ gmsAllowed: false, userLocation: null, ...state }),
    mutations: {
      gmsAllowed: (s, value) => {
        s.gmsAllowed = value
      },
      userLocation: (s, value) => {
        s.userLocation = value
      },
    },
  })

const mountTile = (state = {}) => {
  const store = storeWith(state)
  const wrapper = mount(MapInvitationTile, { global: { plugins: [i18n, router, store] } })
  return { wrapper, store }
}

const tile = (wrapper) => wrapper.find('[data-test="map-invitation-tile"]')

beforeEach(() => {
  config.MATCHING_ACTIVE = true
})

describe('MapInvitationTile', () => {
  describe('for a member who is not on the map', () => {
    it('asks the question and says what it takes', () => {
      const { wrapper } = mountTile()

      expect(wrapper.find('[data-test="map-invitation-heading"]').text()).toBe(
        de.matching.invitation.title,
      )
      expect(wrapper.find('[data-test="map-invitation-text"]').text()).toBe(
        de.matching.invitation.text,
      )
    })

    // The tap is the member's yes, so the label has to say what it does - and the address
    // carries that yes to the home tab, which opens with "findable" switched on.
    it('offers one button, which says what it does and carries the yes along', () => {
      const { wrapper } = mountTile()
      const go = wrapper.find('[data-test="map-invitation-go"]')

      expect(go.text()).toBe(de.matching.invitation.go)
      expect(go.attributes('href')).toBe('/matching/position?findable=yes')
      expect(wrapper.findAll('a, button')).toHaveLength(1)
    })

    it('is there for a home that may not be found', () => {
      const { wrapper } = mountTile({ userLocation: HOME, gmsAllowed: false })

      expect(tile(wrapper).exists()).toBe(true)
    })

    it('is there for a permission without a home', () => {
      const { wrapper } = mountTile({ userLocation: null, gmsAllowed: true })

      expect(tile(wrapper).exists()).toBe(true)
    })

    // The empty object the backend used to answer is still in the persisted store of
    // devices that signed in before 09.09.2026. It is not a place.
    it('is there for the empty position of old', () => {
      const { wrapper } = mountTile({ userLocation: {}, gmsAllowed: true })

      expect(tile(wrapper).exists()).toBe(true)
    })
  })

  describe('for a member who is on the map', () => {
    it('is not there', () => {
      const { wrapper } = mountTile({ userLocation: HOME, gmsAllowed: true })

      expect(tile(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('a, button')).toHaveLength(0)
    })

    it('goes the moment they get there', async () => {
      const { wrapper, store } = mountTile()
      expect(tile(wrapper).exists()).toBe(true)

      store.commit('userLocation', HOME)
      await nextTick()
      // A home alone is half of it.
      expect(tile(wrapper).exists()).toBe(true)

      store.commit('gmsAllowed', true)
      await nextTick()
      expect(tile(wrapper).exists()).toBe(false)
    })
  })

  // The matching routes exist only where matching is switched on (routes.js), so the
  // address the button leads to would be a page this wallet does not have.
  it('is not there where matching is switched off, even for a member without a home', () => {
    config.MATCHING_ACTIVE = false

    const { wrapper } = mountTile()

    expect(tile(wrapper).exists()).toBe(false)
  })
})
