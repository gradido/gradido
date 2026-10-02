import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { __bannerResult } from '@vue/apollo-composable'
import AuthLayout from './AuthLayout'
import routes from '@/routes/routes'
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

  const createWrapper = (meta = { hideFooter: false }) => {
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
            meta,
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

    // The greeting is the `v-else` of the project banner: where a banner stands -- or is
    // still on its way -- there is no greeting, whatever the route says.
    it("gives way to a project's banner, on a route that says nothing about it", () => {
      __bannerResult.value = { projectBrandingBanner: '/banner.jpg' }
      wrapper = createWrapper()

      expect(wrapper.findAll('img[alt="project banner"]')).toHaveLength(2)
      expect(wrapper.find('.auth-greeting').exists()).toBe(false)
    })

    it('is there on a route that says nothing about it', () => {
      expect(wrapper.find('.auth-greeting').exists()).toBe(true)
      expect(wrapper.find('.auth-greeting').text()).toContain('welcome')
      expect(wrapper.find('.card').classes()).not.toContain('auth-card-without-greeting')
    })

    // ZE-020, F12: whoever opens a redeem link came for what the link holds. On a phone the
    // greeting took 114px above it; without it the thank-you starts on the first screen.
    describe('where the route leaves it out (meta.hideGreeting)', () => {
      const redeem = routes.find((route) => route.name === 'Redeem')

      beforeEach(() => {
        // The meta of the real route record: the flag is a word this file and routes.js
        // hand each other, and neither can import it from the other.
        wrapper = createWrapper(redeem.meta)
      })

      it('is the redeem route that leaves it out', () => {
        expect(redeem.path).toBe('/redeem/:code')
        expect(redeem.meta.hideGreeting).toBe(true)
      })

      it('is not rendered: neither the welcome nor the name of the community', () => {
        expect(wrapper.find('.auth-greeting').exists()).toBe(false)
        expect(wrapper.find('.h1').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('welcome')
        expect(wrapper.text()).not.toContain('Test Community')
        expect(wrapper.text()).not.toContain('1000thanks')
      })

      it('leaves the card, the page in it and the footer where they are', () => {
        expect(wrapper.find('.card.auth-card').exists()).toBe(true)
        // The switch of languages: the app resolves it by itself, here it stays a tag.
        expect(wrapper.find('.card language-switch-2').exists()).toBe(true)
        expect(wrapper.find('router-view-stub').exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'AuthFooter' }).exists()).toBe(true)
      })

      // The 40px above the card on a phone were the greeting's air. Without a greeting the
      // card stands 24px under the top row there, as it does from md up.
      it('lets the card stand 24px under the top row on a phone as well', () => {
        expect(wrapper.find('.card').classes()).toContain('auth-card-without-greeting')
        expect(rule(phone, '.auth-card.auth-card-without-greeting')).toMatch(
          /margin-top:\s*1\.5rem;/,
        )
        expect(rule(everyWidth, '.auth-card.auth-card-without-greeting')).toBeUndefined()
      })

      // The banner stands in the greeting's place from md up, and in the card on a phone.
      // Neither is the greeting, and the flag is about the greeting alone.
      it("leaves a project's banner as it is, above the card and in it", () => {
        __bannerResult.value = { projectBrandingBanner: '/banner.jpg' }
        wrapper = createWrapper(redeem.meta)

        const banners = wrapper.findAll('img[alt="project banner"]')
        expect(banners).toHaveLength(2)
        expect(banners[0].element.closest('.row').classList).toContain('d-md-block')
        expect(banners[1].element.closest('.card')).not.toBe(null)
        expect(wrapper.find('.auth-greeting').exists()).toBe(false)
        // The card keeps the measure it has under a banner: the flag changes nothing there.
        expect(wrapper.find('.card').classes()).not.toContain('auth-card-without-greeting')
      })
    })
  })
})
