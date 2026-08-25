// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import EmailConfirmationReminder from './EmailConfirmationReminder.vue'

vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
  BModal: {
    // The stub carries the two closing props so the overdue state is observable: the
    // real BModal reads them, and a stub that dropped them would let every test pass
    // with a modal anybody could close.
    props: ['modelValue', 'noCloseOnBackdrop', 'noCloseOnEsc'],
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
      'emailConfirmation.grace': 'until {deadline} you can use everything',
      'emailConfirmation.overdue': 'the grace period has ended',
      'emailConfirmation.resent': 'mail is on its way again',
      'emailConfirmation.resend': 'Send mail again',
      'emailConfirmation.changeAddress': 'Correct address',
      'emailConfirmation.later': 'Later',
    },
  },
})

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

const mountWith = (state) =>
  mount(EmailConfirmationReminder, {
    global: {
      plugins: [createStore({ state: () => ({ language: 'en', ...state }) }), i18n],
    },
  })

describe('EmailConfirmationReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.path = '/overview'
  })

  it('stays away from a confirmed account — and from one whose state is unknown', () => {
    expect(
      mountWith({ emailChecked: true, accountCreatedAt: hoursAgo(1) })
        .find('[data-test="email-confirmation-reminder"]')
        .exists(),
    ).toBe(false)
    expect(
      mountWith({ emailChecked: null, accountCreatedAt: null })
        .find('[data-test="email-confirmation-reminder"]')
        .exists(),
    ).toBe(false)
  })

  describe('inside the grace period', () => {
    it('reminds, names the deadline and can be waved away', async () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
      expect(wrapper.find('[data-test="email-confirmation-grace"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="email-confirmation-later"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="email-confirmation-reminder"]').attributes('data-no-close')).toBe(
        'false',
      )
      await wrapper.find('[data-test="email-confirmation-later"]').trigger('click')
      expect(wrapper.find('[data-test="email-confirmation-reminder"]').exists()).toBe(false)
    })
  })

  describe('past the grace period', () => {
    it('loses every way to close and switches to the overdue text', () => {
      const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
      expect(wrapper.find('[data-test="email-confirmation-overdue"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="email-confirmation-later"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="email-confirmation-reminder"]').attributes('data-no-close')).toBe(
        'true',
      )
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

  it('never covers the settings — the address correction lives there', () => {
    route.path = '/settings/account'
    const wrapper = mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
    expect(wrapper.find('[data-test="email-confirmation-reminder"]').exists()).toBe(false)
  })
})
