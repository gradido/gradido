import { mount } from '@vue/test-utils'
import RegisterCommunity from './RegisterCommunity'

const localVue = global.localVue

describe('RegisterCommunity', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $store: {
      state: {
        community: {
          name: 'Gradido Entwicklung',
          url: 'http://localhost:3000/vue/',
          registerUrl: 'http://localhost:3000/vue/register',
          description: 'Die lokale Entwicklungsumgebung von Gradido.',
        },
      },
    },
  }

  const Wrapper = () => {
    return mount(RegisterCommunity, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element "#register-community"', () => {
      expect(wrapper.find('div#register-community').exists()).toBeTruthy()
    })

    describe('Displaying the current community info', () => {
      it('has a current community name', () => {
        expect(wrapper.find('.header h1').text()).toBe('Gradido Entwicklung')
      })

      it('has a current community description', () => {
        expect(wrapper.find('.header p').text()).toBe(
          'Die lokale Entwicklungsumgebung von Gradido.',
        )
      })

      it('has a current community location', () => {
        expect(wrapper.find('.header p.community-location').text()).toBe(
          'Location: http://localhost:3000/vue/',
        )
      })
    })

    describe('buttons and links', () => {
      it('has a button "Continue to registration?"', () => {
        expect(wrapper.findAll('a').at(0).text()).toEqual('community.continue-to-registration')
      })
      it('button links to /register when clicking "Continue to registration"', () => {
        expect(wrapper.findAll('a').at(0).props().to).toBe('/register')
      })

      it('has a button "Choose another community?"', () => {
        expect(wrapper.findAll('a').at(1).text()).toEqual('community.choose-another-community')
      })
      it('button links to /select-community when clicking "Choose another community"', () => {
        expect(wrapper.findAll('a').at(1).props().to).toBe('/select-community')
      })

      it('has a button "Back to Login?"', () => {
        expect(wrapper.findAll('a').at(2).text()).toEqual('back')
      })
      it('button links to /login when clicking "Back to Login"', () => {
        expect(wrapper.findAll('a').at(2).props().to).toBe('/login')
      })
    })
  })
})
