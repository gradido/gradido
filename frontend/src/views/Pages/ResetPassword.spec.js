import { mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import routes from '../../routes/routes'

import ResetPassword from './ResetPassword'

const localVue = global.localVue

const router = new VueRouter({ routes })

describe('ResetPassword', () => {
  let wrapper

  const emailVerification = jest.fn()

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    loginAPI: {
      loginViaEmailVerificationCode: emailVerification,
    },
  }

  const Wrapper = () => {
    return mount(ResetPassword, { localVue, mocks, router })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    /*
    it('calls the email verification when created', () => {
      const spy = jest.spyOn(wrapper.vm, 'authenticate')
      expect(spy).toBeCalled()
    })
    */

    it('does not render the Reset Password form when not authenticated', async () => {
      expect(wrapper.find('div.resetpwd-form').exists()).toBeFalsy()
    })

    it('renders the Reset Password form', async () => {
      wrapper.setData({ authenticated: true })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
    })

    // describe('Register header', () => {
    //  it('has a welcome message', () => {
    //    expect(wrapper.find('div.header').text()).toBe('site.signup.title site.signup.subtitle')
    //  })
    // })

    // describe('links', () => {
    //  it('has a link "Back"', () => {
    //    expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual('back')
    //  })

    //  it('links to /login when clicking "Back"', () => {
    //    expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/login')
    //  })
    // })

    // describe('Register form', () => {
    //  it('has a register form', () => {
    //    expect(wrapper.find('form').exists()).toBeTruthy()
    //  })

    //  it('has 3 text input fields', () => {
    //    expect(wrapper.findAll('input[type="text"]').length).toBe(3)
    //  })

    //  it('has 2 password input fields', () => {
    //    expect(wrapper.findAll('input[type="password"]').length).toBe(2)
    //  })

    //  it('has 1 checkbox input fields', () => {
    //    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(1)
    //  })

    //  it('has no submit button when not completely filled', () => {
    //    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    //  })

    //  it('shows a warning when no valid Email is entered', async () => {
    //    wrapper.findAll('input[type="text"]').at(2).setValue('no_valid@Email')
    //    await flushPromises()
    //    await expect(wrapper.find('.invalid-feedback').text()).toEqual(
    //      'The Email field must be a valid email',
    //    )
    //  })

    //  it('shows 4 warnings when no password is set', async () => {
    //    const passwords = wrapper.findAll('input[type="password"]')
    //    passwords.at(0).setValue('')
    //    passwords.at(1).setValue('')
    //    await flushPromises()
    //    await expect(wrapper.find('div.hints').text()).toContain(
    //      'site.signup.lowercase',
    //      'site.signup.uppercase',
    //      'site.signup.minimum',
    //      'site.signup.one_number',
    //    )
    //  })

    //  //TODO test different invalid password combinations
    // })

    // TODO test submit button
  })
})
