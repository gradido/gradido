import { mount } from '@vue/test-utils'

import ContentFooter from './ContentFooter'

const localVue = global.localVue

describe('ContentFooter', () => {
  let wrapper

  let mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
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

      it('renders the copyright year', () => {
        expect(wrapper.find('div.copyright').text()).toMatch(/©\s*2[0-9]{3,3}\s+/)
      })

      it('renders a link to Gradido-Akademie', () => {
        expect(wrapper.find('div.copyright').find('a').text()).toEqual('Gradido-Akademie')
      })

      it('links to the login page when clicked on copyright', () => {
        expect(wrapper.find('div.copyright').find('a').attributes('href')).toEqual('#/Login')
      })
    })

    describe('links to gradido.net', () => {
      it('has a link to the gradido.net', () => {
        expect(wrapper.findAll('a.nav-link').at(0).text()).toEqual('Gradido')
      })

      it('links to the https://gradido.net/en when locale is en', () => {
        expect(wrapper.findAll('a.nav-link').at(0).attributes('href')).toEqual(
          'https://gradido.net/en',
        )
      })

      it('has a link to the legal notice', () => {
        expect(wrapper.findAll('a.nav-link').at(1).text()).toEqual('imprint')
      })

      it('links to the https://gradido.net/en/impressum when locale is en', () => {
        expect(wrapper.findAll('a.nav-link').at(1).attributes('href')).toEqual(
          'https://gradido.net/en/impressum/',
        )
      })

      it('has a link to the privacy policy', () => {
        expect(wrapper.findAll('a.nav-link').at(2).text()).toEqual('privacy_policy')
      })

      it('links to the https://gradido.net/en/datenschutz when locale is en', () => {
        expect(wrapper.findAll('a.nav-link').at(2).attributes('href')).toEqual(
          'https://gradido.net/en/datenschutz/',
        )
      })

      describe('links are localized', () => {
        beforeEach(() => {
          mocks.$i18n.locale = 'de'
        })

        it('links to the https://gradido.net/de when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(0).attributes('href')).toEqual(
            'https://gradido.net/de',
          )
        })

        it('links to the https://gradido.net/de/impressum when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(1).attributes('href')).toEqual(
            'https://gradido.net/de/impressum/',
          )
        })

        it('links to the https://gradido.net/de/datenschutz when locale is de', () => {
          expect(wrapper.findAll('a.nav-link').at(2).attributes('href')).toEqual(
            'https://gradido.net/de/datenschutz/',
          )
        })
      })
    })
  })
})
