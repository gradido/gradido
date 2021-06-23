import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Login from './Login'

const localVue = global.localVue

describe('Login', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(Login, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Login form', () => {
      expect(wrapper.find('div.login-form').exists()).toBeTruthy()
    })

    describe('Login header', () => {
      it('has a welcome message', () => {
        expect(wrapper.find('div.header').text()).toBe('Gradido site.login.community')
      })
    })

    describe('links', () => {
      it('has a link "Forgot Password?"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual(
          'site.login.forgot_pwd',
        )
      })

      it('links to /password when clicking "Forgot Password?"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/password')
      })

      it('has a link "Create new account"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(1).text()).toEqual(
          'site.login.new_wallet',
        )
      })

      it('links to /register when clicking "Create new account"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(1).props().to).toBe('/register')
      })
    })

    describe('Login form', () => {
      it('has a login form', () => {
        expect(wrapper.find('form').exists()).toBeTruthy()
      })

      it('has an Email input field', () => {
        expect(wrapper.find('input[placeholder="Email"]').exists()).toBeTruthy()
      })

      it('has an Password input field', () => {
        expect(wrapper.find('input[placeholder="form.password"]').exists()).toBeTruthy()
      })

      it('has a Submit button', () => {
        expect(wrapper.find('button[type="submit"]').exists()).toBeTruthy()
      })

      it('shows a warning when no valid Email is entered', async () => {
        wrapper.find('input[placeholder="Email"]').setValue('no_valid@Email')
        await flushPromises()
        await expect(wrapper.find('.invalid-feedback').text()).toEqual(
          'The Email field must be a valid email',
        )
      })
    })

    // to do: test submit button
  })
})
