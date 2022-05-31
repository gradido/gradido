import { mount, RouterLinkStub } from '@vue/test-utils'
import ResetPassword from './ResetPassword'
import flushPromises from 'flush-promises'

import { toastErrorSpy } from '@test/testSetup'

// validation is tested in src/components/UserSettings/UserPassword.spec.js

const localVue = global.localVue

const apolloMutationMock = jest.fn()
const apolloQueryMock = jest.fn().mockResolvedValue()

const routerPushMock = jest.fn()

const stubs = {
  RouterLink: RouterLinkStub,
}

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
  $route: {
    params: {
      optin: '123',
    },
    path: {
      mock: 'checkEmail',
      includes: jest.fn((t) => t === mocks.$route.path.mock),
    },
  },
  $router: {
    push: routerPushMock,
  },
  $loading: {
    show: jest.fn(() => {
      return { hide: jest.fn() }
    }),
  },
  $apollo: {
    mutate: apolloMutationMock,
    query: apolloQueryMock,
  },
}

describe('ResetPassword', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ResetPassword, { localVue, mocks, stubs })
  }

  describe('mount', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      wrapper = Wrapper()
    })

    describe('no valid optin', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        apolloQueryMock.mockRejectedValue({ message: 'Your time is up!' })
        wrapper = Wrapper()
      })

      it('toasts an error when no valid optin is given', () => {
        expect(toastErrorSpy).toHaveBeenCalledWith('Your time is up!')
      })

      it('redirects to /forgot-password/resetPassword', () => {
        expect(routerPushMock).toBeCalledWith('/forgot-password/resetPassword')
      })
    })

    describe('valid optin', () => {
      it('renders the Reset Password form when authenticated', () => {
        expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
      })

      describe('reset password form', () => {
        it('has a register form', async () => {
          expect(wrapper.find('form').exists()).toBeTruthy()
        })

        it('has 2 password input fields', async () => {
          expect(wrapper.findAll('input[type="password"]').length).toBe(2)
        })

        it('toggles the first input field to text when eye icon is clicked', async () => {
          await wrapper.findAll('button').at(0).trigger('click')
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
          await wrapper.findAll('input').at(0).setValue('Aa123456_')
          await wrapper.findAll('input').at(1).setValue('Aa123456_')
          await flushPromises()
        })

        describe('server response with error code > 10min', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            apolloMutationMock.mockRejectedValue({
              message: '...email was sent more than 23 hours and 10 minutes ago',
            })
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('shows error title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBe(true)
            expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
            expect(wrapper.find('.test-message-subtitle').text()).toBe(
              '...email was sent more than 23 hours and 10 minutes ago',
            )
            expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
          })

          it('button link directs to "/forgot-password/resetPassword"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe(
              '/forgot-password/resetPassword',
            )
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toHaveBeenCalledWith(
              '...email was sent more than 23 hours and 10 minutes ago',
            )
          })

          it.skip('click redirects to "/forgot-password/resetPassword"', () => {
            // wrapper.find('.test-message-button').trigger('click')
            // await flushPromises()
            // await wrapper.vm.$nextTick()
            // expect(routerPushMock).toHaveBeenCalledWith('/forgot-password/resetPassword')
          })
        })

        describe('server response with error', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            apolloMutationMock.mockRejectedValueOnce({ message: 'Error' })
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('shows error title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBe(true)
            expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
            expect(wrapper.find('.test-message-subtitle').text()).toBe('Error')
            expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
          })

          it('button link directs to "/forgot-password/resetPassword"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe(
              '/forgot-password/resetPassword',
            )
          })

          it('toasts an error message', () => {
            expect(toastErrorSpy).toHaveBeenCalledWith('Error')
          })

          it.skip('click redirects to "/forgot-password/resetPassword"', () => {
            // expect(routerPushMock).toHaveBeenCalledWith('/forgot-password/resetPassword')
          })
        })

        describe('server response with success on /checkEmail', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            mocks.$route.path.mock = 'checkEmail'
            apolloMutationMock.mockResolvedValue({
              data: {
                resetPassword: 'success',
              },
            })
            await wrapper.findAll('input').at(0).setValue('Aa123456_')
            await wrapper.findAll('input').at(1).setValue('Aa123456_')
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('calls the API', () => {
            expect(apolloMutationMock).toBeCalledWith(
              expect.objectContaining({
                variables: {
                  code: '123',
                  password: 'Aa123456_',
                },
              }),
            )
          })

          it('shows message title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBe(true)
            expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
            expect(wrapper.find('.test-message-subtitle').text()).toBe('message.checkEmail')
            expect(wrapper.find('.test-message-button').text()).toBe('login')
          })

          it('button link directs to "/login"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
          })

          it.skip('click redirects to "/login"', () => {
            // expect(routerPushMock).toHaveBeenCalledWith('/login')
          })
        })

        describe('server response with success on /reset-password', () => {
          beforeEach(async () => {
            mocks.$route.path.mock = 'reset-password'
            wrapper = Wrapper()
            apolloMutationMock.mockResolvedValue({
              data: {
                resetPassword: 'success',
              },
            })
            await wrapper.findAll('input').at(0).setValue('Aa123456_')
            await wrapper.findAll('input').at(1).setValue('Aa123456_')
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('shows message title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBe(true)
            expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
            expect(wrapper.find('.test-message-subtitle').text()).toBe('message.reset')
            expect(wrapper.find('.test-message-button').text()).toBe('login')
          })

          it('button link directs to "/login"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
          })

          it.skip('click redirects to "/login"', () => {
            // expect(routerPushMock).toHaveBeenCalledWith('/login')
          })
        })
      })
    })
  })
})
