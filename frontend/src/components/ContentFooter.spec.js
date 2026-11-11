import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContentFooter from './ContentFooter'
import CONFIG from '@/config'
import { BCol, BNav, BNavItem, BRow } from 'bootstrap-vue-next'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// jsdom applies no scoped styles, so a rule is read in the source, comments first: the comments
// above the rules name their values too.
const styleSource = () =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ContentFooter.vue'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )

describe('ContentFooter', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: vi.fn((t, options) => (options ? [t, options] : t)),
  }

  const Wrapper = () => {
    return mount(ContentFooter, {
      global: {
        mocks,
        stubs: { BRow, BCol, BNav, BNavItem },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the content footer', () => {
      expect(wrapper.find('footer.footer').exists()).toBe(true)
    })

    describe('copyright', () => {
      it('shows the copyright', () => {
        expect(wrapper.find('div.copyright').exists()).toBe(true)
      })

      it('renders the current year as copyright year', () => {
        expect(mocks.$t).toHaveBeenCalledWith('footer.copyright.year', {
          year: new Date().getFullYear(),
        })
      })

      it('renders a link to Gradido-Akademie', () => {
        expect(wrapper.find('div.copyright').find('a').text()).toBe('footer.copyright.link')
      })

      it('keeps the name on one line', () => {
        // At 320px the line broke inside it, "Gradido-" over "Akademie"; in Turkish already at
        // 360px.
        const link = wrapper.find('div.copyright').find('a')
        expect(link.find('.text-nowrap').text()).toBe('footer.copyright.link')
      })

      it('gives the line a place to break after the bar', () => {
        // Vue drops the white space between these elements: without the <wbr> the whole of
        // "Gradido-Akademie | App" had to move together, and "© 2026" stood alone above it.
        // After the bar, so that the bar ends the first line rather than starting the second.
        const bar = wrapper.find('div.copyright .separator-start')
        expect(bar.exists()).toBe(true)
        expect(bar.element.nextElementSibling.tagName).toBe('WBR')
        const versionLine = bar.element.nextElementSibling.nextElementSibling
        expect(versionLine.classList.contains('copyright-version')).toBe(true)
        expect(versionLine.firstElementChild).toBe(
          wrapper.find('div.copyright').findAll('a').at(1).element,
        )
      })

      it('keeps the bar in the link colour it had as the version link border', () => {
        const rule = styleSource().match(/\n\.copyright \.separator-start \{([^}]*)\}/)
        expect(rule, 'no rule for the bar').not.toBeNull()
        expect(rule[1]).toMatch(
          /color: rgba\(var\(--bs-link-color-rgb\), var\(--bs-link-opacity, 1\)\);/,
        )
      })

      // Bernd, 10.11.2026: on the phone the line broke inside the version, its number alone on
      // the next line. Below the desktop layout (`lg`, 1025px) the version takes a line of its
      // own and the bar goes; from 1025px on, one line with the bar as before. jsdom lays nothing
      // out, so these hold the classes; what they do was measured in the built wallet.
      it('stands the version on a line of its own below the desktop layout', () => {
        const versionLine = wrapper.find('div.copyright .copyright-version')
        expect(versionLine.classes()).toEqual(expect.arrayContaining(['d-block', 'd-lg-inline']))
        expect(versionLine.find('a').attributes('href')).toBe(
          `https://github.com/gradido/gradido/commit/${CONFIG.BUILD_COMMIT}`,
        )
      })

      it('shows the bar only from the desktop layout on', () => {
        expect(wrapper.find('div.copyright .separator-start').classes()).toEqual(
          expect.arrayContaining(['d-none', 'd-lg-inline']),
        )
      })

      it('spreads the version over two even lines where even its own line is too narrow', () => {
        // A long translation on a narrow phone: its words on two lines of about the same length,
        // rather than the number alone on the second one.
        const rule = styleSource().match(/\n\.copyright-version \{([^}]*)\}/)
        expect(rule, 'no rule for the version line').not.toBeNull()
        expect(rule[1]).toMatch(/text-wrap: balance;/)
      })

      it('links to the login page when clicked on copyright', () => {
        expect(wrapper.find('div.copyright').find('a').attributes('href')).toBe(
          'https://gradido.net/en',
        )
      })
    })

    describe('version', () => {
      it('shows the current version', async () => {
        expect(mocks.$t).toHaveBeenCalledWith('footer.app_version', { version: CONFIG.APP_VERSION })
      })

      it('links to latest release on GitHub', () => {
        expect(wrapper.find('div.copyright').findAll('a').at(1).attributes('href')).toBe(
          `https://github.com/gradido/gradido/commit/${CONFIG.BUILD_COMMIT}`,
        )
      })

      // it('has last commit hash', () => {
      //   expect(mocks.$t).toHaveBeenCalledWith('footer.short_hash', {
      //     shortHash: CONFIG.BUILD_COMMIT_SHORT,
      //   })
      // })
      //
      // it('links to last release commit', () => {
      //   expect(wrapper.find('div.copyright').findAll('a').at(2).attributes('href')).toBe(
      //     `https://github.com/gradido/gradido/commit/${CONFIG.BUILD_COMMIT}`,
      //   )
      // })
    })

    describe('links to gradido.net', () => {
      it('has a link to the legal notice', () => {
        expect(wrapper.findAll('.nav-item a').at(0).text()).toBe('footer.imprint')
      })

      it('links to the https://gradido.net/en/impressum when locale is en', () => {
        expect(wrapper.findAll('.nav-item a').at(0).attributes('href')).toBe(
          'https://gradido.net/en/impressum/',
        )
      })

      it('has a link to the privacy policy', () => {
        expect(wrapper.findAll('.nav-item a').at(1).text()).toBe('footer.privacy_policy')
      })

      it('links to the https://gradido.net/en/datenschutz when locale is en', () => {
        expect(wrapper.findAll('.nav-item a').at(1).attributes('href')).toBe(
          'https://gradido.net/en/datenschutz/',
        )
      })

      it('links to the whitepaper', () => {
        expect(wrapper.findAll('.nav-item a').at(2).attributes('href')).toBe(
          'https://docs.google.com/document/d/1kcX1guOi6tDgnFHD9tf7fB_MneKTx-0nHJxzdN8ygNs/edit?usp=sharing',
        )
      })

      it('links to the support', () => {
        expect(wrapper.findAll('.nav-item a').at(3).attributes('href')).toBe(
          `mailto:${CONFIG.COMMUNITY_SUPPORT_MAIL}`,
        )
      })

      describe('links are localized', () => {
        beforeEach(() => {
          mocks.$i18n.locale = 'de'
          wrapper = Wrapper()
        })

        it('links to the https://gradido.net/de when locale is de', () => {
          expect(wrapper.find('div.copyright').find('a').attributes('href')).toBe(
            'https://gradido.net/de',
          )
        })

        it('links to the https://gradido.net/de/impressum when locale is de', () => {
          expect(wrapper.findAll('.nav-item a').at(0).attributes('href')).toBe(
            'https://gradido.net/de/impressum/',
          )
        })

        it('links to the https://gradido.net/de/datenschutz when locale is de', () => {
          expect(wrapper.findAll('.nav-item a').at(1).attributes('href')).toBe(
            'https://gradido.net/de/datenschutz/',
          )
        })

        it('links to the German whitepaper when locale is de', () => {
          expect(wrapper.findAll('.nav-item a').at(2).attributes('href')).toBe(
            'https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing',
          )
        })
      })
    })
  })
})
