import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { walletStore } from '@test/walletStore'
import Overview from './Overview.vue'
import MatchingTile from '@/components/Overview/MatchingTile'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import ThanksArrivalTile from '@/components/Overview/ThanksArrivalTile'
import {
  FIRST_ANSWER_PATIENCE_MS,
  MAP_MEMBER_COUNT_STORAGE_KEY,
} from '@/composables/useMapMemberCount'
import { THANKS_ARRIVAL_PATIENCE_MS } from '@/composables/useThanksArrivals'
import { listMatchingEntries, mapMemberCount } from '@/graphql/queries'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'

// Mutable, so each case can say whether HumHub is switched on. Overview reads the flags in
// computed properties, i.e. at render time.
const config = vi.hoisted(() => ({
  HUMHUB_ACTIVE: false,
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
// What the server has answered already, by document: given at once to whoever listens. The
// thank-yous received are asked about on every opening, and the tiles wait for them -- so each case
// begins with that question answered (no thank-you), unless it is about it.
const answered = vi.hoisted(() => new Map())
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document) => {
    const question = { result: null, error: null }
    asked.set(document, question)
    return {
      result: queryResult,
      onResult: (callback) => {
        question.result = callback
        if (answered.has(document)) callback(answered.get(document))
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

// The thank-you tile says a refused reaction with a toast; nothing here presses an emoji.
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}))

vi.mock('@/components/Overview/CardCircles', () => ({
  default: {
    name: 'CardCircles',
    template: '<div class="card-circles"></div>',
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
          IIonLayersSharp: true,
          IMdiEmoticonHappyOutline: true,
          IMdiPlus: true,
          // The window the tile opens is its own component with its own spec; this file
          // is about which tiles the page shows and in what order.
          ContactWindow: true,
        },
      },
    })

  beforeEach(() => {
    asked.clear()
    answered.clear()
    answered.set(transactionsQuery, { data: { transactionList: { transactions: [] } } })
    window.localStorage.clear()
    config.HUMHUB_ACTIVE = false
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
      // The amount in the thank-you tile is written with the wallet's own number format.
      numberFormats: {
        en: {
          ungroupedDecimal: {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false,
          },
        },
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
   * ⛔ The tile hangs on nothing. The tile of the circles hangs on HumHub, and with it switched
   * off -- the default of every fresh installation -- the overview used to be empty. This line
   * in the template is wiring: nothing else notices if it goes.
   */
  describe('the tile for showing Gradido to somebody', () => {
    it('is there with HumHub switched off', () => {
      expect(wrapper.findComponent(ShowFriendsTile).exists()).toBe(true)
      expect(wrapper.find('.card-circles').exists()).toBe(false)
    })

    it('stands before the tile of the circles where HumHub is switched on', () => {
      config.HUMHUB_ACTIVE = true
      const html = mountOverview().html()

      const tile = html.indexOf('data-test="show-friends-tile"')
      expect(tile).toBeGreaterThanOrEqual(0)
      expect(tile).toBeLessThan(html.indexOf('class="card-circles"'))
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

      // Everybody else: no question about the number, and no wait for it. `wrapper` is the page
      // of a wallet without matching, mounted before each case.
      it('asks nothing about the number, and holds nothing back for it, where there is no invitation', () => {
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

  /**
   * The thank-yous received in the last seven days that have no reaction yet (W3) stand above
   * everything else, and the overview asks about them on every opening -- so on every opening it
   * holds ALL its tiles back for that one answer, and then paints them together. Which thank-yous,
   * and how long it waits, is the composable's own spec (useThanksArrivals); that the page obeys
   * it, and hands them on, is only held here.
   */
  describe('the thank-yous received', () => {
    const tiles = (page) => page.find('[data-test="overview-tiles"]')
    const question = () => asked.get(transactionsQuery)
    const received = (id, extra = {}) => ({
      id,
      typeId: 'RECEIVE',
      amount: '10',
      balanceDate: new Date(Date.now() - id * 60 * 1000).toISOString(),
      memo: '',
      linkedUser: {
        alias: `giver${id}`,
        gradidoID: `giver-${id}`,
        communityUuid: 'home-uuid',
        avatarUpdatedAt: null,
      },
      greeting: null,
      picture: null,
      reaction: null,
      canReact: true,
      ...extra,
    })
    const answer = (transactions) =>
      question().result({ data: { transactionList: { transactions } } })

    beforeEach(() => {
      answered.delete(transactionsQuery)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('holds every tile back until they are in, then paints them together, theirs on top', async () => {
      const page = mountOverview()
      expect(tiles(page).exists()).toBe(false)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(false)

      answer([received(1), received(2)])
      await nextTick()

      expect(tiles(page).exists()).toBe(true)
      expect(
        page
          .findComponent(ThanksArrivalTile)
          .props('thanks')
          .map((one) => one.id),
      ).toEqual([1, 2])
      const html = page.html()
      const thanks = html.indexOf('data-test="thanks-arrival-tile"')
      expect(thanks).toBeGreaterThanOrEqual(0)
      expect(thanks).toBeLessThan(html.indexOf('data-test="show-friends-tile"'))
    })

    it('stands above the invitation onto the map as well', async () => {
      config.MATCHING_ACTIVE = true
      window.localStorage.setItem(MAP_MEMBER_COUNT_STORAGE_KEY, 'null')
      const page = mountOverview()

      answer([received(1)])
      await nextTick()

      const html = page.html()
      const thanks = html.indexOf('data-test="thanks-arrival-tile"')
      expect(thanks).toBeGreaterThanOrEqual(0)
      expect(thanks).toBeLessThan(html.indexOf('data-test="map-invitation-tile"'))
    })

    // The questions go out together; the tiles wait for the last answer of them.
    it('waits for them and for the number on the map alike', async () => {
      config.MATCHING_ACTIVE = true
      const page = mountOverview()

      answer([received(1)])
      await nextTick()
      expect(tiles(page).exists()).toBe(false)

      asked.get(mapMemberCount).result({ data: { mapMemberCount: 773 } })
      await nextTick()
      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(ThanksArrivalTile).exists()).toBe(true)
    })

    it('hands on only what the rule chose', async () => {
      const page = mountOverview()

      answer([received(1, { reaction: '❤️' }), received(2), received(3, { canReact: false })])
      await nextTick()

      expect(
        page
          .findComponent(ThanksArrivalTile)
          .props('thanks')
          .map((one) => one.id),
      ).toEqual([2])
    })

    it('puts nothing in their place where there is no thank-you to show', async () => {
      const page = mountOverview()

      answer([received(1, { reaction: '❤️' })])
      await nextTick()

      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(ThanksArrivalTile).exists()).toBe(false)
      expect(tiles(page).html()).not.toContain('thanks-arrival')
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
    })

    it('paints the others when the question fails', async () => {
      const page = mountOverview()

      question().error(new Error('Network error'))
      await nextTick()

      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)
      expect(page.findComponent(ThanksArrivalTile).exists()).toBe(false)
    })

    // ⛔ And an answer that comes after the tiles are painted changes nothing: a tile that came
    // now would push every other one down.
    it('paints the others without them when the answer takes too long, and keeps it so', async () => {
      vi.useFakeTimers()
      const page = mountOverview()

      vi.advanceTimersByTime(THANKS_ARRIVAL_PATIENCE_MS)
      await nextTick()
      expect(tiles(page).exists()).toBe(true)
      expect(page.findComponent(ShowFriendsTile).exists()).toBe(true)

      answer([received(1)])
      await nextTick()
      expect(page.findComponent(ThanksArrivalTile).exists()).toBe(false)
    })
  })
})
