// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { walletStore } from '@test/walletStore'
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
  wrapper = mount(Host, { global: { plugins: [walletStore({ language: 'en', ...state })] } })
  return confirmation
}

describe('useEmailConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      resendMock.mockRejectedValue(new Error('Email already sent less than 10 minutes ago'))
      const { resend, resending, resent } = mountWith({
        emailChecked: false,
        accountCreatedAt: hoursAgo(1),
      })

      await resend()
      expect(toastErrorMock).toHaveBeenCalledWith('Email already sent less than 10 minutes ago')
      expect(resent.value).toBe(false)
      expect(resending.value).toBe(false)
    })
  })
})
