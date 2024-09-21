import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Register from './Register.vue'
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
      await wrapper.find('#registerFirstname').setValue('')
      await wrapper.find('#registerFirstname').trigger('blur')
      await flushPromises()
      expect(wrapper.find('#registerFirstnameLiveFeedback').text()).toBe(
        'The field firstname is invalid',
      )
    })

    it('displays a message that lastname is required', async () => {
      await wrapper.find('#registerLastname').setValue('')
      await wrapper.find('#registerLastname').trigger('blur')
      await flushPromises()
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
})
