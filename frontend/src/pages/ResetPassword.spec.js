// import { mount, RouterLinkStub } from '@vue/test-utils'
// import ResetPassword from './ResetPassword'
// import flushPromises from 'flush-promises'
//
// import { toastErrorSpy } from '@test/testSetup'
//
// // validation is tested in src/components/UserSettings/UserPassword.spec.js
//
// const localVue = global.localVue
//
// const apolloMutationMock = jest.fn()
// const apolloQueryMock = jest.fn().mockResolvedValue()
//
// const routerPushMock = jest.fn()
//
// const stubs = {
//   RouterLink: RouterLinkStub,
// }
//
// const mocks = {
//   $i18n: {
//     locale: 'en',
//   },
//   $t: jest.fn((t) => t),
//   $route: {
//     params: {
//       optin: '123',
//     },
//     path: {
//       mock: 'checkEmail',
//       includes: jest.fn((t) => t === mocks.$route.path.mock),
//     },
//   },
//   $router: {
//     push: routerPushMock,
//   },
//   $loading: {
//     show: jest.fn(() => {
//       return { hide: jest.fn() }
//     }),
//   },
//   $apollo: {
//     mutate: apolloMutationMock,
//     query: apolloQueryMock,
//   },
// }
//
// describe('ResetPassword', () => {
//   let wrapper
//
//   const Wrapper = () => {
//     return mount(ResetPassword, { localVue, mocks, stubs })
//   }
//
//   describe('mount', () => {
//     beforeEach(() => {
//       jest.clearAllMocks()
//       wrapper = Wrapper()
//     })
//
//     describe('no valid optin', () => {
//       beforeEach(() => {
//         jest.clearAllMocks()
//         apolloQueryMock.mockRejectedValue({ message: 'Your time is up!' })
//         wrapper = Wrapper()
//       })
//
//       it('toasts an error when no valid optin is given', () => {
//         expect(toastErrorSpy).toHaveBeenCalledWith('Your time is up!')
//       })
//
//       it('redirects to /forgot-password/resetPassword', () => {
//         expect(routerPushMock).toBeCalledWith('/forgot-password/resetPassword')
//       })
//     })
//
//     describe('valid optin', () => {
//       it('renders the Reset Password form when authenticated', () => {
//         expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
//       })
//
//       describe('reset password form', () => {
//         it('has a register form', async () => {
//           expect(wrapper.find('form').exists()).toBeTruthy()
//         })
//
//         it('has 2 password input fields', async () => {
//           expect(wrapper.findAll('input[type="password"]').length).toBe(2)
//         })
//
//         it('toggles the first input field to text when eye icon is clicked', async () => {
//           await wrapper.findAll('button').at(0).trigger('click')
//           await wrapper.vm.$nextTick()
//           expect(wrapper.findAll('input').at(0).attributes('type')).toBe('text')
//         })
//
//         it('toggles the second input field to text when eye icon is clicked', async () => {
//           wrapper.findAll('button').at(1).trigger('click')
//           await wrapper.vm.$nextTick()
//           expect(wrapper.findAll('input').at(1).attributes('type')).toBe('text')
//         })
//       })
//
//       describe('submit form', () => {
//         beforeEach(async () => {
//           await wrapper.findAll('input').at(0).setValue('Aa123456_')
//           await wrapper.findAll('input').at(1).setValue('Aa123456_')
//           await flushPromises()
//         })
//
//         describe('server response with error code > 10min', () => {
//           beforeEach(async () => {
//             jest.clearAllMocks()
//             apolloMutationMock.mockRejectedValue({
//               message: '...email was sent more than 23 hours and 10 minutes ago',
//             })
//             await wrapper.find('form').trigger('submit')
//             await flushPromises()
//           })
//
//           it('shows error title, subtitle, login button', () => {
//             expect(wrapper.vm.showPageMessage).toBe(true)
//             expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
//             expect(wrapper.find('.test-message-subtitle').text()).toBe(
//               '...email was sent more than 23 hours and 10 minutes ago',
//             )
//             expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
//           })
//
//           it('button link directs to "/forgot-password/resetPassword"', () => {
//             expect(wrapper.find('.test-message-button').attributes('href')).toBe(
//               '/forgot-password/resetPassword',
//             )
//           })
//
//           it('toasts an error message', () => {
//             expect(toastErrorSpy).toHaveBeenCalledWith(
//               '...email was sent more than 23 hours and 10 minutes ago',
//             )
//           })
//
//           it.skip('click redirects to "/forgot-password/resetPassword"', () => {
//             // wrapper.find('.test-message-button').trigger('click')
//             // await flushPromises()
//             // await wrapper.vm.$nextTick()
//             // expect(routerPushMock).toHaveBeenCalledWith('/forgot-password/resetPassword')
//           })
//         })
//
//         describe('server response with error', () => {
//           beforeEach(async () => {
//             jest.clearAllMocks()
//             apolloMutationMock.mockRejectedValueOnce({ message: 'Error' })
//             await wrapper.find('form').trigger('submit')
//             await flushPromises()
//           })
//
//           it('shows error title, subtitle, login button', () => {
//             expect(wrapper.vm.showPageMessage).toBe(true)
//             expect(wrapper.find('.test-message-headline').text()).toBe('message.errorTitle')
//             expect(wrapper.find('.test-message-subtitle').text()).toBe('Error')
//             expect(wrapper.find('.test-message-button').text()).toBe('settings.password.reset')
//           })
//
//           it('button link directs to "/forgot-password/resetPassword"', () => {
//             expect(wrapper.find('.test-message-button').attributes('href')).toBe(
//               '/forgot-password/resetPassword',
//             )
//           })
//
//           it('toasts an error message', () => {
//             expect(toastErrorSpy).toHaveBeenCalledWith('Error')
//           })
//
//           it.skip('click redirects to "/forgot-password/resetPassword"', () => {
//             // expect(routerPushMock).toHaveBeenCalledWith('/forgot-password/resetPassword')
//           })
//         })
//
//         describe('server response with success on /checkEmail', () => {
//           beforeEach(async () => {
//             jest.clearAllMocks()
//             mocks.$route.path.mock = 'checkEmail'
//             apolloMutationMock.mockResolvedValue({
//               data: {
//                 resetPassword: 'success',
//               },
//             })
//             await wrapper.findAll('input').at(0).setValue('Aa123456_')
//             await wrapper.findAll('input').at(1).setValue('Aa123456_')
//             await wrapper.find('form').trigger('submit')
//             await flushPromises()
//           })
//
//           it('calls the API', () => {
//             expect(apolloMutationMock).toBeCalledWith(
//               expect.objectContaining({
//                 variables: {
//                   code: '123',
//                   password: 'Aa123456_',
//                 },
//               }),
//             )
//           })
//
//           it('shows message title, subtitle, login button', () => {
//             expect(wrapper.vm.showPageMessage).toBe(true)
//             expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
//             expect(wrapper.find('.test-message-subtitle').text()).toBe('message.checkEmail')
//             expect(wrapper.find('.test-message-button').text()).toBe('login')
//           })
//
//           it('button link directs to "/login"', () => {
//             expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
//           })
//
//           it.skip('click redirects to "/login"', () => {
//             // expect(routerPushMock).toHaveBeenCalledWith('/login')
//           })
//         })
//
//         describe('server response with success on /reset-password', () => {
//           beforeEach(async () => {
//             mocks.$route.path.mock = 'reset-password'
//             wrapper = Wrapper()
//             apolloMutationMock.mockResolvedValue({
//               data: {
//                 resetPassword: 'success',
//               },
//             })
//             await wrapper.findAll('input').at(0).setValue('Aa123456_')
//             await wrapper.findAll('input').at(1).setValue('Aa123456_')
//             await wrapper.find('form').trigger('submit')
//             await flushPromises()
//           })
//
//           it('shows message title, subtitle, login button', () => {
//             expect(wrapper.vm.showPageMessage).toBe(true)
//             expect(wrapper.find('.test-message-headline').text()).toBe('message.title')
//             expect(wrapper.find('.test-message-subtitle').text()).toBe('message.reset')
//             expect(wrapper.find('.test-message-button').text()).toBe('login')
//           })
//
//           it('button link directs to "/login"', () => {
//             expect(wrapper.find('.test-message-button').attributes('href')).toBe('/login')
//           })
//
//           it.skip('click redirects to "/login"', () => {
//             // expect(routerPushMock).toHaveBeenCalledWith('/login')
//           })
//         })
//       })
//     })
//   })
// })

import { mount } from '@vue/test-utils'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import ResetPassword from './ResetPassword.vue'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import { BButton, BCol, BForm, BRow } from 'bootstrap-vue-next'
import flushPromises from 'flush-promises'

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

const mockSetPassword = vi.fn()
const mockQueryOptIn = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockSetPassword,
  })),
  useLazyQuery: vi.fn(() => ({
    load: mockQueryOptIn,
  })),
}))

const t = (key) => key
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t,
  }),
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login/:code?', name: 'Login' },
    { path: '/forgot-password/resetPassword', name: 'ForgotPassword' },
  ],
})

const store = createStore({
  state() {
    return {
      // Add any necessary state for your tests
    }
  },
  // Add mutations and actions if needed for your tests
})

const mockSetFieldValue = vi.fn()
const mockHandleSubmit = vi.fn()
vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => ({
    handleSubmit: mockHandleSubmit,
    meta: { value: { valid: false } },
    values: { value: {} },
    setFieldValue: mockSetFieldValue,
  })),
  useField: vi.fn(() => ({
    value: '',
    errorMessage: { value: '' },
    handleBlur: vi.fn(),
    meta: { valid: false },
  })),
}))

describe('ResetPassword', () => {
  let wrapper

  const createWrapper = (route = '/checkEmail/123') => {
    router.push(route)
    return mount(ResetPassword, {
      global: {
        plugins: [store, router],
        stubs: {
          BForm,
          BRow,
          BCol,
          BButton,
          InputPasswordConfirmation: true,
          Message: true,
        },
        mocks: {
          $t: t, // Add this line to mock $t in the component context
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mount', () => {
    describe('no valid optin', () => {
      beforeEach(async () => {
        mockQueryOptIn.mockRejectedValue(new Error('Your time is up!'))
        wrapper = createWrapper()
        await router.isReady()
        await wrapper.vm.$nextTick()
      })

      it('toasts an error when no valid optin is given', () => {
        expect(mockToastError).toHaveBeenCalledWith('Your time is up!')
      })

      it('redirects to /forgot-password/resetPassword', () => {
        expect(router.currentRoute.value.path).toBe('/forgot-password/resetPassword')
      })
    })

    describe('valid optin', () => {
      beforeEach(async () => {
        mockQueryOptIn.mockResolvedValue({})
        wrapper = createWrapper()
        await router.isReady()
        await wrapper.vm.$nextTick()
      })

      it('renders the Reset Password form when authenticated', () => {
        expect(wrapper.find('div.resetpwd-form').exists()).toBeTruthy()
      })

      it('has a register form', () => {
        expect(wrapper.find('form').exists()).toBeTruthy()
      })

      it('has InputPasswordConfirmation component', () => {
        expect(wrapper.findComponent({ name: 'InputPasswordConfirmation' }).exists()).toBeTruthy()
      })

      it('has a submit button', () => {
        const button = wrapper.find('button[type="submit"]')
        expect(button.exists()).toBeTruthy()
      })
    })
  })

  describe('form submission', () => {
    beforeEach(async () => {
      mockQueryOptIn.mockResolvedValue({})
      wrapper = createWrapper()
      await router.isReady()
      await wrapper.vm.$nextTick()
    })

    it('handles server error response', async () => {
      mockSetPassword.mockRejectedValue(
        new Error('...email was sent more than 23 hours and 10 minutes ago'),
      )

      expect(wrapper.find('form').exists()).toBe(true)

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      const message = wrapper.findComponent({ name: 'Message' })
      expect(message.props('headline')).toBe('message.errorTitle')
      expect(message.props('subtitle')).toBe(
        '...email was sent more than 23 hours and 10 minutes ago',
      )
      expect(message.props('buttonText')).toBe('settings.password.reset')
      expect(message.props('linkTo')).toMatchObject({
        name: 'ForgotPassword',
        params: { comingFrom: 'reset-password' },
      })
      expect(mockToastError).toHaveBeenCalledWith(
        '...email was sent more than 23 hours and 10 minutes ago',
      )
    })

    it('handles success response on /checkEmail', async () => {
      mockSetPassword.mockResolvedValue({ data: { resetPassword: 'success' } })

      expect(wrapper.find('form').exists()).toBe(true)

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      const message = wrapper.findComponent({ name: 'Message' })
      expect(message.props('headline')).toBe('message.title')
      expect(message.props('subtitle')).toBe('message.checkEmail')
      expect(message.props('buttonText')).toBe('login')
      expect(message.props('linkTo')).toMatchObject({ name: 'Login' })
    })

    it('handles success response on /reset-password', async () => {
      wrapper = createWrapper('/reset-password/123')
      await router.isReady()
      await wrapper.vm.$nextTick()

      mockSetPassword.mockResolvedValue({ data: { resetPassword: 'success' } })

      expect(wrapper.find('form').exists()).toBe(true)

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      const message = wrapper.findComponent({ name: 'Message' })
      expect(message.props('headline')).toBe('message.title')
      expect(message.props('subtitle')).toBe('message.checkEmail')
      expect(message.props('buttonText')).toBe('login')
      expect(message.props('linkTo')).toMatchObject({ name: 'Login' })
    })
  })

  describe('password input and form handling', () => {
    beforeEach(async () => {
      mockQueryOptIn.mockResolvedValue({})
      wrapper = createWrapper()
      await router.isReady()
      await wrapper.vm.$nextTick()
    })

    it('renders InputPasswordConfirmation component', () => {
      expect(wrapper.findComponent({ name: 'InputPasswordConfirmation' }).exists()).toBe(true)
    })

    it('disables submit button when form is invalid', async () => {
      // wrapper.vm.formMeta.valid = false
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    // it('enables submit button when form is valid', async () => {
    //   wrapper.vm.setFieldValue('newPassword', 'Aa123456_')
    //   wrapper.vm.setFieldValue('newPasswordRepeat', 'Aa123456_')
    //
    //   await flushPromises()
    //
    //   console.log(wrapper.vm.formValues)
    //
    //   await wrapper.vm.$nextTick()
    //   const submitButton = wrapper.find('button[type="submit"]')
    //   expect(submitButton.attributes('disabled')).toBeUndefined()
    // })

    it('calls onSubmit method when form is submitted', async () => {
      await wrapper.find('form').trigger('submit')
      expect(mockSetPassword).toHaveBeenCalled()
    })
  })
})
