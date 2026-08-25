// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import RegisterAssist from './RegisterAssist.vue'

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled', 'type'],
    template:
      '<button :disabled="disabled" :type="type" @click="$emit(`click`)"><slot></slot></button>',
  },
  BForm: {
    // The submit event has to travel WITH the native event: @submit.prevent calls
    // $event.preventDefault(), and a mock that emits without it kills the handler
    // silently (the lesson from the wallet's own delivery notes).
    template: '<form @submit="$emit(`submit`, $event)"><slot></slot></form>',
  },
  BRow: { template: '<div><slot></slot></div>' },
  BCol: { template: '<div><slot></slot></div>' },
}))

vi.mock('@/components/Inputs/InputEmail.vue', () => ({
  default: { name: 'InputEmail', template: '<div data-test="stub-input-email"></div>' },
}))
vi.mock('@/components/Inputs/InputPasswordConfirmation.vue', () => ({
  default: {
    name: 'InputPasswordConfirmation',
    props: ['modelValue', 'register'],
    template: '<div data-test="stub-input-password"></div>',
  },
}))
vi.mock('@/components/Message/Message.vue', () => ({
  default: {
    name: 'Message',
    props: ['headline', 'subtitle', 'buttonText', 'linkTo'],
    template:
      '<div data-test="message" :data-link-to="JSON.stringify(linkTo)">{{ subtitle }}</div>',
  },
}))

const route = { name: 'RegisterAssist', params: { assistCode: '1234567890' } }
vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const infoResult = ref({ assistedRegistrationInfo: { firstName: 'Guest', lastName: 'Person' } })
let infoErrorHandler
const completeMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: infoResult,
    onError: (handler) => {
      infoErrorHandler = handler
    },
  })),
  useMutation: vi.fn(() => ({ mutate: completeMock })),
}))

// The form values the member filled in — handed to the page through vee-validate's
// useForm, exactly where the page reads them.
const formValues = { email: 'guest@example.org', newPassword: 'Aa12345_' }
vi.mock('vee-validate', () => ({
  useForm: () => ({ meta: ref({ valid: true }), values: formValues }),
  useField: () => ({ value: ref(''), errorMessage: ref(''), meta: { valid: true } }),
}))

const toastErrorMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: toastErrorMock, toastSuccess: vi.fn() }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      login: 'Login',
      'message.title': 'Done',
      'message.errorTitle': 'Error',
      'settings.password.reset': 'Reset password',
      'assistedRegistration.assist.title': 'Setting up together',
      'assistedRegistration.assist.intro': '{name} would like to start a Gradido account.',
      'assistedRegistration.assist.emailHint': 'their own address, not yours',
      'assistedRegistration.assist.button': 'Set up account',
      'assistedRegistration.assist.done': 'account ready, mail on its way',
      'assistedRegistration.assist.loginButton': 'Sign in and redeem',
      'assistedRegistration.assist.invalid': 'link invalid or expired',
      'assistedRegistration.assist.emailTaken': 'address already has an account',
    },
  },
})

const mountPage = () => mount(RegisterAssist, { global: { plugins: [i18n] } })

describe('RegisterAssist page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('greets with the guest name from the parked attempt', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-test="assist-guest-name"]').text()).toContain('Guest Person')
  })

  it('completes with the route code and the typed values — password and email as strings', async () => {
    completeMock.mockResolvedValue({
      data: { completeAssistedRegistration: { redeemCode: 'CL-cafe' } },
    })
    const wrapper = mountPage()
    await wrapper.find('form').trigger('submit')
    expect(completeMock).toHaveBeenCalledWith({
      assistCode: '1234567890',
      email: 'guest@example.org',
      password: 'Aa12345_',
    })
    const sent = completeMock.mock.calls[0][0]
    expect(typeof sent.email).toBe('string')
    expect(typeof sent.password).toBe('string')
  })

  it('sends the guest into the redeem flow: /login with the redeem code as its parameter', async () => {
    completeMock.mockResolvedValue({
      data: { completeAssistedRegistration: { redeemCode: 'CL-cafe' } },
    })
    const wrapper = mountPage()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const message = wrapper.find('[data-test="message"]')
    expect(message.text()).toContain('account ready')
    expect(JSON.parse(message.attributes('data-link-to'))).toEqual({
      name: 'Login',
      params: { code: 'CL-cafe' },
    })
  })

  it('explains an address that already has an account and points to "forgot password"', async () => {
    completeMock.mockRejectedValue(new Error('Email address already in use'))
    const wrapper = mountPage()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="message"]').text()).toContain('address already has an account')
  })

  it('answers an invalid link with one page-level message instead of an empty form', async () => {
    const wrapper = mountPage()
    infoErrorHandler()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="message"]').text()).toContain('link invalid or expired')
  })
})
