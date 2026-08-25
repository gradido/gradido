// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import ConfirmEmail from './ConfirmEmail.vue'

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
}))

vi.mock('@/components/Message/Message.vue', () => ({
  default: {
    name: 'Message',
    props: ['headline', 'subtitle', 'buttonText', 'linkTo'],
    template: '<div data-test="message">{{ headline }} | {{ subtitle }}</div>',
  },
}))

const route = { name: 'ConfirmEmail', params: { confirmationCode: 'the-confirmation-code' } }
vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const confirmMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({ mutate: confirmMock })),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      login: 'Login',
      'message.title': 'Done',
      'message.errorTitle': 'Error',
      'assistedRegistration.confirm.title': 'Confirm e-mail address',
      'assistedRegistration.confirm.text': 'confirm text',
      'assistedRegistration.confirm.button': 'Confirm address',
      'assistedRegistration.confirm.done': 'confirmed for good',
      'assistedRegistration.confirm.invalid': 'link invalid or expired',
    },
  },
})

const mountPage = () => mount(ConfirmEmail, { global: { plugins: [i18n] } })

describe('ConfirmEmail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing on being opened — a mail scanner that prefetches the link must not confirm', () => {
    mountPage()
    expect(confirmMock).not.toHaveBeenCalled()
  })

  it('confirms with the code from ITS OWN route parameter on click', async () => {
    confirmMock.mockResolvedValue({})
    const wrapper = mountPage()
    await wrapper.find('[data-test="confirm-email-action"]').trigger('click')
    expect(confirmMock).toHaveBeenCalledWith({ code: 'the-confirmation-code' })
    expect(wrapper.find('[data-test="message"]').text()).toContain('confirmed for good')
  })

  it('translates the refusal into the invalid message', async () => {
    confirmMock.mockRejectedValue(new Error('Could not confirm with this code'))
    const wrapper = mountPage()
    await wrapper.find('[data-test="confirm-email-action"]').trigger('click')
    expect(wrapper.find('[data-test="message"]').text()).toContain('link invalid or expired')
  })
})
