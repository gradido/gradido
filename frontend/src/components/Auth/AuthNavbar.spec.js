// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { walletStore } from '@test/walletStore'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nextTick, reactive } from 'vue'
import { useWalletStore } from '@/store/useWalletStore'
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

// A session that runs: a token, and its end an hour away by this device's clock -- what
// `sessionRuns` (routes/guards.js) asks, with five seconds to spare.
const inSeconds = (seconds) => Math.floor(Date.now() / 1000) + seconds
const running = () => ({ token: 'a-token', tokenTime: inSeconds(3600) })

// With a gradidoID the member is signed in, with a session that runs. `member` is what the
// sign-in leaves in the store besides: the user name, the real names, the small picture
// (avatar, base64 without a prefix) -- and it may end the session (`tokenTime`). `pinia` lets a
// spec keep the store.
const mountWith = (darkMode, gradidoID = null, member = {}, pinia = null) =>
  mount(AuthNavbar, {
    global: {
      plugins: [
        pinia ?? walletStore({ darkMode, gradidoID, ...(gradidoID ? running() : {}), ...member }),
      ],
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

    // The store keeps the member after a session has run out without a sign-out; that is no
    // session, for the logo as for the links (Bernd, 06.11.2026).
    it('with a session that has run out, to the start page, as signed out', () => {
      const wrapper = mountWith(false, 'a-member', { tokenTime: inSeconds(-60) })
      expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(0)
      for (const home of homes(wrapper)) {
        expect(home.attributes('href')).toBe('https://ki-playground.gradido.net/')
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

  it('signed out: keeps both links on every width', () => {
    const nav = mountWith(true).find('.navbar-nav')
    expect(nav.classes()).not.toContain('d-none')
    expect(nav.findAll('.nav-item').map((item) => item.text())).toEqual(['signup', 'signin'])
    expect(nav.find('[data-test="auth-to-account"]').exists()).toBe(false)
  })

  /**
   * ZE-038, L1a (Bernd, 06.11.2026): back at a thank-you link after signing in, the bar still
   * said "Register | Sign in", and nothing on the page said that a member was signed in. With a
   * session the bar shows the member instead: their own circle and "To my account", one link to
   * the overview. The page under the bar stays the same for everybody (PS-011).
   */
  describe('with a session', () => {
    const BERND = { username: 'Bernd', firstName: 'Bernd', lastName: 'Hückstädt' }
    const toAccount = (wrapper) => wrapper.find('[data-test="auth-to-account"]')

    it("shows the member's face and 'Zum Konto', no sign-up and no sign-in", () => {
      const nav = mountWith(true, 'a-member', BERND).find('.navbar-nav')
      const items = nav.findAll('.nav-item')
      expect(items).toHaveLength(1)
      expect(items[0].attributes('data-test')).toBe('auth-to-account')
      expect(items[0].find('.app-avatar').exists()).toBe(true)
      expect(items[0].text()).toContain('auth.toAccount')
      expect(nav.text()).not.toContain('signup')
      expect(nav.text()).not.toContain('signin')
    })

    // To the overview, where the logo leads with a session too: nothing of the page's address
    // goes along, not the link's code and not a guarantor code.
    it('leads to the overview, and takes nothing of the page address along', () => {
      route.current = {
        params: { code: 'abc123', alias: 'bernd' },
        query: { guarantor: 'c', referrer: 'bernd' },
      }
      try {
        const links = mountWith(true, 'a-member', BERND)
          .findAllComponents({ name: 'NavItem' })
          .map((item) => item.props('to'))
        expect(links).toEqual(['/overview'])
      } finally {
        route.current = { params: {}, query: {} }
      }
    })

    it('shows the picture where the store holds one, the letters otherwise', () => {
      const withPicture = toAccount(mountWith(true, 'a-member', { ...BERND, avatar: 'QUJD' }))
      expect(withPicture.find('img[src^="data:image/jpeg;base64,"]').exists()).toBe(true)
      expect(withPicture.find('img').attributes('src')).toBe('data:image/jpeg;base64,QUJD')
      expect(withPicture.find('.app-avatar').text()).toBe('')

      const withLetters = toAccount(mountWith(true, 'a-member', BERND))
      expect(withLetters.find('img').exists()).toBe(false)
      expect(withLetters.find('.app-avatar').text()).toBe('BE')
    })

    // As the bar of the signed-in wallet draws it (Navbar.vue): the letters from the user name,
    // the colour from the real initials (AS-010) -- the colour the member's circle has
    // everywhere else -- and white letters. 30px: the line it stands in is 44px high.
    it('draws the circle 30px, its letters from the user name, its colour from the real initials', () => {
      const circle = mountWith(false, 'a-member', BERND).findComponent({ name: 'AppAvatar' })
      expect(circle.props('size')).toBe(30)
      expect(circle.props('initials')).toBe('BE')
      expect(circle.props('colorSeed')).toBe('BH')
      expect(circle.props('color')).toBe('#fff')
    })

    // One link, its name the word: the circle is no stop of its own for a keyboard (a plain div,
    // no button) and says nothing to a screen reader -- its letters would only spell the name.
    it('hides the circle from a screen reader and gives it no stop of its own', () => {
      const circle = toAccount(mountWith(true, 'a-member', BERND)).find('.app-avatar')
      expect(circle.element.tagName).toBe('DIV')
      expect(circle.attributes('aria-hidden')).toBe('true')
      expect(circle.attributes('tabindex')).toBeUndefined()
    })

    it('goes back to both links when the member signs out', async () => {
      const pinia = walletStore({ darkMode: true, gradidoID: 'a-member', ...running(), ...BERND })
      const wrapper = mountWith(true, 'a-member', BERND, pinia)
      expect(toAccount(wrapper).exists()).toBe(true)
      useWalletStore(pinia).setGradidoID(null)
      await nextTick()
      expect(toAccount(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('.navbar-nav .nav-item').map((item) => item.text())).toEqual([
        'signup',
        'signin',
      ])
    })

    /**
     * Bernd, 06.11.2026, after coderabbit's note: the store keeps the member after a session has
     * run out without a sign-out, and the next start -- `/`, which leads to the sign-in -- showed
     * the face and "Zum Konto" above the sign-in form, to whoever used the browser next. A session
     * that has run out is no session: the bar says "Register | Sign in" again.
     */
    it('a session that has run out shows both links, as signed out', () => {
      const wrapper = mountWith(true, 'a-member', { ...BERND, tokenTime: inSeconds(-60) })
      expect(toAccount(wrapper).exists()).toBe(false)
      expect(wrapper.findAll('.navbar-nav .nav-item').map((item) => item.text())).toEqual([
        'signup',
        'signin',
      ])
    })

    // The margin the router's guard allows too (`sessionRuns`): five seconds before its end a
    // session counts as over, so the bar does not offer a way the guard would end at once.
    it('a session that ends within five seconds counts as run out', () => {
      const endingIn = (seconds) =>
        toAccount(mountWith(true, 'a-member', { ...BERND, tokenTime: inSeconds(seconds) }))
      expect(endingIn(4).exists()).toBe(false)
      expect(endingIn(60).exists()).toBe(true)
    })

    it('a member without a token is no session', () => {
      expect(toAccount(mountWith(true, 'a-member', { ...BERND, token: null })).exists()).toBe(false)
    })

    // Within the signed-out frame the bar stays mounted from one page to the next. A session that
    // runs out on its own while a page stays open -- nothing changes but the clock -- is asked
    // again on the next navigation (`/u/…` → "Create account" → `/register`). coderabbit, #4247.
    it('asks again on every navigation, for a session that ran out while the page stayed open', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-06T19:00:00Z'))
      const page = reactive({ params: { alias: 'anna' }, query: {}, fullPath: '/u/anna' })
      route.current = page
      try {
        const wrapper = mountWith(true, 'a-member', { ...BERND, tokenTime: inSeconds(60) })
        expect(toAccount(wrapper).exists()).toBe(true)

        vi.setSystemTime(new Date('2026-11-06T19:05:00Z'))
        await nextTick()
        // nothing redraws the bar on a timer
        expect(toAccount(wrapper).exists()).toBe(true)

        page.fullPath = '/register'
        await nextTick()
        expect(toAccount(wrapper).exists()).toBe(false)
        expect(wrapper.findAll('.navbar-nav .nav-item').map((item) => item.text())).toEqual([
          'signup',
          'signin',
        ])
      } finally {
        route.current = { params: {}, query: {} }
        vi.useRealTimers()
      }
    })

    // A sign-in on the page (the thank-you link's "I already have an account") gives the store a
    // session: the bar shows the member without being drawn anew.
    it('shows the member as soon as a session runs on the page', async () => {
      const pinia = walletStore({ darkMode: true, gradidoID: 'a-member', ...BERND })
      const wrapper = mountWith(true, 'a-member', BERND, pinia)
      expect(toAccount(wrapper).exists()).toBe(false)
      useWalletStore(pinia).$patch(running())
      await nextTick()
      expect(toAccount(wrapper).exists()).toBe(true)
    })
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

    // ZE-038, L1a: face and word in one line, centred, 8px apart -- on every width, so outside
    // the two @media blocks. The circle gives back in its margins what it is taller than the
    // line (1.5em), so the link keeps the height of the two words it replaces.
    it('sets the face and the word in one line, 8px apart, without growing the link', () => {
      expect(css).toMatch(
        /\.authHeader \.toAccount :global\(\.nav-link\)\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*gap:\s*8px;/,
      )
      expect(css).toMatch(/\.toAccountFace\s*\{[^}]*margin-block:\s*calc\(0\.75em - 15px\);/)
      expect(media('1024.98px')).not.toMatch(/toAccount/)
      expect(media('767.98px')).not.toMatch(/toAccount/)
    })

    // Hover marks the word, as it marks the two words without a session: the underline, and the
    // brighter green in dark mode. The circle -- letters or the member's picture -- stays as it is.
    it('marks only the word on hover, in both modes', () => {
      expect(css).toMatch(
        /\.authHeader \.toAccount :global\(\.nav-link\):hover\s*\{[^}]*text-decoration:\s*none;/,
      )
      expect(css).toMatch(
        /\.authHeader \.toAccount :global\(\.nav-link\):hover \.toAccountWord\s*\{[^}]*text-decoration:\s*underline;/,
      )
      expect(css).toMatch(
        /:global\(#app\.dark-mode\) \.toAccount :global\(\.nav-link\):hover\s*\{[^}]*filter:\s*none;/,
      )
      expect(css).toMatch(
        /:global\(#app\.dark-mode\) \.toAccount :global\(\.nav-link\):hover \.toAccountWord\s*\{[^}]*filter:\s*brightness\(1\.35\);/,
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
