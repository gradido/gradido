import { mount, RouterLinkStub } from '@vue/test-utils'
import loginAPI from '../../apis/loginAPI'
import ResetPassword from './ResetPassword'
import flushPromises from 'flush-promises'
import { extend } from 'vee-validate'

const rules = [
  'containsLowercaseCharacter',
  'containsUppercaseCharacter',
  'containsNumericCharacter',
  'atLeastEightCharactera',
  'samePassword',
]

rules.forEach((rule) => {
  extend(rule, {
    validate(value) {
      return true
    },
  })
})

jest.mock('../../apis/loginAPI')

const localVue = global.localVue

const successResponseObject = {
  success: true,
  result: {
    data: {
      session_id: 1,
      user: {
        email: 'user@example.org',
      },
    },
  },
}

const emailVerificationMock = jest.fn()
const changePasswordMock = jest.fn()
const toasterMock = jest.fn()
const routerPushMock = jest.fn()

emailVerificationMock
  .mockReturnValueOnce({ success: false, result: { message: 'error' } })
  .mockReturnValueOnce({ success: false, result: { message: 'error' } })
  .mockReturnValueOnce({ success: false, result: { message: 'error' } })
  .mockReturnValueOnce({ success: false, result: { message: 'error' } })
  .mockReturnValue(successResponseObject)

changePasswordMock
  .mockReturnValueOnce({ success: false, result: { message: 'error' } })
  .mockReturnValue({ success: true })

loginAPI.loginViaEmailVerificationCode = emailVerificationMock
loginAPI.changePassword = changePasswordMock

describe('ResetPassword', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $route: {
      params: {
        optin: '123',
      },
    },
    $toast: {
      error: toasterMock,
    },
    $router: {
      push: routerPushMock,
    },
    $loading: {
      show: jest.fn(() => {
        return { hide: jest.fn() }
      }),
    },
  }

  const stubs = {
    RouterLink: RouterLinkStub,
  }

  const Wrapper = () => {
    return mount(ResetPassword, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('calls the email verification when created', () => {
      expect(emailVerificationMock).toHaveBeenCalledWith('123')
    })

    it('does not render the Reset Password form when not authenticated', () => {
      expect(wrapper.find('form').exists()).toBeFalsy()
    })

    it('toasts an error when no valid optin is given', () => {
      expect(toasterMock).toHaveBeenCalledWith('error')
    })

    it('has a message suggesting to contact the support', () => {
      expect(wrapper.find('div.header').text()).toContain('reset-password.title')
      expect(wrapper.find('div.header').text()).toContain('reset-password.not-authenticated')
    })

    it('renders the Reset Password form when authenticated', async () => {
      await wrapper.setData({ authenticated: true })
      expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
    })

    describe('Register header', () => {
      it('has a welcome message', () => {
        expect(wrapper.find('div.header').text()).toContain('reset-password.title')
        expect(wrapper.find('div.header').text()).toContain('reset-password.text')
      })
    })

    describe('links', () => {
      it('has a link "Back"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual('back')
      })

      it('links to /login when clicking "Back"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/Login')
      })
    })

    describe('reset password form', () => {
      it('has a register form', () => {
        expect(wrapper.find('form').exists()).toBeTruthy()
      })

      it('has 2 password input fields', () => {
        expect(wrapper.findAll('input[type="password"]').length).toBe(2)
      })

      it('toggles the first input field to text when eye icon is clicked', async () => {
        wrapper.findAll('button').at(0).trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.findAll('input').at(0).attributes('type')).toBe('text')
      })

      it('toggles the second input field to text when eye icon is clicked', async () => {
        wrapper.findAll('button').at(1).trigger('click')
        await wrapper.vm.$nextTick()
        expect(wrapper.findAll('input').at(1).attributes('type')).toBe('text')
      })
    })

    describe('submit form', () => {
      beforeEach(async () => {
        await wrapper.findAll('input').at(0).setValue('Aa123456')
        await wrapper.findAll('input').at(1).setValue('Aa123456')
        await flushPromises()
        await wrapper.find('form').trigger('submit')
      })

      describe('server response with error', () => {
        it('toasts an error message', () => {
          expect(toasterMock).toHaveBeenCalledWith('error')
        })
      })

      describe('server response with success', () => {
        it('calls the API', () => {
          expect(changePasswordMock).toHaveBeenCalledWith(1, 'user@example.org', 'Aa123456')
        })

        it('redirects to "/thx/reset"', () => {
          expect(routerPushMock).toHaveBeenCalledWith('/thx/reset')
        })
      })
    })
  })
})
