// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BImg, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import AuthNavbar from './AuthNavbar.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('../Menu/NavItem.vue', () => ({
  default: { name: 'NavItem', props: ['to'], template: '<li class="nav-item"><slot /></li>' },
}))

const mountWith = (darkMode) =>
  mount(AuthNavbar, {
    global: {
      plugins: [createStore({ state: { darkMode } })],
      components: { BImg, BNavbar, BNavbarBrand, BNavbarNav },
      stubs: { BCollapse: { template: '<div class="navbar-collapse"><slot /></div>' } },
      mocks: { $t: (key) => key },
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
    expect(logo.classes()).toContain('d-lg-none')
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

  it('keeps both links on every width', () => {
    const nav = mountWith(true).find('.navbar-nav')
    expect(nav.classes()).not.toContain('d-none')
    expect(nav.findAll('.nav-item').map((item) => item.text())).toEqual(['signup', 'signin'])
  })

  describe('the stylesheet', () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'AuthNavbar.vue'),
      'utf8',
    )
    // Comments name the same properties; only declarations may count.
    const css = source
      .slice(source.indexOf('<style'), source.indexOf('</style>'))
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const media = (width) => {
      const at = css.indexOf(`(width <= ${width})`)
      return at < 0 ? '' : css.slice(at, css.indexOf('\n}', at))
    }

    it('lets the row below lg be as tall as its logo and links', () => {
      expect(media('1024.98px')).toMatch(/\.auth-header\s*\{[^}]*height:\s*auto;/)
      expect(media('1024.98px')).toMatch(/\.auth-header > nav\s*\{[^}]*flex-wrap:\s*wrap;/)
    })

    it('makes the logo 32px high on a phone, so the links fit beside it', () => {
      expect(media('767.98px')).toMatch(/\.auth-logo-small\s*\{[^}]*height:\s*32px;/)
    })
  })
})
