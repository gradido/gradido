// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicContactForm from './PublicContactForm.vue'

const mockMutate = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: mockMutate }),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: mockToastError }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'public-profile': {
        contact: {
          name: 'Your name',
          email: 'Your e-mail address',
          submit: 'Send',
          sent: 'Thank you, your message is on its way.',
          error: 'Your message could not be sent right now.',
          privacy: 'We only use your details to pass your message on.',
        },
      },
      form: { subject: 'Subject', message: 'Message' },
      footer: { privacy_policy: 'Privacy policy' },
    },
  },
})

const wrapperFor = () =>
  mount(PublicContactForm, {
    props: { recipientIdentifier: 'bernd' },
    global: {
      plugins: [i18n],
      stubs: { 'validated-input': true },
    },
  })

const fillIn = async (wrapper) => {
  wrapper.vm.form.senderName = 'Ein Fremder'
  wrapper.vm.form.senderEmail = 'stranger@example.org'
  wrapper.vm.form.subject = 'Hallo'
  wrapper.vm.form.message = 'Wir haben uns gestern getroffen.'
  await wrapper.vm.$nextTick()
}

describe('PublicContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutate.mockResolvedValue(true)
  })

  it('sends what the visitor wrote, with the alias out of the address', async () => {
    const wrapper = wrapperFor()
    await fillIn(wrapper)

    await wrapper.find('form').trigger('submit')

    expect(mockMutate).toHaveBeenCalledWith({
      recipientIdentifier: 'bernd',
      senderName: 'Ein Fremder',
      senderEmail: 'stranger@example.org',
      subject: 'Hallo',
      message: 'Wir haben uns gestern getroffen.',
      website: '',
    })
  })

  it('keeps the button shut until every field is filled in', async () => {
    const wrapper = wrapperFor()
    expect(wrapper.find('[data-test="public-contact-submit"]').attributes('disabled')).toBeDefined()

    await fillIn(wrapper)

    expect(
      wrapper.find('[data-test="public-contact-submit"]').attributes('disabled'),
    ).toBeUndefined()
  })

  // Whether the message was delivered, thrown away or stopped at the door never reaches this
  // component -- so there is one sentence, and it is the same one every time.
  it('thanks the visitor and puts the form away', async () => {
    const wrapper = wrapperFor()
    await fillIn(wrapper)

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="public-contact-sent"]').text()).toBe(
      'Thank you, your message is on its way.',
    )
    expect(wrapper.find('form').exists()).toBe(false)
  })

  // The one failure worth showing: the visitor's own connection. It says nothing about the
  // recipient, and swallowing it would leave somebody staring at a form that ate their words.
  it('keeps the form and says so when the message could not be sent at all', async () => {
    mockMutate.mockRejectedValue(new Error('network'))
    const wrapper = wrapperFor()
    await fillIn(wrapper)

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(mockToastError).toHaveBeenCalledWith('Your message could not be sent right now.')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[data-test="public-contact-sent"]').exists()).toBe(false)
  })

  // The form takes an address and free text from somebody who is not a member, so it has to
  // say what happens with them, where it happens -- no other form in the house does this yet.
  it('says at the form itself what becomes of the data, with a link', () => {
    const wrapper = wrapperFor()

    expect(wrapper.text()).toContain('We only use your details to pass your message on.')
    const link = wrapper.find('a[href*="datenschutz"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Privacy policy')
  })

  it('carries a honeypot that no person can reach', () => {
    const wrapper = wrapperFor()
    const honeypot = wrapper.find('input[name="website"]')

    expect(honeypot.exists()).toBe(true)
    expect(honeypot.attributes('tabindex')).toBe('-1')
    expect(honeypot.element.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
