import { RouterLinkStub, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { toastErrorSpy } from '@test/testSetup'
import Login from './Login'

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
      expect(wrapper.find('div.login-form').exists()).toBe(true)
    })

    describe('links', () => {
      it('has a link "Forgot Password"', () => {
        expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual(
          'settings.password.forgot_pwd',
        )
      })
    })

    describe('Login form', () => {
      it('has a login form', () => {
        expect(wrapper.find('form').exists()).toBe(true)
      })

      it('has an Email input field', () => {
        expect(wrapper.find('input[placeholder="Email"]').exists()).toBe(true)
      })

      it('has an Password input field', () => {
        expect(wrapper.find('input[placeholder="form.password"]').exists()).toBe(true)
      })

      it('has a Submit button', () => {
        expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
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
        const createError = async (errorMessage) => {
          apolloQueryMock.mockRejectedValue({
            message: errorMessage,
          })
          wrapper = Wrapper()
          jest.clearAllMocks()
          await wrapper.find('input[placeholder="Email"]').setValue('user@example.org')
          await wrapper.find('input[placeholder="form.password"]').setValue('1234')
          await flushPromises()
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        }

        describe('login fails with "User email not validated"', () => {
          beforeEach(async () => {
            await createError('GraphQL error: User email not validated.')
          })

          it('hides the spinner', () => {
            expect(spinnerHideMock).toBeCalled()
          })

          it('shows error title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBe(true)
            expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
            expect(wrapper.find('.test-message-subtitle').text()).toBe('message.activateEmail')
            expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
          })

          it('button link directs to "/forgot-password"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe('/forgot-password')
          })

          it.skip('click redirects to "/forgot-password"', async () => {
            // wrapper.find('.test-message-button').trigger('click')
            // await flushPromises()
            // await wrapper.vm.$nextTick()
            // expect(mockRouterPush).toBeCalledWith('/forgot-password')
          })

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error.no-account')
          })
        })

        describe('login fails with "User has no password set yet"', () => {
          beforeEach(async () => {
            await createError('GraphQL error: User has no password set yet.')
          })

          it('shows error title, subtitle, login button', () => {
            expect(wrapper.vm.showPageMessage).toBe(true)
            expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
            expect(wrapper.find('.test-message-subtitle').text()).toBe('message.unsetPassword')
            expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
          })

          it('button link directs to "/reset-password/login"', () => {
            expect(wrapper.find('.test-message-button').attributes('href')).toBe(
              '/reset-password/login',
            )
          })

          it.skip('click redirects to "/reset-password/login"', () => {
            // expect(mockRouterPush).toBeCalledWith('/reset-password/login')
          })

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error.no-account')
          })
        })

        describe('login fails with "No user with this credentials"', () => {
          beforeEach(async () => {
            await createError('GraphQL error: No user with this credentials.')
          })

          it('shows no error message on the page', () => {
            // don't show any error on the page! against boots
            expect(wrapper.vm.showPageMessage).toBe(false)
            expect(wrapper.find('.test-message-headline').exists()).toBe(false)
            expect(wrapper.find('.test-message-subtitle').exists()).toBe(false)
            expect(wrapper.find('.test-message-button').exists()).toBe(false)
          })

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error.no-user')
          })
        })

        describe('login fails with an unknow error', () => {
          beforeEach(async () => {
            await createError(' – Unknow error')
          })

          it('shows no error message on the page', () => {
            // don't show any error on the page! against boots
            expect(wrapper.vm.showPageMessage).toBe(false)
            expect(wrapper.find('.test-message-headline').exists()).toBe(false)
            expect(wrapper.find('.test-message-subtitle').exists()).toBe(false)
            expect(wrapper.find('.test-message-button').exists()).toBe(false)
          })

          it('toasts the error message', () => {
            expect(toastErrorSpy).toBeCalledWith('error.unknown-error – Unknow error')
          })
        })
      })
    })
  })
})
