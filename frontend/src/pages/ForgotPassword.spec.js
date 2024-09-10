// import { mount } from '@vue/test-utils'
// import flushPromises from 'flush-promises'
// import { toastErrorSpy } from '@test/testSetup'
// import ForgotPassword from './ForgotPassword'
//
// const mockAPIcall = jest.fn()
//
// const localVue = global.localVue
//
// const mocks = {
//   $t: jest.fn((t) => t),
//   $apollo: {
//     mutate: mockAPIcall,
//   },
//   $route: {
//     params: {
//       comingFrom: '',
//     },
//   },
// }
//
// describe('ForgotPassword', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(ForgotPassword, { localVue, mocks })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       wrapper = Wrapper()
//     })
//
//     it('renders the component', () => {
//       expect(wrapper.find('div.forgot-password').exists()).toBe(true)
//     })
//
//     describe('input form', () => {
//       let form
//
//       beforeEach(() => {
//         form = wrapper.find('form')
//       })
//
//       it('has the label "Email"', () => {
//         expect(form.find('label').text()).toEqual('form.email')
//       })
//
//       it('has the placeholder "Email"', () => {
//         expect(form.find('input').attributes('placeholder')).toEqual('form.email')
//       })
//
//       it('has a submit button', () => {
//         expect(form.find('button[type="submit"]').exists()).toBe(true)
//       })
//
//       describe('invalid Email', () => {
//         beforeEach(async () => {
//           await form.find('input').setValue('no-email')
//           await flushPromises()
//         })
//
//         it('displays an error', () => {
//           expect(form.find('div.invalid-feedback').text()).toEqual('validations.messages.email')
//         })
//
//         it('does not call the API', () => {
//           expect(mockAPIcall).not.toHaveBeenCalled()
//         })
//       })
//
//       describe('valid Email', () => {
//         beforeEach(() => {
//           form.find('input').setValue('user@example.org')
//         })
//
//         describe('calls the API', () => {
//           describe('sends back error', () => {
//             beforeEach(async () => {
//               mockAPIcall.mockRejectedValue({
//                 message: 'error',
//               })
//               await form.trigger('submit')
//               await flushPromises()
//             })
//
//             it('shows error title, subtitle, login button', () => {
//               expect(wrapper.vm.showPageMessage).toBe(true)
//               expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
//               expect(wrapper.find('.test-message-subtitle').text()).toBe('error.email-already-sent')
//               expect(wrapper.find('.test-message-button').text()).toBe('login')
//             })
//
//             it('button link directs to "/login"', () => {
//               expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
//             })
//
//             it('toasts a standard error message', () => {
//               expect(toastErrorSpy).toBeCalledWith('error.email-already-sent')
//             })
//           })
//
//           describe('success', () => {
//             beforeEach(async () => {
//               mockAPIcall.mockResolvedValue({
//                 data: {
//                   sendResetPasswordEmail: {
//                     state: 'success',
//                   },
//                 },
//               })
//               await form.trigger('submit')
//               await flushPromises()
//             })
//
//             it('shows success title, subtitle, login button', () => {
//               expect(wrapper.vm.showPageMessage).toBe(true)
//               expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
//               expect(wrapper.find('.test-message-subtitle').text()).toBe('message.email')
//               expect(wrapper.find('.test-message-button').text()).toBe('login')
//             })
//
//             it('button link redirects to "/login"', () => {
//               expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
//             })
//           })
//         })
//       })
//     })
//
//     describe('route has coming from ', () => {
//       beforeEach(() => {
//         mocks.$route.params.comingFrom = 'coming from'
//         wrapper = Wrapper()
//       })
//
//       it('changes subtitle', () => {
//         expect(wrapper.vm.subtitle).toBe('settings.password.resend_subtitle')
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import ForgotPassword from './ForgotPassword.vue'
import flushPromises from 'flush-promises'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { BButton, BCol, BContainer, BForm, BFormGroup, BFormInput, BRow } from 'bootstrap-vue-next'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import { configure, defineRule } from 'vee-validate'
import { email, min, required } from '@vee-validate/rules'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)

// Configure vee-validate
configure({
  generateMessage: (context) => {
    return `The field ${context.field} is invalid`
  },
})

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
}))

describe('ForgotPassword', () => {
  let wrapper
  let router
  let i18n

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/login', name: 'Login' }],
    })

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          'form.email': 'Email',
          'validations.messages.email': 'Invalid email',
          'message.errorTitle': 'Error',
          'error.email-already-sent': 'Email already sent',
          login: 'Login',
          'message.title': 'Success',
          'message.email': 'Email sent',
          'settings.password.resend_subtitle': 'Resend subtitle',
        },
      },
    })

    wrapper = mount(ForgotPassword, {
      global: {
        plugins: [router, i18n],
        stubs: {
          BContainer,
          BRow,
          BCol,
          BForm,
          BButton,
          BFormInput,
          BFormGroup,
          InputEmail,
          Message: true,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    expect(wrapper.find('div.forgot-password').exists()).toBe(true)
  })

  describe('input form', () => {
    it('has the label "Email"', () => {
      expect(wrapper.find('[data-test="input-email"] label').text()).toBe('Email')
    })

    it('has the placeholder "Email"', () => {
      expect(wrapper.find('#email-input-field').attributes('placeholder')).toBe('Email')
    })

    it('has a submit button', () => {
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    describe('valid Email', () => {
      beforeEach(async () => {
        await wrapper.find('#email-input-field').setValue('user@example.org')
        await wrapper.find('form').trigger('submit')
      })

      describe('API call succeeds', () => {
        beforeEach(async () => {
          mockMutate.mockResolvedValue({
            data: {
              sendResetPasswordEmail: {
                state: 'success',
              },
            },
          })
          console.log(wrapper.html())
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('shows success message', () => {
          expect(wrapper.find('message-stub').attributes('headline')).toBe('Success')
          expect(wrapper.find('message-stub').attributes('subtitle')).toBe('Email sent')
          expect(wrapper.find('message-stub').attributes('buttontext')).toBe('Login')
        })
      })

      describe('API call fails', () => {
        beforeEach(async () => {
          mockMutate.mockRejectedValue(new Error('API Error'))
          await wrapper.find('form').trigger('submit')
          await flushPromises()
        })

        it('shows error message', () => {
          expect(wrapper.find('message-stub').attributes('headline')).toBe('Error')
          expect(wrapper.find('message-stub').attributes('subtitle')).toBe('Email already sent')
          expect(wrapper.find('message-stub').attributes('buttontext')).toBe('Login')
        })

        it('toasts a standard error message', () => {
          expect(mockToastError).toHaveBeenCalledWith('Email already sent')
        })
      })
    })
  })

  describe('route has coming from', () => {
    beforeEach(() => {
      router.currentRoute.value.params.comingFrom = 'coming from'
      wrapper = mount(ForgotPassword, {
        global: {
          plugins: [router, i18n],
          stubs: {
            BContainer,
            BRow,
            BCol,
            BForm,
            BButton,
            BFormInput,
            BFormGroup,
            InputEmail,
            Message: true,
          },
        },
      })
    })

    it('changes subtitle', () => {
      expect(wrapper.vm.subtitle).toBe('settings.password.resend_subtitle')
    })
  })
})
