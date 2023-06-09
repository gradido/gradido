import { mount } from '@vue/test-utils'

import ContentFooter from './ContentFooter'

const localVue = global.localVue

describe('ContentFooter', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t, options) => (options ? [t, options] : t)),
  }

  const Wrapper = () => {
    return mount(ContentFooter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the content footer', () => {
      expect(wrapper.find('footer.footer').exists()).toBeTruthy()
    })

    describe('copyright', () => {
      it('shows the copyright', () => {
        expect(wrapper.find('div.copyright').exists()).toBeTruthy()
      })

      it('renders the current year as copyright year', () => {
        expect(mocks.$t).toBeCalledWith('footer.copyright.year', { year: new Date().getFullYear() })
      })

      it('renders a link to Gradido-Akademie', () => {
        expect(wrapper.find('div.copyright').find('a').text()).toEqual('footer.copyright.link')
      })

      it('links to the login page when clicked on copyright', () => {
        expect(wrapper.find('div.copyright').find('a').attributes('href')).toEqual(
          'https://gradido.net/en',
        )
      })
    })

    describe('version', () => {
      it('shows the current version', async () => {
        wrapper.setData({ version: 1.23 })
        await wrapper.vm.$nextTick()
        expect(mocks.$t).toBeCalledWith('footer.app_version', { version: 1.23 })
      })

      it('links to latest release on GitHub', () => {
        expect(wrapper.find('div.copyright').findAll('a').at(1).attributes('href')).toEqual(
          'https://github.com/gradido/gradido/releases/latest',
        )
      })

      it('has last commit hash', async () => {
        wrapper.setData({ shortHash: 'ACCEDED' })
        wrapper.setData({ hash: 'ACCEDEDC001D00DC001D00DC001D00DC001CAFA' })
        await wrapper.vm.$nextTick()
        expect(mocks.$t).toBeCalledWith('footer.short_hash', { shortHash: 'ACCEDED' })
      })

      it('links to last release commit', async () => {
        wrapper.setData({ hash: 'ACCEDEDC001D00DC001D00DC001D00DC001CAFA' })
        await wrapper.vm.$nextTick()
        expect(wrapper.find('div.copyright').findAll('a').at(2).attributes('href')).toEqual(
          'https://github.com/gradido/gradido/commit/ACCEDEDC001D00DC001D00DC001D00DC001CAFA',
        )
      })
    })

    describe('links to gradido.net', () => {
      it('has a link to the legal notice', () => {
        expect(wrapper.findAll('a.nav-link').at(0).text()).toEqual('footer.imprint')
      })

      it('links to the https://gradido.net/en/impressum when locale is en', () => {
        expect(wrapper.findAll('a.nav-link').at(0).attributes('href')).toEqual(
          'https://gradido.net/en/impressum/',
        )
      })

      it('has a link to the privacy policy', () => {
        expect(wrapper.findAll('a.nav-link').at(1).text()).toEqual('footer.privacy_policy')
      })

      it('links to the https://gradido.net/en/datenschutz when locale is en', () => {
        expect(wrapper.findAll('a.nav-link').at(1).attributes('href')).toEqual(
          'https://gradido.net/en/datenschutz/',
        )
      })

      it('links to the whitepaper', () => {
        expect(wrapper.findAll('a.nav-link').at(2).attributes('href')).toEqual(
          'https://docs.google.com/document/d/1kcX1guOi6tDgnFHD9tf7fB_MneKTx-0nHJxzdN8ygNs/edit?usp=sharing',
        )
      })

      it('links to the support', () => {
        expect(wrapper.findAll('a.nav-link').at(3).attributes('href')).toEqual(
          'https://gradido.net/en/contact/',
        )
      })

      describe('links are localized', () => {
        beforeEach(() => {
          mocks.$i18n.locale = 'de'
        })

        it('links to the https://gradido.net/de when locale is de', () => {
          expect(wrapper.find('div.copyright').find('a').attributes('href')).toEqual(
            'https://gradido.net/de',
          )
        })

        it('links to the https://gradido.net/de/impressum when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(0).attributes('href')).toEqual(
            'https://gradido.net/de/impressum/',
          )
        })

        it('links to the https://gradido.net/de/datenschutz when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(1).attributes('href')).toEqual(
            'https://gradido.net/de/datenschutz/',
          )
        })

        it('links to the German whitepaper when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(2).attributes('href')).toEqual(
            'https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing',
          )
        })

        it('links to the German support-page when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(3).attributes('href')).toEqual(
            'https://gradido.net/de/contact/',
          )
        })
      })
    })
  })
})
