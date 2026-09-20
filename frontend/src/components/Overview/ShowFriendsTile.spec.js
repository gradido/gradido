// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShowFriendsTile from './ShowFriendsTile.vue'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import en from '@/locales/en.json'

const queryResult = ref(undefined)
const apolloQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({ result: queryResult })),
  useApolloClient: () => ({ client: { query: apolloQuery } }),
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
      gradidoID: 'g-carla',
      alias: 'carla-sonne',
      createdAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
      first,
    },
  },
})

// What the store holds after signing in: this wallet's own community. An arrival is a
// member of it by construction, which is why the tile pairs it with their identifier.
const store = createStore({ state: () => ({ communityUuid: 'home-uuid' }) })

const mountTile = () =>
  mount(ShowFriendsTile, {
    global: {
      plugins: [i18n, router, store],
      stubs: { IMdiChevronRight: true, ContactWindow: true },
    },
  })

beforeEach(() => {
  queryResult.value = undefined
  seen.value = false
  apolloQuery.mockReset()
  // Nobody found: the window then stands on what the tile handed it, which is the half
  // this file is about. What a found contact adds is useContactWindow's own spec.
  apolloQuery.mockResolvedValue({ data: { contactList: { contacts: [] } } })
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

    it('still leads on to the page for showing Gradido to somebody', () => {
      queryResult.value = arrival(1, false)

      const go = mountTile().find('[data-test="show-friends-tile-go"]')

      // The way ON is untouched by the name becoming a grip: both are there.
      expect(go.attributes('href')).toBe('/show-friends')
    })
  })

  /**
   * The name is the grip on the person (ZE-010): a tap opens the contact window every
   * other list in the wallet opens, on the arrival the sentence names.
   */
  describe('a tap on the name', () => {
    const tapName = async () => {
      queryResult.value = arrival(1, false)
      const wrapper = mountTile()
      await wrapper.find('[data-test="show-friends-tile-name"]').trigger('click')
      return wrapper
    }

    it('opens the contact window on that person', async () => {
      const window = (await tapName()).findComponent(ContactWindow)

      expect(window.props('modelValue')).toBe(true)
      expect(window.props('contact').user).toEqual({
        gradidoID: 'g-carla',
        communityUuid: 'home-uuid',
        alias: 'carla-sonne',
      })
    })

    /**
     * ⛔ THIS wallet's community, not null. The server would read a missing one as this
     * community too, so the lookup lands either way -- but the window's two buttons build
     * `/send/<community>/<member>` and do nothing without one, and it opens before the
     * answer arrives. The pair sent is what the window is then filled from.
     */
    it('asks the server about the pair, with this community named', async () => {
      await tapName()

      expect(apolloQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { ref: { gradidoID: 'g-carla', communityUuid: 'home-uuid' } },
        }),
      )
    })

    it('has no such grip while the tile is quiet or large', () => {
      seen.value = true
      queryResult.value = arrival(15, true)
      expect(mountTile().find('[data-test="show-friends-tile-name"]').exists()).toBe(false)

      seen.value = false
      queryResult.value = undefined
      expect(mountTile().find('[data-test="show-friends-tile-name"]').exists()).toBe(false)
    })
  })
})
