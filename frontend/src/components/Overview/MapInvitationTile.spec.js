// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/locales/de.json'
import el from '@/locales/el.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import it_ from '@/locales/it.json'
import nl from '@/locales/nl.json'
import pt from '@/locales/pt.json'
import ru from '@/locales/ru.json'
import tr from '@/locales/tr.json'
import { pluralRules } from '@/utils/pluralRules'
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

const mountTile = (state = {}, props = {}, language = i18n) => {
  const store = storeWith(state)
  const wrapper = mount(MapInvitationTile, {
    props,
    global: { plugins: [language, router, store] },
  })
  return { wrapper, store }
}

const tile = (wrapper) => wrapper.find('[data-test="map-invitation-tile"]')
const heading = (wrapper) => wrapper.find('[data-test="map-invitation-heading"]')
const question = (wrapper) => wrapper.find('[data-test="map-invitation-question"]')

// Every language the wallet speaks, with the plural rules the wallet gives them.
const LANGUAGES = { de, en, es, fr, it: it_, nl, pt, ru, tr, el }
const speaking = (code) =>
  createI18n({
    legacy: false,
    locale: code,
    messages: { [code]: LANGUAGES[code] },
    pluralRules,
  })

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

  // The hook Bernd chose (11.10.2026): how many people stand on the map, across every
  // community -- and then the question, which of them live near you. The overview hands the
  // number in, settled before the tile is painted; where nobody could say, the question is
  // the heading, as it was.
  describe('the heading', () => {
    it('counts the people on the map and asks who of them lives nearby', () => {
      const { wrapper } = mountTile({}, { count: 773 })

      // The hyphen is one that does not break: "Karte" never stands alone on a line.
      expect(heading(wrapper).text()).toBe('773 Menschen auf der Gradido\u2011Karte')
      expect(question(wrapper).text()).toBe(de.matching.invitation.question)
      // The rest of the tile is what it was.
      expect(wrapper.find('[data-test="map-invitation-text"]').text()).toBe(
        de.matching.invitation.text,
      )
      expect(wrapper.find('[data-test="map-invitation-go"]').attributes('href')).toBe(
        '/matching/position?findable=yes',
      )
    })

    it('writes a large number the way the language groups it', () => {
      const { wrapper } = mountTile({}, { count: 12345 })

      expect(heading(wrapper).text()).toBe('12.345 Menschen auf der Gradido\u2011Karte')
    })

    it('is the question itself where nobody could say how many', () => {
      const { wrapper } = mountTile({}, { count: null })

      expect(heading(wrapper).text()).toBe(de.matching.invitation.title)
      expect(question(wrapper).exists()).toBe(false)
    })

    it('is the question itself where it is handed nothing', () => {
      const { wrapper } = mountTile()

      expect(heading(wrapper).text()).toBe(de.matching.invitation.title)
      expect(question(wrapper).exists()).toBe(false)
    })

    // "Who of them" needs a them.
    it.each([0, 1])('does not count %i', (count) => {
      const { wrapper } = mountTile({}, { count })

      expect(heading(wrapper).text()).toBe(de.matching.invitation.title)
      expect(question(wrapper).exists()).toBe(false)
    })

    it('counts from two', () => {
      const { wrapper } = mountTile({}, { count: 2 })

      expect(heading(wrapper).text()).toBe('2 Menschen auf der Gradido\u2011Karte')
    })

    it.each([12.5, -3, Number.NaN, Number.POSITIVE_INFINITY])(
      'does not print %p as a number of people',
      (count) => {
        const { wrapper } = mountTile({}, { count })

        expect(heading(wrapper).text()).toBe(de.matching.invitation.title)
      },
    )

    it('is still not there for a member who is on the map, number or not', () => {
      const { wrapper } = mountTile({ userLocation: HOME, gmsAllowed: true }, { count: 773 })

      expect(tile(wrapper).exists()).toBe(false)
    })

    // Rendered with the real vue-i18n and the wallet's own rules, not reasoned about: a
    // placeholder left open or a stray form separator shows here, in any of the ten.
    describe.each(Object.keys(LANGUAGES))('in %s', (code) => {
      it('says the number once, in a whole sentence, and asks the question', () => {
        const { wrapper } = mountTile({}, { count: 773 }, speaking(code))
        const said = heading(wrapper).text()

        expect(said.match(/773/g)).toHaveLength(1)
        expect(said).toContain('Gradido')
        expect(said).not.toMatch(/[{}|]/)
        expect(said.length).toBeGreaterThan('773 Gradido'.length)
        expect(question(wrapper).text()).toBe(LANGUAGES[code].matching.invitation.question)
        expect(question(wrapper).text()).not.toMatch(/[{}|]/)
      })
    })

    // Russian counts people in three classes, and the rule for them is the wallet's own
    // (utils/pluralRules.js). 1 024 is written with a space that does not break.
    it.each([
      [2, /^2 человека на карте Gradido$/],
      [5, /^5 человек на карте Gradido$/],
      [21, /^21 человек на карте Gradido$/],
      [771, /^771 человек на карте Gradido$/],
      [773, /^773 человека на карте Gradido$/],
      [775, /^775 человек на карте Gradido$/],
      [811, /^811 человек на карте Gradido$/],
      [812, /^812 человек на карте Gradido$/],
      [1024, /^1\s024 человека на карте Gradido$/],
    ])('counts %i people in Russian the way Russian does', (count, said) => {
      const { wrapper } = mountTile({}, { count }, speaking('ru'))

      expect(heading(wrapper).text()).toMatch(said)
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
