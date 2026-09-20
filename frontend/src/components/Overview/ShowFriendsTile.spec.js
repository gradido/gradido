// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShowFriendsTile from './ShowFriendsTile.vue'
import en from '@/locales/en.json'

const queryResult = ref(undefined)
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({ result: queryResult })),
}))

const seen = ref(false)
vi.mock('@/composables/useShowFriendsSeen', () => ({
  useShowFriendsSeen: () => ({ seen, markSeen: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

// The real route path, so the link is resolved by a router rather than read off a prop.
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/show-friends', component: { template: '<div />' } }],
})

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * ⚠️ The date is an INGREDIENT, not a clock: the fixture says how long ago the arrival
 * was, and the component measures against the real `Date.now()`. Freezing time would only
 * prove that the test and the component agree about a number we both made up.
 */
const arrival = (daysAgo, first) => ({
  showFriends: {
    referrerAlias: null,
    latestArrival: {
      alias: 'carla-sonne',
      createdAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
      first,
    },
  },
})

const mountTile = () =>
  mount(ShowFriendsTile, {
    global: { plugins: [i18n, router], stubs: { IMdiChevronRight: true } },
  })

beforeEach(() => {
  queryResult.value = undefined
  seen.value = false
})

describe('ShowFriendsTile', () => {
  describe('large, until the member has been to the page', () => {
    it('says what it is about', () => {
      const wrapper = mountTile()

      expect(wrapper.text()).toContain(en.showFriends.tile.title)
      expect(wrapper.text()).toContain(en.showFriends.tile.text)
    })

    // The tile is the only way onto the page -- there is no menu entry.
    it('leads to the page for showing Gradido to somebody', () => {
      const go = mountTile().find('[data-test="show-friends-tile-go"]')

      expect(go.attributes('href')).toBe('/show-friends')
      expect(go.text()).toBe(en.showFriends.tile.go)
    })

    it('stays large while the only arrival is an old one', () => {
      queryResult.value = arrival(30, true)

      const wrapper = mountTile()

      expect(wrapper.find('[data-test="show-friends-tile-row"]').exists()).toBe(false)
      expect(wrapper.text()).toContain(en.showFriends.tile.text)
    })
  })

  describe('a quiet row, once they have', () => {
    it('is one line with the title and nothing else', () => {
      seen.value = true

      const wrapper = mountTile()
      const row = wrapper.find('[data-test="show-friends-tile-row"]')

      expect(row.attributes('href')).toBe('/show-friends')
      expect(row.text()).toContain(en.showFriends.tile.title)
      expect(wrapper.text()).not.toContain(en.showFriends.tile.text)
    })
  })

  describe('the mirror, when somebody arrived', () => {
    it('names them and wins over the quiet row', () => {
      seen.value = true
      queryResult.value = arrival(1, false)

      const wrapper = mountTile()

      expect(wrapper.find('[data-test="show-friends-tile-row"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-tile-heading"]').text()).toBe(
        en.showFriends.mirror.title.replace('{name}', 'carla-sonne'),
      )
      expect(wrapper.find('[data-test="show-friends-tile-go"]').text()).toBe(
        en.showFriends.mirror.go,
      )
    })

    it('adds the warm sentence only for the first arrival ever', () => {
      queryResult.value = arrival(1, true)
      expect(mountTile().find('[data-test="show-friends-tile-first"]').exists()).toBe(true)

      queryResult.value = arrival(1, false)
      const later = mountTile()
      expect(later.find('[data-test="show-friends-tile-first"]').exists()).toBe(false)
      // The arrival is still reported -- only the praise is what happens once.
      expect(later.find('[data-test="show-friends-tile-since"]').exists()).toBe(true)
    })

    it('goes quiet again a fortnight later', () => {
      seen.value = true
      queryResult.value = arrival(15, true)

      const wrapper = mountTile()

      expect(wrapper.find('[data-test="show-friends-tile-row"]').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('carla-sonne')
    })

    it('renders the name as text, never as markup', () => {
      queryResult.value = arrival(1, false)
      queryResult.value.showFriends.latestArrival.alias = '<img src=x onerror=alert(1)>'

      const wrapper = mountTile()

      expect(wrapper.find('[data-test="show-friends-tile-heading"] img').exists()).toBe(false)
      expect(wrapper.find('[data-test="show-friends-tile-heading"]').text()).toContain(
        '<img src=x onerror=alert(1)>',
      )
    })
  })
})
