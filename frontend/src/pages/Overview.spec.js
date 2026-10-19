import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { walletStore } from '@test/walletStore'
import Overview from './Overview.vue'
import MatchingTile from '@/components/Overview/MatchingTile'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import {
  FIRST_ANSWER_PATIENCE_MS,
  MAP_MEMBER_COUNT_STORAGE_KEY,
} from '@/composables/useMapMemberCount'
import { listMatchingEntries, mapMemberCount } from '@/graphql/queries'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'

// Mutable, so each case can say which of the two old services is switched on. Overview reads
// the flags in computed properties, i.e. at render time.
const config = vi.hoisted(() => ({
  HUMHUB_ACTIVE: false,
  GMS_LEGACY_ACTIVE: false,
  MATCHING_ACTIVE: false,
}))
vi.mock('@/config', () => ({ default: config }))

vi.mock('@/components/Overview/CommunityNews', () => ({
  default: {
    name: 'CommunityNews',
    template: '<div class="community-news"></div>',
  },
}))

// ⚠️ `result` included: the tile reads the referral trace off it. Without it the tile
// throws, and the two cases below would fail for a reason that has nothing to do with
// what they are about.
const queryResult = vi.hoisted(() => ({ value: undefined }))
// What the page asked, by document, with the way to answer it: the overview holds its tiles
// back for one of these (the number of people on the map, or the member's own entries), so a
// case has to be able to let that answer arrive.
const asked = vi.hoisted(() => new Map())
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document) => {
    const question = { result: null, error: null }
    asked.set(document, question)
    return {
      result: queryResult,
      onResult: (callback) => {
        question.result = callback
      },
      onError: (callback) => {
        question.error = callback
      },
      loading: { value: false },
      error: { value: null },
      refetch: vi.fn(),
    }
  }),
  // ⚠️ Here for the same reason `result` is: the tile takes a client to look a tapped
  // arrival up with, and a mock that answers fewer things than the module tears the
  // whole page down at setup -- with an error about apollo, in two cases about tiles.
  useApolloClient: () => ({ client: { query: vi.fn() } }),
}))

vi.mock('@/components/Overview/CardCircles', () => ({
  default: {
    name: 'CardCircles',
    template: '<div class="card-circles"></div>',
  },
}))

vi.mock('@/components/Overview/CardUserSearch', () => ({
  default: {
    name: 'CardUserSearch',
    template: '<div class="card-user-search"></div>',
  },
}))

describe('Overview', () => {
  let wrapper
  let router
  let i18n
  let store

  const mountOverview = () =>
    mount(Overview, {
      global: {
        plugins: [router, i18n, store],
        stubs: {
          RouterLink: true,
          IMdiChevronRight: true,
          ITablerHeartHandshake: true,
          // The window the tile opens is its own component with its own spec; this file
          // is about which tiles the page shows and in what order.
          ContactWindow: true,
        },
      },
    })

  beforeEach(() => {
    asked.clear()
    window.localStorage.clear()
    config.HUMHUB_ACTIVE = false
    config.GMS_LEGACY_ACTIVE = false
    config.MATCHING_ACTIVE = false
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })
    // The tile remembers per member, so it needs somebody to be named.
    store = walletStore({ gradidoID: 'member-1' })

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {},
      },
    })

    window.scrollTo = vi.fn()

    wrapper = mountOverview()
  })

  describe('mount', () => {
    it.skip('has a community news element', () => {
      expect(wrapper.find('div.community-news').exists()).toBe(true)
    })
  })

  /**
   * ⛔ The tile hangs on nothing. The two tiles that were here hang on HumHub and the old GMS
   * search, and with both switched off -- the default of every fresh installation -- the
   * overview used to be empty. This line in the template is wiring: nothing else notices if
   * it goes.
   */
  describe('the tile for showing Gradido to somebody', () => {
    it('is there with neither of the two old services switched on', () => {
      expect(wrapper.findComponent(ShowFriendsTile).exists()).toBe(true)
      expect(wrapper.find('.card-circles').exists()).toBe(false)
      expect(wrapper.find('.card-user-search').exists()).toBe(false)
    })

    it('stands before the two old tiles where they are switched on', () => {
      config.HUMHUB_ACTIVE = true
      config.GMS_LEGACY_ACTIVE = true
      const html = mountOverview().html()

      const tile = html.indexOf('data-test="show-friends-tile"')
      expect(tile).toBeGreaterThanOrEqual(0)
      expect(tile).toBeLessThan(html.indexOf('class="card-circles"'))
      expect(tile).toBeLessThan(html.indexOf('class="card-user-search"'))
    })
  })

  /**
   * The overview is where a member lands after the first creation, and this tile is the one
   * thing there that leads to the map. Like the line above, it is wiring: who it shows to
   * is the tile's own spec, that the page carries it at all is only held here.
   */
  describe('the invitation onto the map', () => {
    // The store of this file names a member and nothing else: no home, no permission.
    it('stands above everything else for a member who is not on the map', () => {
      config.MATCHING_ACTIVE = true
      // A device that has asked before, so nothing is held back -- see below.
      window.localStorage.setItem(MAP_MEMBER_COUNT_STORAGE_KEY, 'null')
      const page = mountOverview()
      const html = page.html()

      expect(page.findComponent(MatchingTile).exists()).toBe(true)
      const invitation = html.indexOf('data-test="map-invitation-tile"')
      expect(invitation).toBeGreaterThanOrEqual(0)
      expect(invitation).toBeLessThan(html.indexOf('data-test="show-friends-tile"'))
    })

    it('leaves nothing on the page where matching is switched off', () => {
      expect(wrapper.html()).not.toContain('data-test="map-invitation-tile"')
      // The tile for showing Gradido is untouched by it.
      expect(wrapper.findComponent(ShowFriendsTile).exists()).toBe(true)
    })

    /**
     * The invitation opens with how many people stand on the map, and with that number its
     * heading is a line taller. A number arriving after the tiles are painted would push
     * every one of them down under a finger -- so on a device that has never heard it, the
     * page holds ALL its tiles back for the one answer, and then paints them together. What
     * waits and for how long is the composable's own spec; that the page obeys it, and hands
     * the number on, is only held here.
     */
    describe('and the number it opens with', () => {
      const tiles = (page) => page.find('[data-test="overview-tiles"]')
      const answer = (data) => asked.get(mapMemberCount).result({ data })

      beforeEach(() => {
        config.MATCHING_ACTIVE = true
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('holds every tile back until the number is in, then paints them together', async () => {
        const page = mountOverview()
        expect(tiles(page).exists()).toBe(false)
        expect(page.findComponent(ShowFriendsTile).exists()).toBe(false)
        expect(page.findComponent(MatchingTile).exists()).toBe(false)

        answer({ mapMemberCount: 773 })
        await nextTick()

        expect(tiles(page).exists()).toBe(true)
        expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
        expect(page.findComponent(MatchingTile).props('count')).toBe(773)
      })

      it('paints them without the number when the answer takes too long', async () => {
        vi.useFakeTimers()
        const page = mountOverview()
        expect(tiles(page).exists()).toBe(false)

        vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS)
        await nextTick()

        expect(tiles(page).exists()).toBe(true)
        expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
        expect(page.findComponent(MatchingTile).props('count')).toBeNull()
      })

      it('paints them at once with what the device heard before', () => {
        window.localStorage.setItem(MAP_MEMBER_COUNT_STORAGE_KEY, '773')

        const page = mountOverview()

        expect(tiles(page).exists()).toBe(true)
        expect(page.findComponent(MatchingTile).props('count')).toBe(773)
      })

      it('leaves the tile as it is when a newer number arrives during the visit', async () => {
        window.localStorage.setItem(MAP_MEMBER_COUNT_STORAGE_KEY, '773')
        const page = mountOverview()

        answer({ mapMemberCount: 781 })
        await nextTick()

        expect(page.findComponent(MatchingTile).props('count')).toBe(773)
      })

      // Everybody else: no question, no wait. `wrapper` is the page of a wallet without
      // matching, mounted before each case.
      it('asks nothing and holds nothing back where there is no invitation', () => {
        expect(tiles(wrapper).exists()).toBe(true)
        expect(asked.has(mapMemberCount)).toBe(false)
      })

      // The other question is for a member who is on the map. Nobody is both.
      it('does not ask about entries for a member who is not on the map', () => {
        mountOverview()

        expect(asked.has(mapMemberCount)).toBe(true)
        expect(asked.has(listMatchingEntries)).toBe(false)
      })
    })
  })

  /**
   * The next step of the same tile, for a member who stands on the map: no entry yet invites
   * to the first one, one or two leave a line, three end it -- three shapes of three heights.
   * So the page decides this once as well: on a device that has never heard about this
   * member it holds ALL its tiles back for the one answer. What waits and for how long is
   * the composable's own spec (useOwnMatchingEntries); that the page obeys it, and hands the
   * answer on, is only held here.
   */
  describe('the invitation to enter something, for a member who is on the map', () => {
    const tiles = (page) => page.find('[data-test="overview-tiles"]')
    const answer = (length) =>
      asked.get(listMatchingEntries).result({
        data: { listMatchingEntries: Array.from({ length }, (_, i) => ({ uuid: `e-${i}` })) },
      })
    // The key the composable keeps for the member of this page's store.
    const heardBefore = (raw) => window.localStorage.setItem('own-matching-entries:member-1', raw)

    beforeEach(() => {
      config.MATCHING_ACTIVE = true
      store = walletStore({
        gradidoID: 'member-1',
        gmsAllowed: true,
        userLocation: { latitude: 49.28, longitude: 9.69 },
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('holds every tile back until the entries are counted, then paints them together', async () => {
      const page = mountOverview()
      expect(tiles(page).exists()).toBe(false)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(false)
      expect(page.findComponent(MatchingTile).exists()).toBe(false)

      answer(0)
      await nextTick()

      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
      expect(page.findComponent(MatchingTile).props('entries')).toBe(0)
      // Above everything else, where the invitation onto the map stood before.
      const html = page.html()
      const invitation = html.indexOf('data-test="matching-entries-tile"')
      expect(invitation).toBeGreaterThanOrEqual(0)
      expect(invitation).toBeLessThan(html.indexOf('data-test="show-friends-tile"'))
    })

    // Not known is not "none": the other tiles come, this one stays away for the visit.
    it('paints the others without it when the answer takes too long', async () => {
      vi.useFakeTimers()
      const page = mountOverview()
      expect(tiles(page).exists()).toBe(false)

      vi.advanceTimersByTime(FIRST_ANSWER_PATIENCE_MS)
      await nextTick()

      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
      expect(page.findComponent(MatchingTile).props('entries')).toBeNull()
      expect(page.find('.matching-tile').exists()).toBe(false)
    })

    it('paints them at once with what the device heard before', () => {
      heardBefore('1')

      const page = mountOverview()

      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(MatchingTile).props('entries')).toBe(1)
      expect(page.find('[data-test="matching-more-tile"]').exists()).toBe(true)
    })

    it('leaves the tile as it is when the server says otherwise during the visit', async () => {
      heardBefore('0')
      const page = mountOverview()

      answer(2)
      await nextTick()

      expect(page.findComponent(MatchingTile).props('entries')).toBe(0)
      expect(page.find('[data-test="matching-entries-tile"]').exists()).toBe(true)
    })

    it('shows nothing of it, and asks nothing, for a member who has arrived', () => {
      heardBefore('3')

      const page = mountOverview()

      expect(tiles(page).exists()).toBe(true)
      expect(page.find('.matching-tile').exists()).toBe(false)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
      expect(asked.has(listMatchingEntries)).toBe(false)
    })

    // The other question is for a member who is not on the map. Nobody is both, so the two
    // waits never add up.
    it('does not ask how many people stand on the map', () => {
      mountOverview()

      expect(asked.has(listMatchingEntries)).toBe(true)
      expect(asked.has(mapMemberCount)).toBe(false)
    })
  })
})
