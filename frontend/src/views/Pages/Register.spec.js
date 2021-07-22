import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'

import Register from './Register'

const localVue = global.localVue

describe('Register', () => {
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
    return mount(Register, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Register form', () => {
      expect(wrapper.find('div.register-form').exists()).toBeTruthy()
    })

    describe('Register header', () => {
      it('has a welcome message', () => {
        expect(wrapper.find('div.header').text()).toBe('site.signup.title site.signup.subtitle')
      })
    })

    describe('links', () => {
      it('has a link "Back"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual('back')
      })

      it('links to /login when clicking "Back"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/login')
      })
    })

    describe('Register form', () => {
      it('has a register form', () => {
        expect(wrapper.find('form').exists()).toBeTruthy()
      })

      it('has firstname input fields', () => {
        expect(wrapper.find('#registerFirstname').exists()).toBeTruthy()
      })
      it('has lastname input fields', () => {
        expect(wrapper.find('#registerLastname').exists()).toBeTruthy()
      })

      it('has email input fields', () => {
        expect(wrapper.find('#Email-input-field').exists()).toBeTruthy()
      })

      it('has password input fields', () => {
        expect(wrapper.find('#inputPassword').exists()).toBeTruthy()
      })

      it('has password repeat input fields', () => {
        expect(wrapper.find('#inputPasswordRepeat').exists()).toBeTruthy()
      })

      it('has 1 checkbox input fields', () => {
        expect(wrapper.find('#registerCheckbox').exists()).toBeTruthy()
      })

      it('has no submit button when not completely filled', () => {
        expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
      })

      it('shows a warning when no valid Email is entered', async () => {
        wrapper.find('#Email-input-field').setValue('no_valid@Email')
        await flushPromises()
        await expect(wrapper.find('#Email-input-field b-form-invalid-feedback').text()).toEqual(
          'validations.messages.email',
        )
      })

      it('shows 4 warnings when no password is set', async () => {
        const passwords = wrapper.findAll('input[type="password"]')
        passwords.at(0).setValue('')
        passwords.at(1).setValue('')
        await flushPromises()
        await expect(wrapper.find('div.hints').text()).toContain(
          'site.signup.lowercase',
          'site.signup.uppercase',
          'site.signup.minimum',
          'site.signup.one_number',
        )
      })

      // TODO test different invalid password combinations
    })

    // TODO test submit button
  })
})
