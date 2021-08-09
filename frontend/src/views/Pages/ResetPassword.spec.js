import { mount, RouterLinkStub } from '@vue/test-utils'
import ResetPassword from './ResetPassword'
import flushPromises from 'flush-promises'

// validation is tested in src/views/Pages/UserProfile/UserCard_FormUserPasswort.spec.js

const localVue = global.localVue

const apolloQueryMock = jest.fn().mockRejectedValue({ message: 'error' })

const toasterMock = jest.fn()
const routerPushMock = jest.fn()

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
    $toasted: {
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
    $apollo: {
      query: apolloQueryMock,
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

    it('calls the email verification when created', async () => {
      expect(apolloQueryMock).toBeCalledWith(
        expect.objectContaining({ variables: { optin: '123' } }),
      )
    })

    describe('No valid optin', () => {
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
    })

    describe('is authenticated', () => {
      beforeEach(() => {
        apolloQueryMock.mockResolvedValue({
          data: {
            loginViaEmailVerificationCode: {
              sessionId: 1,
              email: 'user@example.org',
            },
          },
        })
      })

      it('Has sessionId from API call', async () => {
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.sessionId).toBe(1)
      })

      it('renders the Reset Password form when authenticated', () => {
        expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
      })

      describe('Register header', () => {
        it('has a welcome message', async () => {
          expect(wrapper.find('div.header').text()).toContain('reset-password.title')
          expect(wrapper.find('div.header').text()).toContain('reset-password.text')
        })
      })

      describe('links', () => {
        it('has a link "Back"', async () => {
          expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual('back')
        })

        it('links to /login when clicking "Back"', async () => {
          expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/Login')
        })
      })

      describe('reset password form', () => {
        it('has a register form', async () => {
          expect(wrapper.find('form').exists()).toBeTruthy()
        })

        it('has 2 password input fields', async () => {
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
          await wrapper.setData({ authenticated: true, sessionId: 1 })
          await wrapper.vm.$nextTick()
          await wrapper.findAll('input').at(0).setValue('Aa123456')
          await wrapper.findAll('input').at(1).setValue('Aa123456')
          await flushPromises()
          await wrapper.find('form').trigger('submit')
        })

        describe('server response with error', () => {
          beforeEach(() => {
            apolloQueryMock.mockRejectedValue({ message: 'error' })
          })
          it('toasts an error message', () => {
            expect(toasterMock).toHaveBeenCalledWith('error')
          })
        })

        describe('server response with success', () => {
          beforeEach(() => {
            apolloQueryMock.mockResolvedValue({
              data: {
                resetPassword: 'success',
              },
            })
          })
          it('calls the API', () => {
            expect(apolloQueryMock).toBeCalledWith(
              expect.objectContaining({
                variables: {
                  sessionId: 1,
                  email: 'user@example.org',
                  password: 'Aa123456',
                },
              }),
            )
          })

          it('redirects to "/thx/reset"', () => {
            expect(routerPushMock).toHaveBeenCalledWith('/thx/reset')
          })
        })
      })
    })
  })
})
