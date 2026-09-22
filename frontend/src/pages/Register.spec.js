import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Register from './Register.vue'
import AuthTriads from '@/components/Auth/AuthTriads.vue'
import flushPromises from 'flush-promises'
import { createRouter, createWebHistory } from 'vue-router'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import {
  BButton,
  BCol,
  BContainer,
  BForm,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import { configure, defineRule } from 'vee-validate'
import { email, min, required } from '@vee-validate/rules'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import { createUser } from '@/graphql/mutations'
import en from '@/locales/en.json'

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

describe('Register', () => {
  let wrapper
  let router
  let store
  let i18n

  const createVuexStore = () => {
    return createStore({
      state: {
        email: 'peter@lustig.de',
        language: 'en',
        publisherId: 'test-publisher-id',
      },
    })
  }

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/register', name: 'Register' }],
    })
    store = createVuexStore()
    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          'validations.messages.required': 'This field is required',
          'error.unknown-error': 'Unknown error',
          'message.title': 'Message Title',
          'message.register': 'Register Message',
        },
      },
    })

    wrapper = mount(Register, {
      global: {
        plugins: [router, store, i18n],
        stubs: {
          BContainer,
          BForm,
          BRow,
          BCol,
          BFormGroup,
          BFormInput,
          BFormInvalidFeedback,
          BFormCheckbox,
          BButton,
          InputEmail,
          Message: true,
          AuthTriads: true,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Register form', () => {
    expect(wrapper.find('div#registerform').exists()).toBe(true)
  })

  it('shows the rotating triads above the form, in place of the old fixed line', () => {
    const triads = wrapper.findComponent(AuthTriads)
    expect(triads.exists()).toBe(true)
    expect(wrapper.text()).not.toContain('gdd_per_link.isFree')
    // The gap below is the triads' own, the same on every door: no spacing from the page.
    expect(triads.classes().filter((name) => /^[mp][tbsexy]?-/.test(name))).toEqual([])
  })

  describe('Register form', () => {
    it('has a register form', () => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('has firstname input fields', () => {
      expect(wrapper.find('#registerFirstname').exists()).toBe(true)
    })

    it('has lastname input fields', () => {
      expect(wrapper.find('#registerLastname').exists()).toBe(true)
    })

    it('has email input fields', () => {
      expect(wrapper.find('#email-input-field').exists()).toBe(true)
    })

    it('has 1 checkbox input fields', () => {
      expect(wrapper.find('#registerCheckbox').exists()).toBe(true)
    })

    it('displays a message that firstname is required', async () => {
      // First set some value to make the field dirty
      await wrapper.find('#registerFirstname').setValue('test')
      await wrapper.find('#registerFirstname').trigger('blur')

      // Then clear it to trigger validation
      await wrapper.find('#registerFirstname').setValue('')
      await wrapper.find('#registerFirstname').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#registerFirstnameLiveFeedback').exists()).toBe(true)
      expect(wrapper.find('#registerFirstnameLiveFeedback').text()).toBe(
        'The field firstname is invalid',
      )
    })

    it('displays a message that lastname is required', async () => {
      // First set some value to make the field dirty
      await wrapper.find('#registerLastname').setValue('test')
      await wrapper.find('#registerLastname').trigger('blur')

      // Then clear it to trigger validation
      await wrapper.find('#registerLastname').setValue('')
      await wrapper.find('#registerLastname').trigger('blur')
      await flushPromises()

      expect(wrapper.find('#registerLastnameLiveFeedback').exists()).toBe(true)
      expect(wrapper.find('#registerLastnameLiveFeedback').text()).toBe(
        'The field lastname is invalid',
      )
    })
  })

  describe('API calls when form is missing input', () => {
    beforeEach(async () => {
      await wrapper.find('#registerFirstname').setValue('Max')
      await wrapper.find('#registerLastname').setValue('Mustermann')
    })

    it('has disabled submit button when missing input checked box', async () => {
      await wrapper.find('#email-input-field').setValue('max.mustermann@gradido.net')
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('has disabled submit button when missing email input', async () => {
      await wrapper.find('#registerCheckbox').setValue(true)
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('API calls when completely filled', () => {
    beforeEach(async () => {
      await wrapper.find('#registerFirstname').setValue('Max')
      await wrapper.find('#registerLastname').setValue('Mustermann')
      await wrapper.find('#email-input-field').setValue('max.mustermann@gradido.net')
      await wrapper.find('#registerCheckbox').setValue(true)
    })

    it('has enabled submit button when completely filled', async () => {
      await flushPromises()
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBe(undefined)
    })

    describe('server sends back error', () => {
      const createError = async (errorMessage) => {
        mockMutate.mockRejectedValue(new Error(errorMessage))
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      }

      describe('server sends back error "Unknown error"', () => {
        beforeEach(async () => {
          await createError('Unknown error')
        })

        it('shows no error message on the page', () => {
          expect(wrapper.vm.showPageMessage).toBe(false)
          expect(wrapper.find('.test-message-headline').exists()).toBe(false)
          expect(wrapper.find('.test-message-subtitle').exists()).toBe(false)
          expect(wrapper.find('.test-message-button').exists()).toBe(false)
        })

        it('toasts the error message', () => {
          expect(mockToastError).toHaveBeenCalledWith('Unknown error Unknown error')
        })
      })
    })

    describe('server sends back success', () => {
      beforeEach(async () => {
        mockMutate.mockResolvedValue({
          data: {
            create: 'success',
          },
        })
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      })

      it('submit sends apollo mutate', () => {
        expect(mockMutate).toHaveBeenCalledWith({
          email: 'max.mustermann@gradido.net',
          firstName: 'Max',
          lastName: 'Mustermann',
          language: 'en',
          publisherId: 'test-publisher-id',
          redeemCode: undefined,
        })
      })

      it('shows success title, subtitle', () => {
        expect(wrapper.vm.showPageMessage).toBe(true)
        expect(wrapper.find('message-stub').attributes('headline')).toBe('Message Title')
        expect(wrapper.find('message-stub').attributes('subtitle')).toBe('Register Message')
      })
    })
  })

  describe('redeem code', () => {
    describe('no redeem code', () => {
      it('has no redeem code', () => {
        expect(wrapper.vm.redeemCode).toBe(undefined)
      })
    })

    describe('with redeem code', () => {
      beforeEach(async () => {
        router.currentRoute.value.params.code = 'some-code'
        wrapper = mount(Register, {
          global: {
            plugins: [router, store, i18n],
            stubs: {
              BContainer,
              BForm,
              BRow,
              BCol,
              BFormGroup,
              BFormInput,
              BFormInvalidFeedback,
              BFormCheckbox,
              BButton,
              InputEmail,
              Message: true,
              AuthTriads: true,
            },
          },
        })
        await wrapper.find('#registerFirstname').setValue('Max')
        await wrapper.find('#registerLastname').setValue('Mustermann')
        await wrapper.find('#email-input-field').setValue('max.mustermann@gradido.net')
        await wrapper.find('#registerCheckbox').setValue(true)
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      })

      it('sends the redeem code to the server', () => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'max.mustermann@gradido.net',
            firstName: 'Max',
            lastName: 'Mustermann',
            language: 'en',
            redeemCode: 'some-code',
          }),
        )
      })
    })
  })

  // "Create account" on /u/<name> carries the name as ?referrer=<name>. The page greets with
  // it above the form and hands it to createUser, where its owner becomes the referrer.
  describe('the address the registration started at', () => {
    // The real English texts: the strip carries a placeholder, and only the language file can
    // say whether the page fills the one it names.
    const pageAt = async (query) => {
      const addressRouter = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/register/:code?', name: 'Register', component: { template: '<div />' } },
        ],
      })
      await addressRouter.push({ name: 'Register', query })
      await addressRouter.isReady()
      return mount(Register, {
        global: {
          plugins: [
            addressRouter,
            store,
            createI18n({ legacy: false, locale: 'en', messages: { en } }),
          ],
          stubs: {
            BContainer,
            BForm,
            BRow,
            BCol,
            BFormGroup,
            BFormInput,
            BFormInvalidFeedback,
            BFormCheckbox,
            BButton,
            InputEmail,
            Message: true,
            AuthTriads: true,
          },
        },
      })
    }

    const submit = async (page) => {
      mockMutate.mockResolvedValue({ data: { createUser: { id: 1 } } })
      await page.find('#registerFirstname').setValue('Max')
      await page.find('#registerLastname').setValue('Mustermann')
      await page.find('#email-input-field').setValue('max.mustermann@gradido.net')
      await page.find('#registerCheckbox').setValue(true)
      await page.find('form').trigger('submit')
      await flushPromises()
      expect(mockMutate).toHaveBeenCalledTimes(1)
      return mockMutate.mock.calls[0][0]
    }

    it('names the person who showed Gradido, above the form', async () => {
      const page = await pageAt({ referrer: 'MeisterBob' })

      const strip = page.find('[data-test="register-shown-by"]')
      expect(strip.text()).toBe(en.site.signup.shownBy.replace('{name}', 'MeisterBob'))
      expect(
        strip.element.compareDocumentPosition(page.find('form').element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('hands the name to createUser', async () => {
      const page = await pageAt({ referrer: 'MeisterBob' })

      expect(await submit(page)).toEqual(expect.objectContaining({ referrerAlias: 'MeisterBob' }))
    })

    // Not an empty value but no field at all: a registration that did not start at an address
    // sends exactly what it sent before.
    it('shows no strip and sends no referrer without an address to come from', async () => {
      const page = await pageAt({})

      expect(page.find('[data-test="register-shown-by"]').exists()).toBe(false)
      expect(await submit(page)).not.toHaveProperty('referrerAlias')
    })

    // The strip reads back what came in the address, so only a user name is taken -- anything
    // else would put a stranger's text above the form. The server would ignore it anyway.
    it('takes nothing that is not a user name', async () => {
      const page = await pageAt({ referrer: '<b>Your bank</b>' })

      expect(page.find('[data-test="register-shown-by"]').exists()).toBe(false)
      expect(page.find('b').exists()).toBe(false)
      expect(await submit(page)).not.toHaveProperty('referrerAlias')
    })

    // A GraphQL document carries only the variables it declares; an undeclared one is dropped
    // on the way out without an error, and the account would open without its referrer. The
    // component tests cannot see that -- they replace the mutation -- so this holds the real
    // document the page imports: declared, and handed to the argument of that name.
    it('sends a document that declares the name and hands it to createUser', () => {
      const operation = createUser.definitions[0]
      const field = operation.selectionSet.selections[0]

      expect(operation.variableDefinitions.map((v) => v.variable.name.value)).toContain(
        'referrerAlias',
      )
      const argument = field.arguments.find((a) => a.name.value === 'referrerAlias')
      expect(argument?.value.kind).toBe('Variable')
      expect(argument?.value.name.value).toBe('referrerAlias')
    })
  })
})
