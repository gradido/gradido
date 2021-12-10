import { mount, RouterLinkStub } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import ForgotPassword from './ForgotPassword'

const mockAPIcall = jest.fn()

const localVue = global.localVue

const mockRouterPush = jest.fn()

const stubs = {
  RouterLink: RouterLinkStub,
}

const createMockObject = (comingFrom) => {
  return {
    localVue,
    mocks: {
      $t: jest.fn((t) => t),
      $router: {
        push: mockRouterPush,
      },
      $apollo: {
        query: mockAPIcall,
      },
      $route: {
        params: {
          comingFrom,
        },
      },
    },
    stubs,
  }
}

describe('ForgotPassword', () => {
  let wrapper

  const Wrapper = (functionN) => {
    return mount(ForgotPassword, functionN)
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper(createMockObject())
    })

    it('renders the component', () => {
      expect(wrapper.find('div.forgot-password').exists()).toBeTruthy()
    })

    it('has a title', () => {
      expect(wrapper.find('h1').text()).toEqual('settings.password.reset')
    })

    it('has a subtitle', () => {
      expect(wrapper.find('p.text-lead').text()).toEqual('settings.password.subtitle')
    })

    describe('back button', () => {
      it('has a "back" button', () => {
        expect(wrapper.findComponent(RouterLinkStub).text()).toEqual('back')
      })

      it('links to login', () => {
        expect(wrapper.findComponent(RouterLinkStub).props().to).toEqual('/Login')
      })
    })

    describe('input form', () => {
      let form

      beforeEach(() => {
        form = wrapper.find('form')
      })

      it('has the label "Email"', () => {
        expect(form.find('label').text()).toEqual('Email')
      })

      it('has the placeholder "Email"', () => {
        expect(form.find('input').attributes('placeholder')).toEqual('Email')
      })

      it('has a submit button', () => {
        expect(form.find('button[type="submit"]').exists()).toBeTruthy()
      })

      describe('invalid Email', () => {
        beforeEach(async () => {
          await form.find('input').setValue('no-email')
          await flushPromises()
        })

        it('displays an error', () => {
          expect(form.find('div.invalid-feedback').text()).toEqual('validations.messages.email')
        })

        it('does not call the API', () => {
          expect(mockAPIcall).not.toHaveBeenCalled()
        })
      })

      describe('valid Email', () => {
        beforeEach(() => {
          form.find('input').setValue('user@example.org')
        })

        describe('calls the API', () => {
          describe('sends back error', () => {
            beforeEach(async () => {
              mockAPIcall.mockRejectedValue({
                message: 'error',
              })
              await form.trigger('submit')
              await flushPromises()
            })

            it('pushes to "/thx/password"', () => {
              expect(mockAPIcall).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    email: 'user@example.org',
                  },
                }),
              )
              expect(mockRouterPush).toHaveBeenCalledWith('/thx/password')
            })
          })

          describe('success', () => {
            beforeEach(async () => {
              mockAPIcall.mockResolvedValue({
                data: {
                  sendResetPasswordEmail: {
                    state: 'success',
                  },
                },
              })
              await form.trigger('submit')
              await flushPromises()
            })

            it('pushes to "/thx/password"', () => {
              expect(mockAPIcall).toBeCalledWith(
                expect.objectContaining({
                  variables: {
                    email: 'user@example.org',
                  },
                }),
              )
              expect(mockRouterPush).toHaveBeenCalledWith('/thx/password')
            })
          })
        })
      })
    })

    describe('comingFrom login', () => {
      beforeEach(() => {
        wrapper = Wrapper(createMockObject('reset'))
      })

      it('has another subtitle', () => {
        expect(wrapper.find('p.text-lead').text()).toEqual('settings.password.resend_subtitle')
      })
    })
  })
})
