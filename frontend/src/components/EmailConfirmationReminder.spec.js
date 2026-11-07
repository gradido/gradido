// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { walletStore } from '@test/walletStore'
import { createI18n } from 'vue-i18n'
import { BModal } from 'bootstrap-vue-next'
import EmailConfirmationReminder from './EmailConfirmationReminder.vue'
import {
  firstLoginWindow,
  forgetFirstLoginWindows,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
  BModal: {
    // The stub carries the two closing props so the unclosable state is observable: the
    // real BModal reads them, and a stub that dropped them would let every test pass
    // with a modal anybody could close. Typed as bootstrap-vue-next types them (Boolean):
    // the window sets them as bare attributes, and only a Boolean prop reads those as true.
    props: { modelValue: Boolean, noCloseOnBackdrop: Boolean, noCloseOnEsc: Boolean },
    template:
      '<div v-if="modelValue" :data-no-close="noCloseOnBackdrop && noCloseOnEsc"><slot></slot><slot name="footer"></slot></div>',
  },
}))

const routerPushMock = vi.fn()
const route = { path: '/overview' }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: routerPushMock }),
}))

const resendMock = vi.fn()
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({ mutate: resendMock })),
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
      'emailConfirmation.title': 'Confirm your e-mail address',
      'emailConfirmation.mailSent': 'a mail is on its way',
      'emailConfirmation.overdue': 'the grace period has ended',
      'emailConfirmation.resent': 'mail is on its way again',
      'emailConfirmation.resend': 'Send mail again',
      'emailConfirmation.changeAddress': 'Correct address',
    },
  },
})

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

const mountWith = (state) =>
  mount(EmailConfirmationReminder, {
    global: {
      plugins: [walletStore({ language: 'en', ...state }), i18n],
    },
  })

describe('EmailConfirmationReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.path = '/overview'
    forgetFirstLoginWindows()
  })

  it('stays away from a confirmed account — and from one whose state is unknown', () => {
    expect(
      mountWith({ emailChecked: true, accountCreatedAt: hoursAgo(25) })
        .find('[data-test="email-confirmation-reminder"]')
        .exists(),
    ).toBe(false)
    expect(
      mountWith({ emailChecked: null, accountCreatedAt: null })
        .find('[data-test="email-confirmation-reminder"]')
        .exists(),
    ).toBe(false)
  })

  // EM-014: inside the 24 hours the strip on the page tells the member about the clock
  // (EmailConfirmationStrip). The window does not open and does not stand in the order of the
  // first-login windows -- the question of the name comes first.
  describe('inside the grace period', () => {
    it('does not show, and claims no place among the first-login windows', () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
      expect(wrapper.find('[data-test="email-confirmation-reminder"]').exists()).toBe(false)
      expect(firstLoginWindow.value).toBeNull()

      setFirstLoginWindowWanted('alias', true)
      expect(firstLoginWindow.value).toBe('alias')
    })
  })

  describe('past the grace period', () => {
    it('has no way to close and says the grace period has ended', () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      expect(wrapper.find('[data-test="email-confirmation-overdue"]').exists()).toBe(true)
      expect(
        wrapper.find('[data-test="email-confirmation-reminder"]').attributes('data-no-close'),
      ).toBe('true')
      // Two buttons, the two ways out -- nothing that puts the window aside.
      expect(wrapper.findAll('button').map((button) => button.attributes('data-test'))).toEqual([
        'email-confirmation-change-address',
        'email-confirmation-resend',
      ])
    })

    it('comes first, before the question of the name', () => {
      mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      setFirstLoginWindowWanted('alias', true)
      expect(firstLoginWindow.value).toBe('email')
    })

    it('keeps the two ways out: resending the mail …', async () => {
      resendMock.mockResolvedValue({})
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      await wrapper.find('[data-test="email-confirmation-resend"]').trigger('click')
      expect(resendMock).toHaveBeenCalled()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-test="email-confirmation-resent"]').exists()).toBe(true)
    })

    it('… and correcting the address in the settings', async () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      await wrapper.find('[data-test="email-confirmation-change-address"]').trigger('click')
      expect(routerPushMock).toHaveBeenCalledWith('/settings/account')
    })

    it('shows the rate-limit answer instead of swallowing it', async () => {
      resendMock.mockRejectedValue(new Error('Email already sent less than 10 minutes ago'))
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      await wrapper.find('[data-test="email-confirmation-resend"]').trigger('click')
      await wrapper.vm.$nextTick()
      expect(toastErrorMock).toHaveBeenCalledWith('Email already sent less than 10 minutes ago')
    })
  })

  describe('when the deadline passes mid-session', () => {
    it('appears by itself, and cannot be closed', async () => {
      vi.useFakeTimers()
      try {
        // 30 seconds of grace left when the wallet opens.
        const wrapper = mountWith({
          emailChecked: false,
          accountCreatedAt: new Date(Date.now() - (24 * 60 * 60 * 1000 - 30000)).toISOString(),
        })
        expect(wrapper.find('[data-test="email-confirmation-reminder"]').exists()).toBe(false)

        // Two minutes later the ticker has fired and the deadline lies behind us.
        vi.advanceTimersByTime(2 * 60000)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('[data-test="email-confirmation-overdue"]').exists()).toBe(true)
        expect(
          wrapper.find('[data-test="email-confirmation-reminder"]').attributes('data-no-close'),
        ).toBe('true')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  it('never covers the settings — the address correction lives there', () => {
    route.path = '/settings/account'
    const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
    expect(wrapper.find('[data-test="email-confirmation-reminder"]').exists()).toBe(false)
  })

  /**
   * ⛔ Never two windows on top of each other. The conversation an address opened
   * (`/contacts?with=…`) comes before the windows of the first logins: somebody who has just
   * accepted a thank-you taps "… antworten" and meets the wallet through that address.
   */
  describe('while the conversation an address opened is on screen', () => {
    const reminder = (wrapper) => wrapper.find('[data-test="email-confirmation-reminder"]')

    it('waits, and comes once the conversation is closed', async () => {
      setFirstLoginWindowWanted('contact', true)
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })

      expect(reminder(wrapper).exists()).toBe(false)

      setFirstLoginWindowWanted('contact', false)
      await nextTick()

      expect(reminder(wrapper).exists()).toBe(true)
      expect(wrapper.find('[data-test="email-confirmation-overdue"]').exists()).toBe(true)
    })

    it('gives way where it was open, and comes back afterwards', async () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      expect(reminder(wrapper).exists()).toBe(true)

      setFirstLoginWindowWanted('contact', true)
      await nextTick()
      expect(reminder(wrapper).exists()).toBe(false)

      setFirstLoginWindowWanted('contact', false)
      await nextTick()
      expect(reminder(wrapper).exists()).toBe(true)
    })

    // The window writes back that it closed. That is no answer of the member's -- there is no
    // way to close this window -- and it must not keep it away once the conversation is closed.
    it('does not take giving way for an answer', async () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      setFirstLoginWindowWanted('contact', true)
      await nextTick()

      wrapper.findComponent(BModal).vm.$emit('update:modelValue', false)
      await nextTick()
      setFirstLoginWindowWanted('contact', false)
      await nextTick()

      expect(reminder(wrapper).exists()).toBe(true)
    })
  })
})
