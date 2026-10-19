// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { walletStore } from '@test/walletStore'
import { useWalletStore } from '@/store/useWalletStore'
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
import sidebar from '@/components/Menu/Sidebar.vue?raw'
import MatchingTile from './MatchingTile.vue'
import tileSource from './MatchingTile.vue?raw'

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

// The real store: one case moves the member onto the map while the tile is on screen.
const storeWith = (state) =>
  walletStore({ gradidoID: 'a-member', gmsAllowed: false, userLocation: null, ...state })

const mountTile = (state = {}, props = {}, language = i18n) => {
  const pinia = storeWith(state)
  const wrapper = mount(MatchingTile, {
    props,
    global: {
      plugins: [language, router, pinia],
      // The two icons come from the build's resolver, which the tests do not run.
      stubs: { ITablerHeartHandshake: true, IMdiChevronRight: true },
    },
  })
  return { wrapper, store: useWalletStore(pinia) }
}

// A member who stands on the map: a home, and the permission to be found.
const ON_THE_MAP = { userLocation: { latitude: 49.28, longitude: 9.69 }, gmsAllowed: true }

// The three shapes of the tile. Only ever one of them is there.
const tile = (wrapper) => wrapper.find('[data-test="map-invitation-tile"]')
const firstEntryTile = (wrapper) => wrapper.find('[data-test="matching-entries-tile"]')
const moreEntriesTile = (wrapper) => wrapper.find('[data-test="matching-more-tile"]')
const anyTile = (wrapper) => wrapper.find('.matching-tile')
const label = (wrapper) => wrapper.find('[data-test="matching-tile-label"]')
// The one heading: with two on the tile - the counted one and the question beside it - a
// reader of the first alone would see nothing wrong.
const heading = (wrapper) => {
  const headings = wrapper.findAll('[data-test="map-invitation-heading"]')
  expect(headings).toHaveLength(1)
  return headings[0]
}
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

describe('MatchingTile', () => {
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
  })

  /**
   * ⛔ What the tile is, is decided when it is set up, and stays for as long as the overview
   * stands. The store can still change under it: the home tab sets what it saved when the
   * server's answer is in, and a member who went on to the overview before that would see
   * the tile turn into another one under their finger, or vanish and pull up the tiles below
   * it (the second reader's finding, 11.10.2026). The next visit decides anew.
   */
  describe('when a save from another page lands while the tile is on screen', () => {
    it('stays the invitation for a member who has just got onto the map', async () => {
      const { wrapper, store } = mountTile({}, { count: 773 })
      const painted = wrapper.html()

      store.setUserLocation(HOME)
      store.setGmsAllowed(true)
      await nextTick()

      expect(tile(wrapper).exists()).toBe(true)
      expect(wrapper.html()).toBe(painted)
    })

    it.each([0, 2])(
      'does not turn into the invitation for a member who has just left the map, with %i entries',
      async (entries) => {
        const { wrapper, store } = mountTile(ON_THE_MAP, { entries, count: 773 })
        const painted = wrapper.html()

        store.setGmsAllowed(false)
        await nextTick()

        expect(tile(wrapper).exists()).toBe(false)
        expect(wrapper.html()).toBe(painted)
      },
    )

    it('does not appear where there was none, for a member who had arrived', async () => {
      const { wrapper, store } = mountTile(ON_THE_MAP, { entries: 3, count: 773 })

      store.setGmsAllowed(false)
      await nextTick()

      expect(anyTile(wrapper).exists()).toBe(false)
    })

    it('is decided anew on the next visit', () => {
      const { wrapper } = mountTile({ ...ON_THE_MAP, gmsAllowed: false }, { entries: 0 })

      expect(tile(wrapper).exists()).toBe(true)
      expect(firstEntryTile(wrapper).exists()).toBe(false)
    })
  })

  // Signing out empties the store while the overview still stands, and an emptied store
  // reads like somebody without a home and without the permission. The tile flashed in for a
  // member who was on the map, on their way to the sign-in page (measured in the built
  // wallet); it asks first whether anybody is signed in.
  describe('when the member signs out on the overview', () => {
    it('does not appear for a member who was on the map', async () => {
      const { wrapper, store } = mountTile({ userLocation: HOME, gmsAllowed: true })
      expect(tile(wrapper).exists()).toBe(false)

      // The order of the sign-out action in store.js.
      store.setGradidoID(null)
      store.setGmsAllowed(null)
      store.setUserLocation(null)
      await nextTick()

      expect(tile(wrapper).exists()).toBe(false)
    })

    it('goes for a member who was looking at it', async () => {
      const { wrapper, store } = mountTile()
      expect(tile(wrapper).exists()).toBe(true)

      store.setGradidoID(null)
      await nextTick()

      expect(tile(wrapper).exists()).toBe(false)
    })

    it('is not there for a store that never held a member', () => {
      const { wrapper } = mountTile({ gradidoID: null })

      expect(tile(wrapper).exists()).toBe(false)
    })

    // A member first, for the other half of the rule too: a home and the permission with
    // nobody named are nobody's.
    it.each([0, 2])(
      'is not there for a home and a permission that belong to nobody, with %i entries',
      (entries) => {
        const { wrapper } = mountTile({ gradidoID: null, ...ON_THE_MAP }, { entries })

        expect(anyTile(wrapper).exists()).toBe(false)
      },
    )

    // Decided once: a tile that came in late would push down what stands below it.
    it('does not come in late for somebody who is named only afterwards', async () => {
      const { wrapper, store } = mountTile({ gradidoID: null })

      store.setGradidoID('a-member')
      await nextTick()

      expect(anyTile(wrapper).exists()).toBe(false)
    })

    // It was painted for one member. Nobody else is ever named on a standing overview, and
    // should that change, nobody else is to read it.
    it("goes when somebody else is named in the member's place", async () => {
      const { wrapper, store } = mountTile()
      expect(tile(wrapper).exists()).toBe(true)

      store.setGradidoID('somebody-else')
      await nextTick()

      expect(anyTile(wrapper).exists()).toBe(false)
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

  /**
   * "The map" alone can be a postcard or a playing card in German, and a newcomer could not
   * tell that the map on the overview and "Matching" in the menu are one thing (Bernd,
   * 11.10.2026). So the tile carries the menu entry's word and icon as its name, in every
   * shape it takes.
   */
  describe('the label', () => {
    it.each([
      ['the invitation onto the map', {}, {}],
      ['the invitation to a first entry', ON_THE_MAP, { entries: 0 }],
      ['the line for one more entry', ON_THE_MAP, { entries: 1 }],
    ])('names matching on %s, with the word of the menu', (_shape, state, props) => {
      const { wrapper } = mountTile(state, props)

      expect(label(wrapper).text()).toBe(de.navigation.matching)
      expect(wrapper.findAll('[data-test="matching-tile-label"]')).toHaveLength(1)
    })

    it('shows the icon of the menu entry, and keeps it out of what is read aloud', () => {
      const { wrapper } = mountTile()
      const icon = label(wrapper).find('i-tabler-heart-handshake-stub')

      expect(icon.exists()).toBe(true)
      // The word beside it says the same; read aloud twice it would only be noise.
      expect(icon.attributes('aria-hidden')).toBe('true')
    })

    // Wiring that nothing else holds: the menu may be given another icon one day, and the
    // label that exists to point at the menu entry would go on showing the old one.
    it('uses the very icon the menu gives matching', () => {
      const entry = sidebar.match(
        /<(i-[a-z0-9-]+)[^>]*\/>\s*<span[^>]*>\{\{ \$t\('navigation\.matching'\) \}\}/,
      )

      expect(entry).not.toBeNull()
      expect(tileSource).toContain(`<${entry[1]} aria-hidden="true" />`)
    })

    // BBadge's default variant brings black `!important` text that wins over the white of
    // the gradient (CommunityMember.vue carries the same label for the same reason).
    it('keeps the white text of the gradient: the badge carries no colour variant', () => {
      const { wrapper } = mountTile()

      expect(label(wrapper).classes()).toContain('bg-gradido-gradient')
      expect(
        label(wrapper)
          .classes()
          .filter((c) => /^text-bg-.+/.test(c)),
      ).toEqual([])
    })

    it('is not a way anywhere: the tile keeps its one button', () => {
      const { wrapper } = mountTile()

      expect(label(wrapper).element.tagName).toBe('SPAN')
      expect(label(wrapper).find('a, button').exists()).toBe(false)
    })

    it('is not there where the tile is not', () => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries: 3 })

      expect(label(wrapper).exists()).toBe(false)
    })
  })

  /**
   * The next step, for a member who stands on the map (Bernd, 11.10.2026): the map knows
   * where somebody lives, not who suits them. No entry yet invites to the first one; one or
   * two leave a quiet line offering another; with three the tile has done its work. How many
   * there are is handed in by the overview, settled before the tile is painted.
   */
  describe('for a member who is on the map and has no entry yet', () => {
    it('asks who suits them and says what it takes', () => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries: 0 })

      expect(firstEntryTile(wrapper).exists()).toBe(true)
      expect(wrapper.find('[data-test="matching-entries-heading"]').text()).toBe(
        de.matching.invitation.entriesTitle,
      )
      expect(wrapper.find('[data-test="matching-entries-text"]').text()).toBe(
        de.matching.invitation.entriesText,
      )
    })

    // "Let me write one now": the button leads to the form itself, not to the list the form
    // opens from.
    it('offers one button, which opens the form for a new entry', () => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries: 0 })
      const go = wrapper.find('[data-test="matching-entries-go"]')

      expect(go.text()).toBe(de.matching.invitation.entriesGo)
      expect(go.attributes('href')).toBe('/matching/entries?new=entry')
      expect(wrapper.findAll('a, button')).toHaveLength(1)
    })

    it('says nothing of the map any more', () => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries: 0, count: 773 })

      expect(tile(wrapper).exists()).toBe(false)
      expect(moreEntriesTile(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-test="map-invitation-heading"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="map-invitation-go"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('773')
    })
  })

  describe('for a member who is on the map and has one or two entries', () => {
    it.each([1, 2])(
      'leaves one quiet line with %i, which opens the form for another',
      (entries) => {
        const { wrapper } = mountTile(ON_THE_MAP, { entries })
        const go = wrapper.find('[data-test="matching-more-go"]')

        expect(moreEntriesTile(wrapper).exists()).toBe(true)
        expect(go.text()).toBe(de.matching.invitation.entriesMore)
        expect(go.attributes('href')).toBe('/matching/entries?new=entry')
        expect(wrapper.findAll('a, button')).toHaveLength(1)
      },
    )

    it.each([1, 2])('is neither of the two large tiles with %i', (entries) => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries })

      expect(tile(wrapper).exists()).toBe(false)
      expect(firstEntryTile(wrapper).exists()).toBe(false)
      expect(wrapper.find('.h3').exists()).toBe(false)
      expect(wrapper.find('.btn').exists()).toBe(false)
    })
  })

  // Three, because the invitation names three things: what you look for, give and love.
  describe('for a member who is on the map and has arrived', () => {
    it.each([3, 4, 12, 500])('is not there with %i entries', (entries) => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries })

      expect(anyTile(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('a, button')).toHaveLength(0)
    })
  })

  // Not known is not "none": the tile that says "your first entry" must not meet a member
  // who has made five, on the one visit their list did not answer in time.
  describe('where nobody could say how many entries there are', () => {
    it('is not there for a member on the map who is handed nothing', () => {
      const { wrapper } = mountTile(ON_THE_MAP)

      expect(anyTile(wrapper).exists()).toBe(false)
    })

    it.each([null, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      'is not there for %p',
      (entries) => {
        const { wrapper } = mountTile(ON_THE_MAP, { entries })

        expect(anyTile(wrapper).exists()).toBe(false)
      },
    )
  })

  // The first step first. Entries can be older than the place on the map: a member who took
  // themselves off it keeps what they wrote.
  describe('for a member who is not on the map, whatever they have entered', () => {
    it.each([0, 1, 3, 12])('is the invitation onto the map with %i entries', (entries) => {
      const { wrapper } = mountTile({}, { entries })

      expect(tile(wrapper).exists()).toBe(true)
      expect(firstEntryTile(wrapper).exists()).toBe(false)
      expect(moreEntriesTile(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-test="map-invitation-go"]').attributes('href')).toBe(
        '/matching/position?findable=yes',
      )
    })
  })

  // The same emptied store as above, now for the two shapes of a member who is on the map:
  // they go, and the invitation onto the map does not flash in after them.
  describe('when a member who is on the map signs out on the overview', () => {
    it.each([0, 2])('is gone, and nothing takes its place, with %i entries', async (entries) => {
      const { wrapper, store } = mountTile(ON_THE_MAP, { entries })
      expect(anyTile(wrapper).exists()).toBe(true)

      // The order of the sign-out action in store.js.
      store.setGradidoID(null)
      await nextTick()
      expect(anyTile(wrapper).exists()).toBe(false)

      store.setGmsAllowed(null)
      store.setUserLocation(null)
      await nextTick()
      expect(anyTile(wrapper).exists()).toBe(false)
    })
  })

  // Rendered with the real vue-i18n, not reasoned about: a key missing in one file would
  // print its own name here, and a placeholder left open its braces.
  describe.each(Object.keys(LANGUAGES))('the entries in %s', (code) => {
    const said = LANGUAGES[code].matching.invitation

    it('invites to the first entry in whole sentences', () => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries: 0 }, speaking(code))

      expect(wrapper.find('[data-test="matching-entries-heading"]').text()).toBe(said.entriesTitle)
      expect(wrapper.find('[data-test="matching-entries-text"]').text()).toBe(said.entriesText)
      expect(wrapper.find('[data-test="matching-entries-go"]').text()).toBe(said.entriesGo)
      expect(wrapper.text()).not.toMatch(/[{}|]|matching\.invitation/)
      // The menu's word, whatever the sentence below calls it.
      expect(label(wrapper).text()).toBe(LANGUAGES[code].navigation.matching)
    })

    it('offers one more in a few words', () => {
      const { wrapper } = mountTile(ON_THE_MAP, { entries: 2 }, speaking(code))

      expect(wrapper.find('[data-test="matching-more-go"]').text()).toBe(said.entriesMore)
      expect(wrapper.text()).not.toMatch(/[{}|]|matching\.invitation/)
    })
  })

  // The matching routes exist only where matching is switched on (routes.js), so the
  // address the button leads to would be a page this wallet does not have.
  it('is not there where matching is switched off, even for a member without a home', () => {
    config.MATCHING_ACTIVE = false

    const { wrapper } = mountTile()

    expect(tile(wrapper).exists()).toBe(false)
  })

  it.each([0, 1])(
    'is not there where matching is switched off, for a member on the map with %i entries',
    (entries) => {
      config.MATCHING_ACTIVE = false

      const { wrapper } = mountTile(ON_THE_MAP, { entries })

      expect(anyTile(wrapper).exists()).toBe(false)
    },
  )
})
