// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import UserEmail from './UserEmail.vue'
import { cancelEmailChange, requestEmailChange, resendEmailChange } from '@/graphql/mutations'

vi.mock('bootstrap-vue-next', () => ({
  BFormInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
  },
  BFormGroup: { template: '<div><slot></slot></div>' },
  // Hands the event on, because the component listens with `.prevent` and a modifier
  // needs something to call preventDefault on.
  BForm: { template: '<form @submit.prevent="$emit(`submit`, $event)"><slot></slot></form>' },
  BButton: {
    props: ['disabled', 'type'],
    template:
      '<button :disabled="disabled" :type="type" @click="$emit(`click`)"><slot></slot></button>',
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'form.email': 'E-mail',
      'form.cancel': 'Cancel',
      'settings.emailInfo': 'info',
      'settings.email.change': 'Change e-mail address',
      'settings.email.new': 'New e-mail address',
      'settings.email.password': 'Your current password',
      'settings.email.password-why': 'why',
      'settings.email.send': 'Send confirmation e-mail',
      'settings.email.sent': 'sent to {email}',
      'settings.email.pending': 'pending for {email}',
      'settings.email.resend': 'Send e-mail again',
      'settings.email.resend-wait': 'Send again in {minutes} min.',
      'settings.email.cancel': 'Cancel',
      'settings.email.cancelled': 'cancelled',
      'settings.email.error-password': 'wrong password',
      'settings.email.error-taken': 'taken',
      'settings.email.error-wait': 'wait',
      'settings.email.error-same': 'same',
      'settings.email.error-invalid': 'invalid',
    },
  },
})

// Three mutations share one composable; telling them apart by the document is what lets a
// test see WHICH one a button fired - a single shared mock could not.
const requestMock = vi.fn()
const resendMock = vi.fn()
const cancelMock = vi.fn()
const refetchMock = vi.fn()
const pendingResult = ref({ pendingEmailChange: null })
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn((document) => ({
    mutate:
      document === requestEmailChange
        ? requestMock
        : document === resendEmailChange
          ? resendMock
          : cancelMock,
  })),
  useQuery: vi.fn(() => ({
    result: pendingResult,
    refetch: refetchMock,
  })),
}))

const toastErrorMock = vi.fn()
const toastSuccessMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: toastErrorMock,
    toastSuccess: toastSuccessMock,
  }),
}))

const store = createStore({
  state: () => ({ email: 'old@example.org' }),
})

const mountComponent = () => mount(UserEmail, { global: { plugins: [store, i18n] } })

describe('UserEmail', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    pendingResult.value = { pendingEmailChange: null }
    wrapper = mountComponent()
  })

  it('shows the address the account currently has', () => {
    expect(wrapper.find('[data-test="email-current"]').element.value).toBe('old@example.org')
  })

  describe('without a change under way', () => {
    it('keeps the form closed until asked', async () => {
      expect(wrapper.find('[data-test="email-change-form"]').exists()).toBe(false)
      await wrapper.find('[data-test="email-change-open"]').trigger('click')
      expect(wrapper.find('[data-test="email-change-form"]').exists()).toBe(true)
    })

    it('sends address and password, then tells and refetches', async () => {
      requestMock.mockResolvedValue({ data: { requestEmailChange: { email: 'new@example.org' } } })
      await wrapper.find('[data-test="email-change-open"]').trigger('click')
      await wrapper.find('[data-test="email-new"]').setValue('new@example.org')
      await wrapper.find('[data-test="email-password"]').setValue('Aa12345_')
      await wrapper.find('[data-test="email-change-form"]').trigger('submit')
      await nextTick()
      expect(requestMock).toHaveBeenCalledWith({ email: 'new@example.org', password: 'Aa12345_' })
      expect(toastSuccessMock).toHaveBeenCalledWith('sent to new@example.org')
      expect(refetchMock).toHaveBeenCalled()
      expect(resendMock).not.toHaveBeenCalled()
      expect(cancelMock).not.toHaveBeenCalled()
    })

    it('does not submit while a field is empty', async () => {
      await wrapper.find('[data-test="email-change-open"]').trigger('click')
      await wrapper.find('[data-test="email-new"]').setValue('new@example.org')
      expect(wrapper.find('[data-test="email-submit"]').attributes('disabled')).toBeDefined()
    })

    it('puts the wrong-password answer into the member language', async () => {
      requestMock.mockRejectedValue(new Error('GraphQL error: Password is invalid'))
      await wrapper.find('[data-test="email-change-open"]').trigger('click')
      await wrapper.find('[data-test="email-new"]').setValue('new@example.org')
      await wrapper.find('[data-test="email-password"]').setValue('nope')
      await wrapper.find('[data-test="email-change-form"]').trigger('submit')
      await nextTick()
      expect(toastErrorMock).toHaveBeenCalledWith('wrong password')
      expect(refetchMock).not.toHaveBeenCalled()
    })
  })

  describe('with a change under way', () => {
    const inFuture = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const inPast = new Date(Date.now() - 60 * 1000).toISOString()

    it('names the waiting address and holds the resend button inside the window', async () => {
      pendingResult.value = {
        pendingEmailChange: { email: 'new@example.org', resendAllowedAt: inFuture },
      }
      wrapper = mountComponent()
      expect(wrapper.find('[data-test="email-pending"]').text()).toContain(
        'pending for new@example.org',
      )
      expect(wrapper.find('[data-test="email-change-open"]').exists()).toBe(false)
      const resend = wrapper.find('[data-test="email-resend"]')
      expect(resend.attributes('disabled')).toBeDefined()
      expect(resend.text()).toContain('Send again in 5 min.')
    })

    it('resends once the window has passed', async () => {
      pendingResult.value = {
        pendingEmailChange: { email: 'new@example.org', resendAllowedAt: inPast },
      }
      resendMock.mockResolvedValue({ data: { resendEmailChange: { email: 'new@example.org' } } })
      wrapper = mountComponent()
      const resend = wrapper.find('[data-test="email-resend"]')
      expect(resend.attributes('disabled')).toBeUndefined()
      await resend.trigger('click')
      await nextTick()
      expect(resendMock).toHaveBeenCalled()
      expect(requestMock).not.toHaveBeenCalled()
      expect(toastSuccessMock).toHaveBeenCalledWith('sent to new@example.org')
    })

    it('cancels and refetches', async () => {
      pendingResult.value = {
        pendingEmailChange: { email: 'new@example.org', resendAllowedAt: inFuture },
      }
      cancelMock.mockResolvedValue({ data: { cancelEmailChange: true } })
      wrapper = mountComponent()
      await wrapper.find('[data-test="email-cancel"]').trigger('click')
      await nextTick()
      expect(cancelMock).toHaveBeenCalled()
      expect(toastSuccessMock).toHaveBeenCalledWith('cancelled')
      expect(refetchMock).toHaveBeenCalled()
    })
  })
})
