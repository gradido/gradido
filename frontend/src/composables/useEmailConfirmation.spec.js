// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { walletStore } from '@test/walletStore'
import i18n from '@/i18n'
import { CONFIRMATION_GRACE_HOURS, useEmailConfirmation } from './useEmailConfirmation'

const resendMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({ mutate: resendMock })),
}))

const toastErrorMock = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({ toastError: toastErrorMock, toastSuccess: vi.fn() }),
}))

const HOUR = 60 * 60 * 1000
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR).toISOString()

let wrapper
let confirmation

// The composable starts its ticker in onMounted, so it is called from a component's setup.
const mountWith = (state) => {
  const Host = defineComponent({
    setup() {
      confirmation = useEmailConfirmation()
      return () => h('div')
    },
  })
  // The wallet's own vue-i18n and language files: what the member reads is what the files say.
  wrapper = mount(Host, { global: { plugins: [walletStore({ language: 'en', ...state }), i18n] } })
  return confirmation
}

describe('useEmailConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    i18n.global.locale.value = 'de'
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  // The backend's copy is CONFIRMATION_GRACE_PERIOD_HOURS (EmailConfirmation.logic.ts).
  it('counts 24 hours of grace', () => {
    expect(CONFIRMATION_GRACE_HOURS).toBe(24)
  })

  describe('which address it speaks about', () => {
    it.each([
      [false, true],
      [true, false],
      [null, false],
    ])('emailChecked %s -> unconfirmed %s', (emailChecked, expected) => {
      const { unconfirmed } = mountWith({ emailChecked, accountCreatedAt: hoursAgo(1) })
      expect(unconfirmed.value).toBe(expected)
    })
  })

  describe('the deadline', () => {
    it('lies 24 hours after the account was created', () => {
      const { deadline } = mountWith({
        emailChecked: false,
        accountCreatedAt: '2026-11-07T10:00:00.000Z',
      })
      expect(deadline.value.toISOString()).toBe('2026-11-08T10:00:00.000Z')
    })

    it('is unknown, and never over, without the moment of creation', () => {
      const { deadline, overdue, deadlineText } = mountWith({
        emailChecked: false,
        accountCreatedAt: null,
      })
      expect(deadline.value).toBeNull()
      expect(overdue.value).toBe(false)
      expect(deadlineText.value).toBe('')
    })

    it('is written in the language of the member', () => {
      const createdAt = '2026-11-07T10:00:00.000Z'
      expect(
        mountWith({ emailChecked: false, accountCreatedAt: createdAt, language: 'de' }).deadlineText
          .value,
      ).toContain('08.11.2026')
      wrapper.unmount()
      expect(
        mountWith({ emailChecked: false, accountCreatedAt: createdAt, language: 'en' }).deadlineText
          .value,
      ).toContain('Nov 8, 2026')
    })

    it.each([
      [1, false],
      [23.9, false],
      [24.1, true],
      [25, true],
    ])('created %s hours ago -> overdue %s', (hours, expected) => {
      const { overdue } = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(hours) })
      expect(overdue.value).toBe(expected)
    })
  })

  describe('the clock while the page stays open', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    // Under the threshold first: a ticker of 0 ms, or none at all, would pass the second half
    // alone.
    it('goes over by itself with the next minute, and not before', async () => {
      const { overdue } = mountWith({
        emailChecked: false,
        accountCreatedAt: new Date(Date.now() - (24 * HOUR - 30000)).toISOString(),
      })
      expect(overdue.value).toBe(false)

      vi.advanceTimersByTime(59000)
      await nextTick()
      expect(overdue.value).toBe(false)

      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(overdue.value).toBe(true)
    })

    it('stops its ticker with the component', () => {
      mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
      expect(vi.getTimerCount()).toBe(1)
      wrapper.unmount()
      wrapper = null
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('sending the mail again', () => {
    it('says so once the server took it, and is busy until then', async () => {
      let answer
      resendMock.mockReturnValue(
        new Promise((resolve) => {
          answer = resolve
        }),
      )
      const { resend, resending, resent } = mountWith({
        emailChecked: false,
        accountCreatedAt: hoursAgo(1),
      })

      const done = resend()
      expect(resendMock).toHaveBeenCalledTimes(1)
      expect(resending.value).toBe(true)
      expect(resent.value).toBe(false)

      answer({})
      await done
      expect(resending.value).toBe(false)
      expect(resent.value).toBe(true)
      expect(toastErrorMock).not.toHaveBeenCalled()
    })

    it('shows the refusal instead of swallowing it, and claims nothing', async () => {
      resendMock.mockRejectedValue(new Error('Nothing to confirm for this account'))
      const { resend, resending, resent } = mountWith({
        emailChecked: false,
        accountCreatedAt: hoursAgo(1),
      })

      await resend()
      // A refusal the wallet has no words for stands in the server's own.
      expect(toastErrorMock).toHaveBeenCalledWith('Nothing to confirm for this account')
      expect(resent.value).toBe(false)
      expect(resending.value).toBe(false)
    })

    /**
     * E-045: asked again too soon, the server says "Email already sent less than N minutes ago"
     * (AssistedRegistrationResolver, EMAIL_CODE_REQUEST_TIME) -- in English, and with a number from
     * its configuration that the wallet does not know. The member reads it in their language,
     * without the number. ⛔ The beginning of the server's sentence is one half of a contract; the
     * other half is the backend's tests of `resendConfirmationEmail`.
     */
    it.each([
      'Email already sent less than 10 minutes ago',
      'Email already sent less than 1 hours and 30 minutes ago',
    ])('says that the mail has only just gone, for "%s"', async (message) => {
      resendMock.mockRejectedValue(new Error(message))
      const { resend, resending, resent } = mountWith({
        emailChecked: false,
        accountCreatedAt: hoursAgo(1),
      })

      await resend()
      expect(toastErrorMock).toHaveBeenCalledTimes(1)
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Die Bestätigungs-Mail ist gerade erst gegangen. Bitte warte ein paar Minuten, bevor Du sie noch einmal anforderst.',
      )
      expect(toastErrorMock.mock.calls[0][0]).not.toMatch(/\d/)
      expect(resent.value).toBe(false)
      expect(resending.value).toBe(false)
    })

    // In every language the wallet speaks: a sentence of its own, without a number to go stale.
    it.each(['de', 'en', 'el', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr'])(
      'has the sentence in %s, without a number',
      (lang) => {
        const say = (locale) => i18n.global.t('emailConfirmation.resendTooSoon', {}, { locale })
        const sentence = say(lang)

        expect(sentence).not.toBe('emailConfirmation.resendTooSoon')
        expect(sentence).not.toMatch(/\d|\{|\}/)
        if (lang !== 'en') expect(sentence).not.toBe(say('en'))
      },
    )

    it('says it in the language the wallet speaks', async () => {
      i18n.global.locale.value = 'en'
      resendMock.mockRejectedValue(new Error('Email already sent less than 10 minutes ago'))
      const { resend } = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })

      await resend()
      expect(toastErrorMock).toHaveBeenCalledWith(
        'The confirmation e-mail has only just gone out. Please wait a few minutes before asking for it again.',
      )
    })
  })
})
