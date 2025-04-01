import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ForgotPassword from './ForgotPassword.vue'
import { BCol, BContainer, BForm, BRow } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: {},
  })),
}))

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: vi.fn(),
  })),
}))

vi.mock('vee-validate', () => ({
  useForm: vi.fn(() => ({
    meta: { valid: true },
    values: { email: 'test@example.com' },
  })),
}))

describe('ForgotPassword', () => {
  let wrapper
  let mutate
  let toastError

  beforeEach(() => {
    vi.clearAllMocks()

    mutate = vi.fn()
    vi.mocked(useMutation).mockReturnValue({ mutate })

    toastError = vi.fn()
    vi.mocked(useAppToast).mockReturnValue({ toastError })

    wrapper = mount(ForgotPassword, {
      global: {
        components: {
          BContainer,
          BForm,
          BRow,
          BCol,
        },
        mocks: {
          $t: (msg) => msg,
        },
        stubs: ['BButton', 'input-email', 'message'],
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.forgot-password').exists()).toBe(true)
  })

  it('shows the form initially', () => {
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('message').exists()).toBe(false)
  })

  it('disables submit button when form is invalid', async () => {
    vi.mocked(useForm).mockReturnValue({
      meta: { valid: false },
      values: { email: 'incorrect' },
    })

    wrapper = mount(ForgotPassword, {
      global: {
        components: {
          BContainer,
          BForm,
          BRow,
          BCol,
        },
        mocks: {
          $t: (msg) => msg,
        },
        stubs: ['BButton', 'input-email', 'message'],
      },
    })

    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('b-button-stub[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.attributes('variant')).toBe('gradido-disable')
  })

  it('enables submit button when form is valid', async () => {
    vi.mocked(useForm).mockReturnValue({
      meta: { valid: true },
      values: { email: 'correct@email.com' },
    })

    wrapper = mount(ForgotPassword, {
      global: {
        components: {
          BContainer,
          BForm,
          BRow,
          BCol,
        },
        mocks: {
          $t: (msg) => msg,
        },
        stubs: ['BButton', 'input-email', 'message'],
      },
    })

    await wrapper.vm.$nextTick()
    const submitButton = wrapper.find('b-button-stub[type="submit"]')
    expect(submitButton.attributes('disabled')).toBe('false')
    expect(submitButton.attributes('variant')).toBe('gradido')
  })

  it('calls mutation on form submit', async () => {
    wrapper = mount(ForgotPassword, {
      global: {
        components: {
          BContainer,
          BForm,
          BRow,
          BCol,
        },
        mocks: {
          $t: (msg) => msg,
        },
        stubs: ['BButton', 'input-email', 'message'],
      },
    })

    await wrapper.find('form').trigger('submit')

    expect(mutate).toHaveBeenCalledWith({
      email: 'correct@email.com',
    })
  })

  it('shows success message after successful mutation', async () => {
    wrapper = mount(ForgotPassword, {
      global: {
        components: {
          BContainer,
          BForm,
          BRow,
          BCol,
        },
        mocks: {
          $t: (msg) => msg,
        },
        stubs: ['BButton', 'input-email', 'message'],
      },
    })

    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(wrapper.find('message-stub').exists()).toBe(true)
    expect(wrapper.vm.success).toBe(true)
  })

  it('shows error message and calls toastError on mutation failure', async () => {
    mutate.mockRejectedValue(new Error('Test error'))

    wrapper = mount(ForgotPassword, {
      global: {
        components: {
          BContainer,
          BForm,
          BRow,
          BCol,
        },
        mocks: {
          $t: (msg) => msg,
        },
        stubs: ['BButton', 'input-email', 'message'],
      },
    })

    await nextTick()

    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(wrapper.find('message-stub').exists()).toBe(true)
    expect(wrapper.vm.success).toBe(false)
    expect(wrapper.vm.showPageMessage).toBe(true)
    expect(toastError).toHaveBeenCalledWith('error.email-already-sent')

    // Verify that the error message is displayed
    const messageComponent = wrapper.findComponent({ name: 'message' })
    expect(messageComponent.props('headline')).toBe('message.errorTitle')
    expect(messageComponent.props('subtitle')).toBe('error.email-already-sent')
    expect(messageComponent.attributes('data-test')).toBe('forgot-password-error')
  })

  it('changes subtitle when coming from a specific route', async () => {
    const { useRoute } = await import('vue-router')
    useRoute.mockReturnValue({
      params: { comingFrom: 'someRoute' },
    })

    wrapper = mount(ForgotPassword, {
      global: {
        stubs: ['BContainer', 'BRow', 'BCol', 'BForm', 'BButton', 'input-email', 'message'],
      },
    })

    expect(wrapper.vm.subtitle).toBe('settings.password.resend_subtitle')
  })
})
