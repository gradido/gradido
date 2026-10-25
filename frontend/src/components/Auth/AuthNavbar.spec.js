// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { walletStore } from '@test/walletStore'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AuthNavbar } from './AuthNavbar'

vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({ t: (key) => key }),
}))

const route = vi.hoisted(() => ({ current: { params: {}, query: {} } }))
vi.mock('vue-router', () => ({
  useRoute: () => route.current,
  useRouter: () => ({
    getRoutes: () => [
      { name: 'Login', path: '/login/:code?' },
      { name: 'Register', path: '/register/:code?' },
    ],
  }),
}))

// The community's own address, as each server has it in its configuration.
const config = vi.hoisted(() => ({ COMMUNITY_URL: 'https://ki-playground.gradido.net' }))
vi.mock('@/config', () => ({ default: config }))

vi.mock('../Menu/NavItem', () => ({
  NavItem: { name: 'NavItem', props: ['to'], template: '<li class="nav-item"><slot /></li>' },
}))

const mountWith = (darkMode, gradidoID = null) =>
  mount(AuthNavbar, {
    global: {
      plugins: [walletStore({ darkMode, gradidoID })],
      stubs: {
        BCollapse: { template: '<div class="navbar-collapse"><slot /></div>' },
        RouterLink: RouterLinkStub,
      },
    },
  })

// Bernd, 21.09.2026: below lg the three green leaves took the top of the page, the logo was
// gone, and the links sat in the card under a coin. Now the top looks as it does on the desk.
describe('AuthNavbar', () => {
  it('draws no leaves', () => {
    const sources = mountWith(true)
      .findAll('img')
      .map((img) => img.attributes('src'))
    expect(sources.some((src) => src.includes('Blaetter'))).toBe(false)
  })

  it('shows the logo on its own below lg, where no picture stands beside the form', () => {
    const logo = mountWith(true).find('[data-test="auth-logo-small"]')
    expect(logo.exists()).toBe(true)
    // Shown below lg only -- the class sits on the link around it since the logo leads home.
    expect(logo.element.closest('.d-lg-none')).not.toBeNull()
    // ⛔ Not inside the brand: dark mode darkens every image there that is not the logo on
    // the blob (the blob itself, to brightness 0.13), and this logo would go black with it.
    expect(logo.element.closest('.navbar-brand')).toBeNull()
  })

  it('takes the light-inked logo in dark mode and the full-size one in light mode', () => {
    expect(mountWith(true).find('[data-test="auth-logo-small"]').attributes('src')).toBe(
      '/img/brand/gradido-logo-white.png',
    )
    expect(mountWith(false).find('[data-test="auth-logo-small"]').attributes('src')).toBe(
      '/img/brand/gradido-logo.png',
    )
  })

  /**
   * Bernd, 14.10.2026: from a page without a session -- the link builder, an event link, the
   * registration -- the logo leads back to the start page: the community's own address, on
   * every server the wallet, which begins at the sign-in. With a session it leads to the
   * overview, as the logo of the signed-in wallet does.
   */
  describe('where the logo leads', () => {
    const homes = (wrapper) => [
      wrapper.find('[data-test="auth-home"]'),
      wrapper.find('[data-test="auth-home-small"]'),
    ]

    it('signed out, to the start page of this community, on the desk and on a phone', () => {
      for (const home of homes(mountWith(true))) {
        expect(home.element.tagName).toBe('A')
        expect(home.attributes('href')).toBe('https://ki-playground.gradido.net/')
        expect(home.attributes('target')).toBeUndefined()
      }
    })

    // Nothing of the page's address goes along: not the event link's sentence, not a code.
    it('takes nothing of the page address along', () => {
      route.current = {
        params: { alias: 'bernd' },
        query: { interest: 'Kongress X', guarantor: 'c' },
      }
      try {
        for (const home of homes(mountWith(true))) {
          expect(home.attributes('href')).toBe('https://ki-playground.gradido.net/')
        }
      } finally {
        route.current = { params: {}, query: {} }
      }
    })

    it('writes one slash where the address ends in one', () => {
      const before = config.COMMUNITY_URL
      config.COMMUNITY_URL = 'https://gdd.gradido.net/'
      try {
        expect(mountWith(false).find('[data-test="auth-home"]').attributes('href')).toBe(
          'https://gdd.gradido.net/',
        )
      } finally {
        config.COMMUNITY_URL = before
      }
    })

    it('with a session, to the overview', () => {
      const wrapper = mountWith(false, 'a-member')
      const links = wrapper.findAllComponents(RouterLinkStub)
      expect(links.map((link) => link.props('to'))).toEqual(['/overview', '/overview'])
      for (const home of homes(wrapper)) {
        expect(home.attributes('href')).not.toBe('https://ki-playground.gradido.net/')
      }
    })

    // Named by what it shows; the blob behind it says nothing.
    it('is named "Gradido" by its picture, and the blob is not read out', () => {
      const wrapper = mountWith(true)
      const [desk, phone] = homes(wrapper)
      expect(desk.findAll('img').map((img) => img.attributes('alt'))).toEqual(['Gradido', ''])
      expect(phone.findAll('img').map((img) => img.attributes('alt'))).toEqual(['Gradido'])
    })
  })

  it('keeps both links on every width', () => {
    const nav = mountWith(true).find('.navbar-nav')
    expect(nav.classes()).not.toContain('d-none')
    expect(nav.findAll('.nav-item').map((item) => item.text())).toEqual(['signup', 'signin'])
  })

  /**
   * E-017, the guarantor code. It is sealed for the name in the address it was scanned to, and
   * the registration checks it against `referrer`. This bar stands above the address page and
   * its links carry the query along - so they have to carry the name too.
   */
  describe('the guarantor code on an address page', () => {
    const CODE = '1790000600.seal-AAAA_BBBB'

    const linksOn = (current) => {
      route.current = current
      const links = mountWith(true)
        .findAllComponents({ name: 'NavItem' })
        .map((item) => item.props('to'))
      route.current = { params: {}, query: {} }
      return links
    }

    it('carries the name along with the code to the registration and the sign-in', () => {
      const links = linksOn({ params: { alias: 'bernd' }, query: { guarantor: CODE } })

      expect(links.map((link) => link.name)).toEqual(['Register', 'Login'])
      for (const link of links) {
        expect(link.query).toEqual({ referrer: 'bernd', guarantor: CODE })
      }
    })

    it('leaves a referrer that already stands in the query as it is', () => {
      const links = linksOn({
        params: { alias: 'bernd' },
        query: { guarantor: CODE, referrer: 'meisterbob' },
      })

      for (const link of links) {
        expect(link.query).toEqual({ referrer: 'meisterbob', guarantor: CODE })
      }
    })

    // Without a guarantor code the bar does not start naming a referrer on its own.
    it('adds no name where there is no guarantor code', () => {
      const links = linksOn({ params: { alias: 'bernd' }, query: {} })

      for (const link of links) {
        expect(link.query).toEqual({})
      }
    })

    // The detour over the sign-in: no address any more, name and code are in the query.
    it('adds no name where there is no address', () => {
      const links = linksOn({ params: {}, query: { guarantor: CODE } })

      for (const link of links) {
        expect(link.query).toEqual({ guarantor: CODE })
      }
    })
  })

  describe('the stylesheet', () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'AuthNavbar.module.scss'),
      'utf8',
    )
    // Comments name the same properties; only declarations may count.
    const css = source.replace(/\/\*[\s\S]*?\*\//g, '')
    const media = (width) => {
      const at = css.indexOf(`(width <= ${width})`)
      return at < 0 ? '' : css.slice(at, css.indexOf('\n}', at))
    }

    it('lets the row below lg be as tall as its logo and links', () => {
      expect(media('1024.98px')).toMatch(/\.authHeader\s*\{[^}]*height:\s*auto;/)
      expect(media('1024.98px')).toMatch(/\.authHeader > nav\s*\{[^}]*flex-wrap:\s*wrap;/)
    })

    // Bernd, 22.09.2026: on a phone the logo had become too small. It takes the size halfway
    // to the desk's, and the links go to the row below it -- on every phone, not only where
    // they no longer fit beside it.
    it('makes the logo 45px high on a phone', () => {
      expect(media('767.98px')).toMatch(/\.authLogoSmall\s*\{[^}]*height:\s*45px;/)
    })

    it('puts the links in a row of their own below the logo on a phone', () => {
      expect(media('767.98px')).toMatch(
        /\.authHeader :global\(#nav-collapse\)\s*\{[^}]*flex-basis:\s*100%;/,
      )
      // ... and from md up beside it, as before.
      expect(media('1024.98px')).not.toMatch(/flex-basis/)
    })

    // The logo is a link: a keyboard has to see it, in both modes.
    it('rings the logo when the keyboard is on it, in both modes', () => {
      expect(css).toMatch(/\.authHome:focus-visible\s*\{[^}]*outline:\s*2px solid #276e6f;/)
      expect(css).toMatch(
        /:global\(\.dark-mode\) \.authHome:focus-visible\s*\{[^}]*outline-color:\s*#8ed0d1;/,
      )
    })

    it('keeps the links on the right, below the logo as beside it', () => {
      const everyWidth = css.slice(0, css.indexOf('@media'))
      expect(everyWidth).toMatch(
        /\.authHeader :global\(#nav-collapse\)\s*\{[^}]*justify-content:\s*flex-end;/,
      )
      expect(mountWith(true).find('.navbar-nav').classes()).toContain('ms-auto')
    })
  })
})
