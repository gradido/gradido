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
import { useEntryDraft } from '@/composables/useEntryDraft'
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
        eventMatchingEntry: null,
      },
      actions: {
        login: vi.fn(),
      },
      mutations: {
        email: vi.fn(),
        // As in store.js.
        eventMatchingEntry: (state, entry) => {
          state.eventMatchingEntry = entry ?? null
        },
        // As in store.js: no way back is the way to the overview.
        redirectPath: (state, path) => {
          state.redirectPath = path || '/overview'
        },
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
        { path: '/login/:code?', name: 'Login' },
        { path: '/contacts', name: 'Contacts' },
        { path: '/matching/:tab', name: 'Matching' },
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
    // iOS kept offering the saved password after every later tap in the home-screen app
    // (Bernd, 28.09.2026): the form went away while its field still held the focus.
    it('releases the focused field before leaving the form', async () => {
      const blur = vi.fn()
      const focused = vi.spyOn(Document.prototype, 'activeElement', 'get').mockReturnValue({ blur })
      await wrapper.find('#email-input-field').setValue('user@example.org')
      await wrapper.find('#password-input-field').setValue('1234')
      mockMutate.mockResolvedValue({ data: { login: { language: 'en' } } })
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      focused.mockRestore()
      expect(blur).toHaveBeenCalled()
    })

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

    /**
     * The guard keeps the address somebody asked for while signed out, and this page leads
     * there after the sign-in (routes/guards.js). It used to keep it afterwards as well: only
     * a sign-out put it back. A wallet that starts on this page with its session run out
     * signs nobody out, so every later sign-in led to that old address again -- into the
     * conversation a mail had linked to, instead of the overview. The way back is taken once.
     */
    describe('the way back to the address asked for while signed out', () => {
      const LINK = '/contacts?with=a-member'
      const signIn = async () => {
        await wrapper.find('#email-input-field').setValue('user@example.org')
        await wrapper.find('#password-input-field').setValue('1234')
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      }

      beforeEach(() => {
        mockMutate.mockResolvedValue({ data: { login: { language: 'en' } } })
        store.state.redirectPath = LINK
      })

      it('leads there after the sign-in, with all of the address', async () => {
        await signIn()

        expect(router.currentRoute.value.fullPath).toBe(LINK)
      })

      it('is used up by that: the store holds the way to the overview again', async () => {
        await signIn()

        expect(store.state.redirectPath).toBe('/overview')
      })

      it('leads the next sign-in to the overview', async () => {
        await signIn()
        await router.push('/login')

        await signIn()

        expect(router.currentRoute.value.fullPath).toBe('/overview')
      })

      // Taken after the sign-in has succeeded, not before.
      it('is kept through a sign-in that fails, for the one that follows', async () => {
        mockMutate.mockRejectedValueOnce(new Error('GraphQL error: No user with this credentials'))
        await signIn()
        expect(store.state.redirectPath).toBe(LINK)
        expect(router.currentRoute.value.fullPath).not.toBe(LINK)

        await signIn()

        expect(router.currentRoute.value.fullPath).toBe(LINK)
        expect(store.state.redirectPath).toBe('/overview')
      })

      // The code in the address comes first, as before. The sign-in has happened all the
      // same, and what was kept from an earlier arrival does not wait for the next one.
      it('is used up as well by a sign-in that goes on to a redeem page', async () => {
        await router.push('/login/abcdef0123')

        await signIn()

        expect(router.currentRoute.value.path).toBe('/redeem/abcdef0123')
        expect(store.state.redirectPath).toBe('/overview')
      })
    })

    /**
     * An event link was opened in this browser before anybody was signed in (`/event?…`,
     * routes/guards.js): the store has kept the entry it offers, with the moment it was kept,
     * and the sign-in is where there is a member to offer it to -- on their entries, in the
     * form for a new one.
     *
     * ⛔ Nobody was signed in when it was kept, so nothing says whose it is. It is taken by
     * the sign-in that follows the link, used or not, and counts for an hour: nothing of it
     * waits for whoever signs in on this browser after that.
     */
    describe('with an entry an event link offered before the sign-in', () => {
      const ENTRY = { summary: 'Kongress Frequency Healing', details: null, remote: true }
      const MINUTE = 60 * 1000
      const keptAgo = (ms) => ({ ...ENTRY, keptAt: Date.now() - ms })
      const entryDraft = useEntryDraft()
      const signIn = async () => {
        await wrapper.find('#email-input-field').setValue('user@example.org')
        await wrapper.find('#password-input-field').setValue('1234')
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      }

      beforeEach(() => {
        mockMutate.mockResolvedValue({ data: { login: { language: 'en' } } })
        store.state.eventMatchingEntry = keptAgo(2 * MINUTE)
      })
      // The draft lives in a module: nothing a case leaves behind may reach the next one.
      afterEach(() => {
        entryDraft.take()
      })

      it('leads to the entries instead of the overview', async () => {
        await signIn()

        expect(router.currentRoute.value.fullPath).toBe('/matching/entries')
      })

      it('hands the entry to the form there: an interest, with empty details as the form holds them', async () => {
        await signIn()

        expect(entryDraft.take()).toEqual({
          summary: 'Kongress Frequency Healing',
          details: '',
          remote: true,
          matchingType: 'interesse',
          unlessThere: true,
        })
      })

      it('takes it out of the store, so the next sign-in leads where it always did', async () => {
        await signIn()
        expect(store.state.eventMatchingEntry).toBeNull()
        entryDraft.take()
        await router.push('/login')

        await signIn()

        expect(router.currentRoute.value.fullPath).toBe('/overview')
        expect(entryDraft.take()).toBeNull()
      })

      // The back button should not offer the sign-in form to somebody who has just signed in.
      it('replaces the sign-in form in the history', async () => {
        const replace = vi.spyOn(router, 'replace')
        const push = vi.spyOn(router, 'push')

        await signIn()

        expect(replace).toHaveBeenCalledWith('/matching/entries')
        expect(push).not.toHaveBeenCalled()
      })

      // Taken after the sign-in has succeeded, not before.
      it('is kept through a sign-in that fails, for the one that follows', async () => {
        const kept = store.state.eventMatchingEntry
        mockMutate.mockRejectedValueOnce(new Error('GraphQL error: No user with this credentials'))
        await signIn()
        expect(store.state.eventMatchingEntry).toEqual(kept)
        expect(entryDraft.take()).toBeNull()

        await signIn()

        expect(router.currentRoute.value.fullPath).toBe('/matching/entries')
      })

      /**
       * The hour. Kept longer ago than that, the entry is no longer the wish of whoever signs
       * in now -- the browser may have been somebody else's in between, and the event is over.
       */
      describe('kept more than an hour ago', () => {
        beforeEach(() => {
          store.state.eventMatchingEntry = keptAgo(61 * MINUTE)
        })

        it('leads to the overview, with nothing for the form', async () => {
          await signIn()

          expect(router.currentRoute.value.fullPath).toBe('/overview')
          expect(entryDraft.take()).toBeNull()
        })

        it('lets the old entry go', async () => {
          await signIn()

          expect(store.state.eventMatchingEntry).toBeNull()
        })
      })

      it('still offers an entry kept just under an hour ago', async () => {
        store.state.eventMatchingEntry = keptAgo(59 * MINUTE)

        await signIn()

        expect(router.currentRoute.value.fullPath).toBe('/matching/entries')
      })

      // What the store holds without its moment says nothing about its age.
      it('offers nothing that carries no moment, and lets it go', async () => {
        store.state.eventMatchingEntry = { ...ENTRY }

        await signIn()

        expect(router.currentRoute.value.fullPath).toBe('/overview')
        expect(entryDraft.take()).toBeNull()
        expect(store.state.eventMatchingEntry).toBeNull()
      })

      // The overview by its record, not by the letters of the address.
      it.each([['/overview/'], ['/Overview'], ['/overview?from=mail']])(
        'reads the way back %s as the overview, and offers the entry',
        async (back) => {
          store.state.redirectPath = back

          await signIn()

          expect(router.currentRoute.value.fullPath).toBe('/matching/entries')
          expect(entryDraft.take()?.summary).toBe('Kongress Frequency Healing')
        },
      )

      /**
       * Of the two wishes kept for after a sign-in the younger one counts. Opening an event
       * link puts the way back to the overview (guards.js), so a way back that leads to a
       * page was written after the link: the reply button of a mail pressed since leads into
       * its conversation. The link's entry is the older wish, and goes.
       */
      describe('and a page that was asked for after the link', () => {
        const LINK = '/contacts?with=a-member'
        beforeEach(() => {
          store.state.redirectPath = LINK
        })

        it('leads to that page', async () => {
          await signIn()

          expect(router.currentRoute.value.fullPath).toBe(LINK)
        })

        it('hands nothing to the form', async () => {
          await signIn()

          expect(entryDraft.take()).toBeNull()
        })

        // Not kept for a later sign-in: by then it would be offered to whoever comes next.
        it('lets the entry go: the sign-in after leads to the overview', async () => {
          await signIn()
          expect(store.state.eventMatchingEntry).toBeNull()
          await router.push('/login')

          await signIn()

          expect(router.currentRoute.value.fullPath).toBe('/overview')
          expect(entryDraft.take()).toBeNull()
        })
      })

      // A redeem code in the address has a place of its own to lead to, as before.
      describe('and a redeem code in the address', () => {
        beforeEach(async () => {
          await router.push('/login/abcdef0123')
        })

        it('goes on to the redeem page with the code', async () => {
          await signIn()

          expect(router.currentRoute.value.path).toBe('/redeem/abcdef0123')
        })

        it('hands nothing to the form, and lets the entry go', async () => {
          await signIn()

          expect(entryDraft.take()).toBeNull()
          expect(store.state.eventMatchingEntry).toBeNull()
        })
      })

      // A project has a place of its own to lead to as well, and went first before: the
      // sign-in goes on to its space. Here that way fails -- which shows where it stands:
      // ahead of the entries, so nothing was handed to the form.
      describe('and a project the sign-in belongs to', () => {
        beforeEach(() => {
          store.state.project = 'garden'
          mockMutate
            .mockResolvedValueOnce({ data: { login: { language: 'en' } } })
            .mockRejectedValueOnce(new Error('the space is away'))
        })
        afterEach(() => {
          store.state.project = null
        })

        it('goes the project’s way first: nothing is handed to the form', async () => {
          await signIn()

          expect(mockMutate).toHaveBeenLastCalledWith({ project: 'garden' })
          expect(entryDraft.take()).toBeNull()
          expect(router.currentRoute.value.fullPath).not.toBe('/matching/entries')
        })

        it('lets the entry go all the same', async () => {
          await signIn()

          expect(store.state.eventMatchingEntry).toBeNull()
        })
      })
    })

    it('hands nothing to the form for a new entry where no event link was opened', async () => {
      mockMutate.mockResolvedValue({ data: { login: { language: 'en' } } })
      await wrapper.find('#email-input-field').setValue('user@example.org')
      await wrapper.find('#password-input-field').setValue('1234')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(router.currentRoute.value.fullPath).toBe('/overview')
      expect(useEntryDraft().take()).toBeNull()
    })

    // The last step of a registration over a transaction link: the confirmation mail leads
    // over `/checkEmail/<optin>/<code>` to `/login/<code>` (see `ResetPassword.spec.js`), and
    // from here the code has to reach the redeem page instead of the overview.
    describe('valid data with a redeem code in the address', () => {
      beforeEach(async () => {
        await router.push('/login/abcdef0123')
        await wrapper.find('#email-input-field').setValue('user@example.org')
        await wrapper.find('#password-input-field').setValue('1234')
        mockMutate.mockResolvedValue({ data: { login: { language: 'en' } } })
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      })

      it('goes on to the redeem page with the code', () => {
        expect(router.currentRoute.value.name).toBe('Redeem')
        expect(router.currentRoute.value.path).toBe('/redeem/abcdef0123')
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
