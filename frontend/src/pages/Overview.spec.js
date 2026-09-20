import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createStore } from 'vuex'
import Overview from './Overview.vue'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'

// Mutable, so each case can say which of the two old services is switched on. Overview reads
// the flags in computed properties, i.e. at render time.
const config = vi.hoisted(() => ({ HUMHUB_ACTIVE: false, GMS_LEGACY_ACTIVE: false }))
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
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn().mockReturnValue({
    result: queryResult,
    onResult: vi.fn(),
    onError: vi.fn(),
    loading: { value: false },
    error: { value: null },
    refetch: vi.fn(),
  }),
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
        },
      },
    })

  beforeEach(() => {
    config.HUMHUB_ACTIVE = false
    config.GMS_LEGACY_ACTIVE = false
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })
    // The tile remembers per member, so it needs somebody to be named.
    store = createStore({ state: { gradidoID: 'member-1' } })

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
})
