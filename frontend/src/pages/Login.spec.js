import { RouterLinkStub, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { ERRORS } from '@/config/errors'
import Login from './Login'

import { toastErrorSpy } from '@test/testSetup'

const localVue = global.localVue

const apolloQueryMock = jest.fn()
const mockStoreDispach = jest.fn()
const mockStoreCommit = jest.fn()
const mockRouterPush = jest.fn()
const spinnerHideMock = jest.fn()
const spinnerMock = jest.fn(() => {
  return {
    hide: spinnerHideMock,
  }
})

describe('Login', () => {
  let wrapper

  const mocks = {
    $i18n: {
      locale: 'en',
    },
    $t: jest.fn((t) => t),
    $te: jest.fn((te) => true),
    $store: {
      dispatch: mockStoreDispach,
      commit: mockStoreCommit,
      state: {
        publisherId: 12345,
      },
    },
    $loading: {
      show: spinnerMock,
    },
    $router: {
      push: mockRouterPush,
    },
    $route: {
      params: {},
    },
    $apollo: {
      query: apolloQueryMock,
    },
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
        expect(wrapper.find('div.header').text()).toBe('site.login.heading site.login.community')
      })
    })

    it('has a Community name', () => {
      expect(wrapper.find('.test-communitydata b').text()).toBe('Gradido Entwicklung')
    })

    it('has a Community description', () => {
      expect(wrapper.find('.test-communitydata p').text()).toBe(
        'Die lokale Entwicklungsumgebung von Gradido.',
      )
    })

    describe('links', () => {
      it('has a link "Forgot Password"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual(
          'settings.password.forgot_pwd',
        )
      })

      it('links to /forgot-password when clicking "Forgot Password"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/forgot-password')
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
    })

    describe('submit', () => {
      describe('no data', () => {
        it('displays a message that Email is required', async () => {
          await wrapper.find('form').trigger('submit')
          await flushPromises()
          expect(wrapper.findAll('div.invalid-feedback').at(0).text()).toBe(
            'validations.messages.required',
          )
        })

        it('displays a message that password is required', async () => {
          await wrapper.find('form').trigger('submit')
          await flushPromises()
          expect(wrapper.findAll('div.invalid-feedback').at(1).text()).toBe(
            'validations.messages.required',
          )
        })
      })

      describe('valid data', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
          await wrapper.find('input[placeholder="form.password"]').setValue('1234')
          await flushPromises()
          apolloQueryMock.mockResolvedValue({
            data: {
              login: 'token',
            },
          })
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('calls the API with the given data', () => {
          expect(apolloQueryMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'user@example.org',
                password: '1234',
                publisherId: 12345,
              },
            }),
          )
        })

        it('creates a spinner', () => {
          expect(spinnerMock).toBeCalled()
        })

        describe('login success', () => {
          it('dispatches server response to store', () => {
            expect(mockStoreDispach).toBeCalledWith('login', 'token')
          })

          it('hides the spinner', () => {
            expect(spinnerHideMock).toBeCalled()
          })

          describe('without code parameter', () => {
            it('redirects to overview page', () => {
              expect(mockRouterPush).toBeCalledWith('/overview')
            })
          })

          describe('with code parameter', () => {
            beforeEach(async () => {
              mocks.$route.params = {
                code: 'some-code',
              }
              wrapper = Wrapper()
              await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
              await wrapper.find('input[placeholder="form.password"]').setValue('1234')
              await flushPromises()
              await wrapper.find('form').trigger('submit')
              await flushPromises()
            })

            it('redirects to overview page', () => {
              expect(mockRouterPush).toBeCalledWith('/redeem/some-code')
            })
          })
        })
      })

      describe('login fails', () => {
        beforeEach(async () => {
          jest.clearAllMocks()
          await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
          await wrapper.find('input[placeholder="form.password"]').setValue('1234')
          await flushPromises()
          apolloQueryMock.mockRejectedValue({
            message: 'error.unknown-error...No user with this credentials',
          })
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('hides the spinner', () => {
          expect(spinnerHideMock).toBeCalled()
        })

        it('toasts an error message', () => {
          expect(toastErrorSpy).toBeCalledWith(
            'error.backend.error.unknown-error...No user with this credentials',
          )
        })

        describe('login fails with "User email not validated"', () => {
          beforeEach(async () => {
            apolloQueryMock.mockRejectedValue({
              message: ERRORS.ERR_EMAIL_NOT_VALIDATED,
            })
            wrapper = Wrapper()
            jest.clearAllMocks()
            await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
            await wrapper.find('input[placeholder="form.password"]').setValue('1234')
            await flushPromises()
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('shows error title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBeTruthy()
            expect(wrapper.find('.test-message-headline').text()).toBe('site.thx.errorTitle')
            expect(wrapper.find('.test-message-subtitle').text()).toBe(
              'error.backend.ERR_EMAIL_NOT_VALIDATED',
            )
            expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
          })

          it('button link directs to "/forgot-password"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe('/forgot-password')
          })

          // Wolle
          it.skip('click redirects to "/forgot-password"', () => {
            // expect(mockRouterPush).toBeCalledWith('/thx/login')
          })
        })

        describe('login fails with "User has no password set yet"', () => {
          beforeEach(async () => {
            apolloQueryMock.mockRejectedValue({
              message: ERRORS.ERR_USER_HAS_NO_PASSWORD,
            })
            wrapper = Wrapper()
            jest.clearAllMocks()
            await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
            await wrapper.find('input[placeholder="form.password"]').setValue('1234')
            await flushPromises()
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('shows error title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBeTruthy()
            expect(wrapper.find('.test-message-headline').text()).toBe('site.thx.errorTitle')
            expect(wrapper.find('.test-message-subtitle').text()).toBe(
              'error.backend.ERR_USER_HAS_NO_PASSWORD',
            )
            expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
          })

          it('button link directs to "/reset-password/login"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe(
              '/reset-password/login',
            )
          })

          // Wolle
          it.skip('click redirects to "/reset-password/login"', () => {
            // expect(mockRouterPush).toBeCalledWith('/reset-password/login')
          })
        })
      })
    })
  })
})
