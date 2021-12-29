import { mount, RouterLinkStub } from '@vue/test-utils'
import ResetPassword from './ResetPassword'
import flushPromises from 'flush-promises'

// validation is tested in src/views/Pages/UserProfile/UserCard_FormUserPasswort.spec.js

const localVue = global.localVue

const apolloMutationMock = jest.fn()

const toasterMock = jest.fn()
const routerPushMock = jest.fn()

const stubs = {
  RouterLink: RouterLinkStub,
}

const createMockObject = (comingFrom) => {
  return {
    localVue,
    mocks: {
      $i18n: {
        locale: 'en',
      },
      $t: jest.fn((t) => t),
      $route: {
        params: {
          optin: '123',
          comingFrom,
        },
      },
      $toasted: {
        global: {
          error: toasterMock,
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
      },
    },
    stubs,
  }
}

describe('ResetPassword', () => {
  let wrapper

  const Wrapper = (functionName) => {
    return mount(ResetPassword, functionName)
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper(createMockObject())
    })

    describe('No valid optin', () => {
      it.skip('does not render the Reset Password form when not authenticated', () => {
        expect(wrapper.find('form').exists()).toBeFalsy()
      })

      it.skip('toasts an error when no valid optin is given', () => {
        expect(toasterMock).toHaveBeenCalledWith('error')
      })

      it.skip('has a message suggesting to contact the support', () => {
        expect(wrapper.find('div.header').text()).toContain('settings.password.reset')
        expect(wrapper.find('div.header').text()).toContain('settings.password.not-authenticated')
      })
    })

    describe('is authenticated', () => {
      it('renders the Reset Password form when authenticated', () => {
        expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
      })

      describe('Register header', () => {
        it('has a welcome message', async () => {
          expect(wrapper.find('div.header').text()).toContain('settings.password.reset')
          expect(wrapper.find('div.header').text()).toContain(
            'settings.password.reset-password.text',
          )
        })
      })

      describe('links', () => {
        it('has a link "Back"', async () => {
          expect(wrapper.findAllComponents(RouterLinkStub).at(0).text()).toEqual('back')
        })

        it('links to /login when clicking "Back"', async () => {
          expect(wrapper.findAllComponents(RouterLinkStub).at(0).props().to).toBe('/login')
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
          // wrapper = Wrapper(createMockObject())
          await wrapper.findAll('input').at(0).setValue('Aa123456_')
          await wrapper.findAll('input').at(1).setValue('Aa123456_')
          await flushPromises()
        })

        describe('server response with error code > 10min', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            apolloMutationMock.mockRejectedValue({ message: '...Code is older than 10 minutes' })
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('toasts an error message', () => {
            expect(toasterMock).toHaveBeenCalledWith('...Code is older than 10 minutes')
          })

          it('router pushes to /password/reset', () => {
            expect(routerPushMock).toHaveBeenCalledWith('/password/reset')
          })
        })

        describe('server response with error code > 10min', () => {
          beforeEach(async () => {
            jest.clearAllMocks()
            apolloMutationMock.mockRejectedValueOnce({ message: 'Error' })
            await wrapper.find('form').trigger('submit')
            await flushPromises()
          })

          it('toasts an error message', () => {
            expect(toasterMock).toHaveBeenCalledWith('Error')
          })
        })

        describe('server response with success', () => {
          beforeEach(async () => {
            apolloMutationMock.mockResolvedValue({
              data: {
                resetPassword: 'success',
              },
            })
            wrapper = Wrapper(createMockObject('checkEmail'))
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

          it('redirects to "/thx/reset"', () => {
            expect(routerPushMock).toHaveBeenCalledWith('/thx/reset')
          })
        })
      })
    })
  })
})
