import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Overview from './Overview.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'

vi.mock('@/components/Overview/CommunityNews', () => ({
  default: {
    name: 'CommunityNews',
    template: '<div class="community-news"></div>',
  },
}))

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn().mockReturnValue({
    result: { value: {} },
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

describe('Overview', () => {
  let wrapper
  let router
  let i18n

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {},
      },
    })

    window.scrollTo = vi.fn()

    wrapper = mount(Overview, {
      global: {
        plugins: [router, i18n],
        stubs: {
          RouterLink: true,
        },
      },
    })
  })

  describe('mount', () => {
    it('has a community news element', () => {
      expect(wrapper.find('div.community-news').exists()).toBe(true)
    })
  })
})
