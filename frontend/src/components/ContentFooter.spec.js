import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContentFooter from './ContentFooter'
import CONFIG from '@/config'
import { BCol, BNav, BNavItem, BRow } from 'bootstrap-vue-next'

console.log(`CONFIG in ContentFooter.spec.js: ${JSON.stringify(CONFIG, null, 2)}`)

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
          'https://github.com/gradido/gradido/releases/latest',
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
