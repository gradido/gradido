import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Login from './Login.vue'
import flushPromises from 'flush-promises'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import { BButton, BCol, BContainer, BFormInput, BRow } from 'bootstrap-vue-next'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import InputPassword from '@/components/Inputs/InputPassword.vue'
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
  useLazyQuery: () => ({
    load: vi.fn(),
  }),
}))

describe('Login', () => {
  let wrapper
  let router
  let store
  let i18n

  const createVuexStore = () => {
    return createStore({
      state: {
        publisherId: 12345,
        redirectPath: '/overview',
      },
      actions: {
        login: vi.fn(),
      },
      mutations: {
        email: vi.fn(),
      },
    })
  }

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/forgot-password', name: 'ForgotPassword' },
        { path: '/reset-password/login', name: 'ResetPassword' },
        { path: '/overview', name: 'Overview' },
        { path: '/redeem/:code', name: 'Redeem' },
      ],
    })

    store = createVuexStore()

    vi.spyOn(store, 'dispatch')
    vi.spyOn(store, 'commit')

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          'settings.password.forgot_pwd': 'Forgot Password',
          'form.password': 'Password',
          login: 'Login',
          'validations.messages.required': 'This field is required',
          'message.errorTitle': 'Error',
          'message.activateEmail': 'Please activate your email',
          'message.unsetPassword': 'Please set your password',
          'settings.password.reset': 'Reset Password',
          'error.no-account': 'No account found',
          'error.no-user': 'No user found',
          'error.unknown-error': 'Unknown error',
        },
      },
    })

    wrapper = mount(Login, {
      global: {
        plugins: [router, store, i18n],
        stubs: {
          BContainer,
          BRow,
          BCol,
          BButton,
          BFormInput,
          InputEmail,
          InputPassword,
          Message: true,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Login form', () => {
    expect(wrapper.find('div.login-form').exists()).toBe(true)
  })

  describe('links', () => {
    it('has a link "Forgot Password"', () => {
      expect(wrapper.find('[data-test="forgot-password-link"]').text()).toBe('Forgot Password')
    })
  })

  describe('Login form', () => {
    it('has a login form', () => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('has an Email input field', () => {
      expect(wrapper.find('#email-input-field').exists()).toBe(true)
    })

    it('has a Password input field', () => {
      expect(wrapper.find('#password-input-field').exists()).toBe(true)
    })

    it('has a Submit button', () => {
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })
  })

  describe('submit', () => {
    describe('valid data', () => {
      beforeEach(async () => {
        await wrapper.find('#email-input-field').setValue('user@example.org')
        await wrapper.find('#password-input-field').setValue('1234')
        mockMutate.mockResolvedValue({
          data: {
            login: 'token',
          },
        })
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      })

      it('calls the API with the given data', () => {
        expect(mockMutate).toHaveBeenCalledWith({
          email: 'user@example.org',
          password: '1234',
          publisherId: 12345,
        })
      })

      it('dispatches server response to store', () => {
        expect(store.dispatch).toHaveBeenCalledWith('login', 'token')
      })

      it('commits email to store', () => {
        expect(store.commit).toHaveBeenCalledWith('email', 'user@example.org')
      })

      it('redirects to overview page', () => {
        expect(router.currentRoute.value.path).toBe('/overview')
      })
    })

    describe('login fails', () => {
      const createError = async (errorMessage) => {
        mockMutate.mockRejectedValue(new Error(errorMessage))
        await wrapper.find('#email-input-field').setValue('user@example.org')
        await wrapper.find('#password-input-field').setValue('1234')
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      }

      describe('login fails with "User email not validated"', () => {
        beforeEach(async () => {
          await createError('GraphQL error: User email not validated.')
        })

        it('shows error message', () => {
          expect(wrapper.find('message-stub').attributes('headline')).toBe('Error')
          expect(wrapper.find('message-stub').attributes('subtitle')).toBe(
            'Please activate your email',
          )
          expect(wrapper.find('message-stub').attributes('buttontext')).toBe('Reset Password')
        })

        it('toasts the error message', () => {
          expect(mockToastError).toHaveBeenCalledWith('No account found')
        })
      })
    })
  })
})
