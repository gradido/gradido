import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Login from './Login.vue'
import AuthTriads from '@/components/Auth/AuthTriads.vue'
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

const { clearApolloCacheMock } = vi.hoisted(() => ({ clearApolloCacheMock: vi.fn() }))
vi.mock('@/plugins/apolloCache', () => ({
  clearApolloCache: clearApolloCacheMock,
}))

const mockMutate = vi.fn()
const mockQuery = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
  useLazyQuery: () => ({
    load: vi.fn(),
  }),
  useApolloClient: () => ({
    client: { query: mockQuery },
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
    clearApolloCacheMock.mockClear()

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
          AuthTriads: true,
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

  it('shows the rotating triads above the form, in place of the old fixed line', () => {
    const triads = wrapper.findComponent(AuthTriads)
    expect(triads.exists()).toBe(true)
    expect(wrapper.text()).not.toContain('gdd_per_link.isFree')
    // The gap below is the triads' own, the same on every door: no spacing from the page.
    expect(triads.classes().filter((name) => /^[mp][tbsexy]?-/.test(name))).toEqual([])
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
            login: {
              language: 'en',
              avatar: 'base64-picture',
              avatarVisibleToMembers: false,
              creationAllowed: false,
            },
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
        expect(store.dispatch).toHaveBeenCalledWith('login', expect.objectContaining({}))
      })

      /**
       * ⛔ `/login` carries no `requiresAuth`, so it opens while somebody is signed in,
       * and nothing here reloads the page. Every answer the PREVIOUS member's queries
       * returned would still be in the cache -- and a query without variables sits under
       * one key for everybody, so the new member would be shown the old one's data until
       * the network caught up. Logging out has cleared the cache since #3759; this is the
       * other way in.
       *
       * BEFORE the store learns who is here now, so nothing can read the new member's
       * name and the old member's answer in the same tick.
       */
      it('empties the cache of whoever was signed in before, first', () => {
        expect(clearApolloCacheMock).toHaveBeenCalled()
        expect(clearApolloCacheMock.mock.invocationCallOrder[0]).toBeLessThan(
          store.dispatch.mock.invocationCallOrder[0],
        )
      })

      it('commits email to store', () => {
        expect(store.commit).toHaveBeenCalledWith('email', 'user@example.org')
      })

      it('redirects to overview page', () => {
        expect(router.currentRoute.value.path).toBe('/overview')
      })

      // ⛔ The picture, its visibility switch and creationAllowed ride ON the login answer
      // and reach the store through the action, not through commits of this page's own. A
      // verifyLogin of its own used to follow the sign-in right here to fetch those three,
      // and this page is where it must not come back: it put a second connection pool into
      // the one request path every member and every test takes, and the member watched
      // their initials turn into a face while it flew.
      //
      // What the fields then DO is store.test.js's business -- the action is a mock here.
      // What is checked here is that they arrive at all, and that nothing is asked twice.
      it('hands the picture and its two own-view companions to the store action', () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          'login',
          expect.objectContaining({
            avatar: 'base64-picture',
            avatarVisibleToMembers: false,
            creationAllowed: false,
          }),
        )
      })

      it('asks nothing else after signing in', () => {
        expect(mockQuery).not.toHaveBeenCalled()
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

      // ⛔ The literal below is what `login` in UserResolver.ts really throws, word for
      // word. The spec used to feed 'User email not validated.', a sentence the backend
      // never produced - so this block was green while the branch it names had never once
      // fired. If the backend text moves, this is the half of the contract that has to move
      // with it; the other half is `UserResolver.test.ts`.
      describe('login fails because the address was never confirmed', () => {
        beforeEach(async () => {
          await createError('GraphQL error: The Users email is not validate yet')
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
