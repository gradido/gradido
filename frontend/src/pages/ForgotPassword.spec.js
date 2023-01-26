import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { toastErrorSpy } from '@test/testSetup'
import ForgotPassword from './ForgotPassword'

const mockAPIcall = jest.fn()

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
  $apollo: {
    mutate: mockAPIcall,
  },
  $route: {
    params: {
      comingFrom: '',
    },
  },
}

describe('ForgotPassword', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ForgotPassword, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.forgot-password').exists()).toBe(true)
    })

    describe('input form', () => {
      let form

      beforeEach(() => {
        form = wrapper.find('form')
      })

      it('has the label "Email"', () => {
        expect(form.find('label').text()).toEqual('form.email')
      })

      it('has the placeholder "Email"', () => {
        expect(form.find('input').attributes('placeholder')).toEqual('form.email')
      })

      it('has a submit button', () => {
        expect(form.find('button[type="submit"]').exists()).toBe(true)
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

            it('shows error title, subtitle, login button', () => {
              expect(wrapper.vm.showPageMessage).toBe(true)
              expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
              expect(wrapper.find('.test-message-subtitle').text()).toBe('error.email-already-sent')
              expect(wrapper.find('.test-message-button').text()).toBe('login')
            })

            it('button link directs to "/login"', () => {
              expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
            })

            it('toasts a standard error message', () => {
              expect(toastErrorSpy).toBeCalledWith('error.email-already-sent')
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

            it('shows success title, subtitle, login button', () => {
              expect(wrapper.vm.showPageMessage).toBe(true)
              expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
              expect(wrapper.find('.test-message-subtitle').text()).toBe('message.email')
              expect(wrapper.find('.test-message-button').text()).toBe('login')
            })

            it('button link redirects to "/login"', () => {
              expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
            })
          })
        })
      })
    })

    describe('route has coming from ', () => {
      beforeEach(() => {
        mocks.$route.params.comingFrom = 'coming from'
        wrapper = Wrapper()
      })

      it('changes subtitle', () => {
        expect(wrapper.vm.subtitle).toBe('settings.password.resend_subtitle')
      })
    })
  })
})
