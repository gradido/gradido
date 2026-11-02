// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'
import TransactionResultSendError from './TransactionResultSendError.vue'
import SendEmailResultError from './SendEmailResultError.vue'

const showing = (component, errorResult) => {
  i18n.global.locale.value = 'de'
  return mount(component, { props: { errorResult }, global: { plugins: [i18n] } })
}

describe('TransactionResultSendError', () => {
  it('says in the member’s language that nobody was found, and not the server’s sentence', () => {
    const wrapper = showing(
      TransactionResultSendError,
      'The recipient user was not found: sarah@example.org',
    )
    expect(wrapper.find('.test-receiver-not-found').text()).toBe('Empfänger nicht gefunden')
    expect(wrapper.text()).not.toContain('The recipient user')
    expect(wrapper.text()).not.toContain('sarah@example.org')
  })

  it('leaves every other failure as it was: the server’s words', () => {
    const wrapper = showing(TransactionResultSendError, 'Sender and Recipient are the same')
    expect(wrapper.find('.test-receiver-not-found').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sender and Recipient are the same')
  })
})

describe('SendEmailResultError', () => {
  it('knows the same failure by the same rule', () => {
    const wrapper = showing(SendEmailResultError, 'The recipient user was not found: Sarah-K')
    expect(wrapper.find('.test-receiver-not-found').text()).toBe(
      'Zu Deinem angegebenen E-Mail-Empfänger existiert kein Nutzerkonto.',
    )
  })
})
