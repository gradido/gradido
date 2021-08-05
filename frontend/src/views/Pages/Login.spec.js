import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Login from './Login'

const localVue = global.localVue

const loginQueryMock = jest.fn().mockResolvedValue({
  data: {
    login: {
      sessionId: 1,
      user: {
        name: 'Peter Lustig',
      },
    },
  },
})

const toastErrorMock = jest.fn()
const mockStoreDispach = jest.fn()
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
    },
    $loading: {
      show: spinnerMock,
    },
    $router: {
      push: mockRouterPush,
    },
    $toasted: {
      error: toastErrorMock,
    },
    $apollo: {
      query: loginQueryMock,
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
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('calls the API with the given data', () => {
          expect(loginQueryMock).toBeCalledWith(
            expect.objectContaining({
              variables: {
                email: 'user@example.org',
                password: '1234',
              },
            }),
          )
        })

        it('creates a spinner', () => {
          expect(spinnerMock).toBeCalled()
        })

        describe('login success', () => {
          it('dispatches server response to store', () => {
            expect(mockStoreDispach).toBeCalledWith('login', {
              sessionId: 1,
              user: { name: 'Peter Lustig' },
            })
          })

          it('redirects to overview page', () => {
            expect(mockRouterPush).toBeCalledWith('/overview')
          })

          it('hides the spinner', () => {
            expect(spinnerHideMock).toBeCalled()
          })
        })

        describe('login fails', () => {
          beforeEach(() => {
            loginQueryMock.mockRejectedValue({
              message: 'Ouch!',
            })
          })

          it('hides the spinner', () => {
            expect(spinnerHideMock).toBeCalled()
          })

          it('toasts an error message', () => {
            expect(toastErrorMock).toBeCalledWith('error.no-account')
          })
        })
      })
    })
  })
})
