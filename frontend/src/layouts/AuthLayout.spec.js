import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { __bannerResult } from '@vue/apollo-composable'
import AuthLayout from './AuthLayout'
import {
  BAvatar,
  BButton,
  BCard,
  BCardBody,
  BCol,
  BImg,
  BLink,
  BPopover,
  BRow,
} from 'bootstrap-vue-next'

// Mock child components
vi.mock('@/components/Auth/AuthNavbar', () => ({
  default: { name: 'AuthNavbar', template: '<div>AuthNavbar</div>' },
}))
vi.mock('@/components/Auth/AuthCarousel', () => ({
  default: { name: 'AuthCarousel', template: '<div>AuthCarousel</div>' },
}))
vi.mock('@/components/LanguageSwitch2', () => ({
  default: { name: 'LanguageSwitch2', template: '<div>LanguageSwitch2</div>' },
}))
vi.mock('@/components/Auth/AuthFooter', () => ({
  default: { name: 'AuthFooter', template: '<div>AuthFooter</div>' },
}))

// The banner query, with a result each test can set.
vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue')
  const bannerResult = ref(null)
  return {
    useQuery: () => ({ result: bannerResult, loading: ref(false) }),
    __bannerResult: bannerResult,
  }
})

// Mock CONFIG
vi.mock('@/config', () => ({
  default: {
    COMMUNITY_NAME: 'Test Community',
  },
}))

describe('AuthLayout', () => {
  let wrapper
  const createVuexStore = () => {
    return createStore({
      state: {
        project: '',
      },
      actions: {
        project: vi.fn(),
      },
      mutations: {
        project: vi.fn(),
      },
    })
  }

  const createWrapper = () => {
    return mount(AuthLayout, {
      global: {
        components: {
          BLink,
          BButton,
          BRow,
          BCol,
          BCard,
          BCardBody,
          BAvatar,
          BImg,
          BPopover,
        },
        plugins: [createVuexStore()],
        mocks: {
          $i18n: {
            locale: 'en',
          },
          $t: (key) => key,
          $route: {
            meta: {
              hideFooter: false,
            },
          },
        },
        stubs: {
          RouterView: true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('.auth-template').exists()).toBe(true)
    })

    it('has Component AuthNavbar', () => {
      expect(wrapper.findComponent({ name: 'AuthNavbar' }).exists()).toBe(true)
    })

    it('has Component AuthCarousel', () => {
      expect(wrapper.findComponent({ name: 'AuthCarousel' }).exists()).toBe(true)
    })

    it('has Component AuthFooter', () => {
      expect(wrapper.findComponent({ name: 'AuthFooter' }).exists()).toBe(true)
    })

    it('has no sidebar', () => {
      expect(wrapper.find('nav#sidenav-main').exists()).toBe(false)
    })

    it('displays the community name', () => {
      expect(wrapper.find('.h1').text()).toBe('Test Community')
    })

    it('test size in setTextSize', async () => {
      const mockEl = { style: {} }
      const querySelector = vi.spyOn(document, 'querySelector').mockReturnValue(mockEl)
      // Left in place, it hands every later mount's popover this object for its target --
      // so it goes back even when the assertion fails.
      try {
        await wrapper.vm.setTextSize(0.85)
        expect(mockEl.style.fontSize).toBe('0.85rem')
      } finally {
        querySelector.mockRestore()
      }
    })
  })

  describe('when hideFooter is true', () => {
    beforeEach(() => {
      wrapper = mount(AuthLayout, {
        global: {
          plugins: [createVuexStore()],
          mocks: {
            $i18n: {
              locale: 'en',
            },
            $t: (key) => key,
            $route: {
              meta: {
                hideFooter: true,
              },
            },
          },
          stubs: {
            BLink: true,
            BButton: true,
            BRow: true,
            BCol: true,
            BCard: true,
            BCardBody: true,
            BAvatar: true,
            BImg: true,
            BPopover: true,
            RouterView: true,
          },
        },
      })
    })

    it('does not render AuthFooter', () => {
      expect(wrapper.findComponent({ name: 'AuthFooter' }).exists()).toBe(false)
    })
  })

  // Bernd, 21.09.2026: below md the coin slid into the card with the two links under it, 176px
  // above the form. The logo top left carries the coin, and the links stand up there with it.
  describe('the card', () => {
    beforeEach(() => {
      __bannerResult.value = null
    })

    it('holds neither a coin nor the sign-in links', () => {
      wrapper = createWrapper()
      const card = wrapper.find('.card')
      expect(card.findAll('.b-avatar')).toHaveLength(0)
      expect(card.html()).not.toContain('gradido_coin')
      expect(card.html()).not.toContain('AuthNavbarSmall')
    })

    it("still shows a project's banner on a phone, where the greeting is not shown", async () => {
      __bannerResult.value = { projectBrandingBanner: '/banner.jpg' }
      wrapper = createWrapper()
      const banner = wrapper.find('.card img[alt="project banner"]')
      expect(banner.exists()).toBe(true)
      expect(banner.attributes('src')).toBe('/banner.jpg')
      expect(banner.element.closest('.row').classList).toContain('d-md-none')
    })
  })

  // Bernd, 22.09.2026: on a phone the greeting stood pressed between the top row and the card,
  // at 13.6px, although it carries the page's message. jsdom lays nothing out, so the measures
  // are read from the stylesheet -- with the comments stripped, which name them as well.
  describe('the greeting', () => {
    const sfc = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'AuthLayout.vue'),
      'utf8',
    )
    const css = sfc
      .slice(sfc.indexOf('<style'), sfc.indexOf('</style>'))
      .replace(/\/\*[\s\S]*?\*\//g, '')
    // A media block holds rules one level deep; what stands outside all of them holds on
    // every width.
    const mediaBlock = /@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g
    const phone = [...css.matchAll(mediaBlock)]
      .filter(([, condition]) => condition.includes('767.98px'))
      .map(([, , body]) => body)
      .join('\n')
    const everyWidth = css.replace(mediaBlock, '')
    const rule = (text, selector) =>
      [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
        ([, written]) => written.trim() === selector,
      )?.[2]

    beforeEach(() => {
      __bannerResult.value = null
      wrapper = createWrapper()
    })

    it('stands 16px below the top row on a phone, as far below it as before from md up', () => {
      expect(wrapper.find('.auth-greeting').classes()).toEqual(
        expect.arrayContaining(['mt-3', 'mt-md-5']),
      )
    })

    it('keeps its 16px letters where #app shrinks the text of a phone to 0.85rem', () => {
      expect(rule(everyWidth, '.auth-greeting')).toMatch(/font-size:\s*1rem;/)
    })

    it('stands 24px above the card, 40px on a phone', () => {
      const card = wrapper.find('.card')
      expect(card.classes()).toContain('auth-card')
      // No margin utility on the card: its !important would beat the stylesheet.
      expect(card.classes().filter((name) => /^m[tbyse]?-/.test(name))).toEqual([])
      expect(rule(everyWidth, '.auth-card')).toMatch(/margin-top:\s*1\.5rem;/)
      expect(rule(phone, '.auth-card')).toMatch(/margin-top:\s*2\.5rem;/)
    })
  })
})
