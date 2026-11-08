// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { walletStore } from '@test/walletStore'
import EmailConfirmationStrip from './EmailConfirmationStrip.vue'
import EmailConfirmationReminder from './EmailConfirmationReminder.vue'
import {
  firstLoginWindow,
  forgetFirstLoginWindows,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'

// Only for the window in the last test: the strip itself is plain markup.
vi.mock('bootstrap-vue-next', () => ({
  BButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled" @click="$emit(`click`)"><slot></slot></button>',
  },
  BModal: {
    // Typed as bootstrap-vue-next types them: the window sets the two as bare attributes.
    props: { modelValue: Boolean, noCloseOnBackdrop: Boolean, noCloseOnEsc: Boolean },
    template:
      '<div v-if="modelValue" :data-no-close="noCloseOnBackdrop && noCloseOnEsc"><slot></slot><slot name="footer"></slot></div>',
  },
}))

// Reactive, so that leaving the settings can be seen: a plain object only shows what the strip
// does on the route it was mounted on.
const routePath = ref('/overview')
const pushed = []
vi.mock('vue-router', () => ({
  useRoute: () => ({
    get path() {
      return routePath.value
    },
  }),
  useRouter: () => ({ push: (to) => pushed.push(to) }),
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
      'emailConfirmation.strip': 'a mail is on its way; until {deadline} everything is open',
      'emailConfirmation.mailSent': 'a mail is on its way',
      'emailConfirmation.overdue': 'the grace period has ended',
      'emailConfirmation.resent': 'mail is on its way again',
      'emailConfirmation.resend': 'Send mail again',
      'emailConfirmation.resendTooSoon': 'the mail has only just gone',
      'emailConfirmation.changeAddress': 'Correct address',
    },
  },
})

const HOUR = 60 * 60 * 1000
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR).toISOString()

let wrapper

const mountWith = (state, component = EmailConfirmationStrip) => {
  wrapper = mount(component, {
    global: { plugins: [walletStore({ language: 'en', ...state }), i18n] },
  })
  return wrapper
}

const strip = () => wrapper.find('[data-test="email-confirmation-strip"]')

describe('EmailConfirmationStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushed.length = 0
    routePath.value = '/overview'
    forgetFirstLoginWindows()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  describe('inside the grace period', () => {
    it('names the address, the mail and the deadline', () => {
      const createdAt = hoursAgo(1)
      mountWith({ emailChecked: false, accountCreatedAt: createdAt })
      const deadline = new Date(new Date(createdAt).getTime() + 24 * HOUR).toLocaleString('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })

      expect(strip().exists()).toBe(true)
      expect(strip().text()).toContain('Confirm your e-mail address')
      expect(wrapper.find('[data-test="email-confirmation-strip-sentence"]').text()).toBe(
        `a mail is on its way; until ${deadline} everything is open`,
      )
    })

    // EM-014: the clock runs, so there is nothing to put aside -- the strip stays until the
    // address is confirmed.
    it('offers the two ways and nothing that puts it aside', () => {
      mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
      const buttons = strip().findAll('button')
      expect(buttons.map((button) => button.attributes('data-test'))).toEqual([
        'email-confirmation-strip-resend',
        'email-confirmation-strip-change-address',
      ])
      expect(buttons.map((button) => button.text())).toEqual(['Send mail again', 'Correct address'])
    })

    it('is a region named by its title, and only its last line is live', () => {
      mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
      const titleId = strip().attributes('aria-labelledby')
      expect(strip().element.tagName).toBe('SECTION')
      expect(wrapper.find(`#${titleId}`).text()).toBe('Confirm your e-mail address')
      // In the DOM before anything is said in it, and empty until then.
      const status = strip().find('[role="status"]')
      expect(status.exists()).toBe(true)
      expect(status.text()).toBe('')
      expect(strip().attributes('role')).toBeUndefined()
    })
  })

  it('stays away past the deadline -- the window takes over there', () => {
    mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(25) })
    expect(strip().exists()).toBe(false)
  })

  it('stays away from a confirmed account, and from one whose state is unknown', () => {
    mountWith({ emailChecked: true, accountCreatedAt: hoursAgo(1) })
    expect(strip().exists()).toBe(false)
    wrapper.unmount()
    mountWith({ emailChecked: null, accountCreatedAt: hoursAgo(1) })
    expect(strip().exists()).toBe(false)
  })

  it('never stands in the settings, and is back when the member leaves them', async () => {
    routePath.value = '/settings/account'
    mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
    expect(strip().exists()).toBe(false)

    routePath.value = '/overview'
    await nextTick()
    expect(strip().exists()).toBe(true)
  })

  describe('sending the mail again', () => {
    it('sends it, waits, and says so under the sentence', async () => {
      let answer
      resendMock.mockReturnValue(
        new Promise((resolve) => {
          answer = resolve
        }),
      )
      mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
      const button = () => wrapper.find('[data-test="email-confirmation-strip-resend"]')

      await button().trigger('click')
      expect(resendMock).toHaveBeenCalledTimes(1)
      expect(button().attributes('disabled')).toBeDefined()

      answer({})
      await nextTick()
      await nextTick()
      expect(button().attributes('disabled')).toBeUndefined()
      expect(strip().find('[role="status"]').text()).toBe('mail is on its way again')
      expect(wrapper.find('[data-test="email-confirmation-strip-resent"]').exists()).toBe(true)
    })

    it('shows the refusal instead of swallowing it, and claims nothing', async () => {
      resendMock.mockRejectedValue(new Error('Email already sent less than 10 minutes ago'))
      mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })

      await wrapper.find('[data-test="email-confirmation-strip-resend"]').trigger('click')
      await nextTick()
      expect(toastErrorMock).toHaveBeenCalledWith('the mail has only just gone')
      expect(wrapper.find('[data-test="email-confirmation-strip-resent"]').exists()).toBe(false)
    })
  })

  it('leads to the settings to correct the address', async () => {
    mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
    await wrapper.find('[data-test="email-confirmation-strip-change-address"]').trigger('click')
    expect(pushed).toEqual(['/settings/account'])
  })

  // It covers nothing, so it takes no part in the order of the first-login windows: the
  // question of the name is the first window inside the 24 hours.
  it('is not one of the first-login windows and holds none of them back', () => {
    mountWith({ emailChecked: false, accountCreatedAt: hoursAgo(1) })
    expect(strip().exists()).toBe(true)
    expect(firstLoginWindow.value).toBeNull()

    setFirstLoginWindowWanted('alias', true)
    expect(firstLoginWindow.value).toBe('alias')
  })

  /**
   * One clock for the two forms (useEmailConfirmation): in the minute the strip goes, the
   * window that cannot be closed comes -- neither before the other, and never both.
   */
  describe('when the deadline passes mid-session', () => {
    const Both = defineComponent({
      setup: () => () => h('div', [h(EmailConfirmationStrip), h(EmailConfirmationReminder)]),
    })
    const reminder = () => wrapper.find('[data-test="email-confirmation-reminder"]')

    it('the strip goes and the window comes, by themselves', async () => {
      vi.useFakeTimers()
      // 30 seconds of grace left when the wallet opens.
      mountWith(
        {
          emailChecked: false,
          accountCreatedAt: new Date(Date.now() - (24 * HOUR - 30000)).toISOString(),
        },
        Both,
      )
      expect(strip().exists()).toBe(true)
      expect(reminder().exists()).toBe(false)

      // The next minute's tick: the deadline lies behind us.
      vi.advanceTimersByTime(60000)
      await nextTick()
      expect(strip().exists()).toBe(false)
      expect(reminder().exists()).toBe(true)
      expect(reminder().attributes('data-no-close')).toBe('true')
    })
  })
})
