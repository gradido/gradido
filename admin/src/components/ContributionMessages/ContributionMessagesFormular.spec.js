import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useCreaClipboard } from '@/composables/useCreaClipboard'
import { useCreaSupplement } from '@/composables/useCreaSupplement'
import { ContributionMessagesFormular } from './ContributionMessagesFormular'

// Mutable so single tests can model a stale stored moderator (no alias yet).
const { storeState } = vi.hoisted(() => ({
  storeState: { moderator: { firstName: 'Bernd', alias: 'berndh' } },
}))
vi.mock('@/store/useAdminStore', () => ({
  useAdminStore: () => storeState,
}))

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: mockToastError,
    toastSuccess: mockToastSuccess,
  }),
}))

const mockMutate = vi.fn().mockResolvedValue({})
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: { value: 'en' },
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

// Which side of the phone boundary the window is on, set per test. jsdom has no matchMedia, so
// the real composable would answer `unknown` everywhere.
const { viewport } = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { viewport: ref('unknown') }
})
vi.mock('@/composables/useViewport', () => ({ useViewport: () => viewport }))

// The calendar of the reminder, reduced to what the form reads of it: its v-model.
vi.mock('vue3-datepicker', () => ({
  default: {
    name: 'Datepicker',
    props: ['modelValue', 'lowerLimit', 'locale', 'inputFormat'],
    emits: ['update:modelValue'],
    template: '<input class="datepicker-stub" />',
  },
}))

const MEMO = 'It is a test memo'
const IN_A_WEEK = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

describe('ContributionMessagesFormular', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(ContributionMessagesFormular, {
      global: {
        // The parts of the form a moderator works with are the real ones; only the tooltips
        // over the tab titles are left out.
        stubs: { BTooltip: true },
      },
      props: {
        contributionId: 42,
        contributionMemo: MEMO,
        hideResubmission: true,
        ...props,
      },
    })
  }

  // BTabs draws its tab buttons once its tabs have registered, a tick after mounting.
  const mountForm = async (props) => {
    const mounted = createWrapper(props)
    await nextTick()
    return mounted
  }

  // The three tabs: message to the member, note for the moderation, the memo itself.
  const tabs = () => wrapper.findAll('[role="tab"]')
  const openTab = async (index) => {
    await tabs()[index].trigger('click')
    await nextTick()
  }
  const textareas = () => wrapper.findAll('textarea')
  const messageField = () => textareas()[0]
  const memoField = () => textareas()[2]
  const submitButton = () => wrapper.find('[data-test="submit-dialog"]')
  const reminderBox = () => wrapper.find('input[type="checkbox"]')
  const datepicker = () => wrapper.findComponent({ name: 'Datepicker' })
  const setReminder = async (date, time) => {
    await reminderBox().setValue(true)
    datepicker().vm.$emit('update:modelValue', date)
    await wrapper.find('input[placeholder="hh:mm"]').setValue(time)
    await nextTick()
  }
  const submit = async () => {
    await submitButton().trigger('click')
    await flushPromises()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    viewport.value = 'unknown'
    mockMutate.mockResolvedValue({})
    useCreaClipboard().setLastResponse('')
    useCreaSupplement().setLastSupplement('')
  })

  it('renders the component', async () => {
    wrapper = await mountForm()
    expect(wrapper.find('.contribution-messages-formular').exists()).toBe(true)
  })

  it('starts on the message tab with the memo in its own tab', async () => {
    wrapper = await mountForm()
    expect(tabs()).toHaveLength(3)
    expect(tabs()[0].attributes('aria-selected')).toBe('true')
    expect(memoField().element.value).toBe(MEMO)
  })

  it('resets form on reset event', async () => {
    wrapper = await mountForm()
    await messageField().setValue('text form message')
    await memoField().setValue('changed memo')

    await wrapper.find('form').trigger('reset')
    await nextTick()
    expect(messageField().element.value).toBe('')
    expect(memoField().element.value).toBe(MEMO)
  })

  it('keeps the save closed while the message is empty', async () => {
    wrapper = await mountForm()
    expect(submitButton().attributes('disabled')).toBeDefined()
    await messageField().setValue('text form message')
    expect(submitButton().attributes('disabled')).toBeUndefined()
  })

  it('submits form and emits events', async () => {
    wrapper = await mountForm()
    await messageField().setValue('text form message')

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('get-list-contribution-messages')).toEqual([[42]])
    expect(wrapper.emitted('update-status')).toEqual([[42]])
    expect(mockToastSuccess).toHaveBeenCalledWith('message.request')
    // And the field is empty again for the next message.
    expect(messageField().element.value).toBe('')
  })

  it('sends DIALOG contribution message', async () => {
    wrapper = await mountForm()
    await messageField().setValue('text form message')

    await submit()
    expect(mockMutate).toHaveBeenCalledWith({
      resubmissionAt: null,
      message: 'text form message',
      messageType: 'DIALOG',
      contributionId: 42,
    })
  })

  it('sends MODERATOR contribution message', async () => {
    wrapper = await mountForm()
    await openTab(1)
    await textareas()[1].setValue('text form message')

    await submit()
    expect(mockMutate).toHaveBeenCalledWith({
      resubmissionAt: null,
      message: 'text form message',
      messageType: 'MODERATOR',
      contributionId: 42,
    })
  })

  it('sends resubmission contribution message', async () => {
    wrapper = await mountForm()
    await messageField().setValue('text form message')
    await setReminder(IN_A_WEEK, '08:46')

    await submit()
    const expected = new Date(IN_A_WEEK)
    expected.setHours(8)
    expected.setMinutes(46)
    expect(mockMutate).toHaveBeenCalledWith({
      resubmissionAt: expected.toString(),
      message: 'text form message',
      messageType: 'DIALOG',
      contributionId: 42,
    })
  })

  it('refuses a reminder in the past', async () => {
    wrapper = await mountForm()
    await messageField().setValue('text form message')
    await setReminder(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), '08:46')

    await submit()
    expect(mockMutate).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('contributionMessagesForm.resubmissionDateInPast')
  })

  it('emits resubmission-saved with the contribution id when a reminder is set', async () => {
    wrapper = await mountForm()
    await setReminder(IN_A_WEEK, '08:46')

    await submit()

    const saved = wrapper.emitted('resubmission-saved')
    expect(saved).toBeTruthy()
    expect(saved[0][0].id).toBe(42)
    expect(typeof saved[0][0].resubmissionAt).toBe('string')
    // Only the reminder changed: the contribution is updated, no message is written.
    expect(mockMutate).toHaveBeenCalledWith({ resubmissionAt: saved[0][0].resubmissionAt, id: 42 })
    expect(wrapper.emitted('update-contributions')).toEqual([[]])
  })

  it('emits resubmission-saved with null when an existing reminder is removed', async () => {
    // simulate unchecking the reminder box on a contribution that had one
    wrapper = await mountForm({ inputResubmissionDate: IN_A_WEEK.toString() })
    expect(reminderBox().element.checked).toBe(true)
    await reminderBox().setValue(false)

    await submit()

    const saved = wrapper.emitted('resubmission-saved')
    expect(saved).toBeTruthy()
    expect(saved[0][0]).toEqual({ id: 42, resubmissionAt: null, unchanged: false })
  })

  it('signals resubmission-saved (unchanged) instead of erroring when nothing changed', async () => {
    wrapper = await mountForm()
    mockMutate.mockRejectedValueOnce(new Error("the contribution wasn't changed at all"))
    await setReminder(IN_A_WEEK, '08:46')

    await submit()

    const saved = wrapper.emitted('resubmission-saved')
    expect(saved).toBeTruthy()
    expect(saved[0][0].id).toBe(42)
    expect(saved[0][0].unchanged).toBe(true)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('signals resubmission-saved (unchanged) with no date when the save is a no-op', async () => {
    // isRemovingResubmission keeps the save button active; the mutation then reports the
    // reminder was already gone (a no-op) instead of a real change.
    wrapper = await mountForm({ inputResubmissionDate: IN_A_WEEK.toString() })
    await reminderBox().setValue(false)
    mockMutate.mockRejectedValueOnce(new Error("the contribution wasn't changed at all"))

    await submit()

    const saved = wrapper.emitted('resubmission-saved')
    expect(saved).toBeTruthy()
    expect(saved[0][0]).toEqual({ id: 42, resubmissionAt: null, unchanged: true })
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('updates contribution memo', async () => {
    wrapper = await mountForm()
    await openTab(2)
    await memoField().setValue('changed memo')

    await submit()
    expect(mockMutate).toHaveBeenCalledWith({ resubmissionAt: null, memo: 'changed memo', id: 42 })
    expect(wrapper.emitted('update-contributions')).toEqual([[]])
  })

  it('warns about a memo past 512 characters and keeps the save closed', async () => {
    wrapper = await mountForm()
    await openTab(2)
    await memoField().setValue('x'.repeat(513))

    expect(wrapper.text()).toContain('crea.memoTooLong')
    expect(submitButton().attributes('disabled')).toBeDefined()
  })

  it('handles error when sending contribution message', async () => {
    const mockError = new Error('OUCH!')
    wrapper = await mountForm()

    mockMutate.mockRejectedValue(mockError)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockToastError).toHaveBeenCalledWith('OUCH!')
  })

  it('fills the empty message field with the Crea draft', async () => {
    useCreaClipboard().setLastResponse('Liebe Anna, danke!')
    wrapper = await mountForm()
    await wrapper.find('[data-test="crea-insert-draft"]').trigger('click')
    await nextTick()
    expect(messageField().element.value).toBe('Liebe Anna, danke!')
  })

  it('appends the Crea draft when the field already has text and was not focused', async () => {
    useCreaClipboard().setLastResponse('draft')
    wrapper = await mountForm()
    await messageField().setValue('typed')
    await wrapper.find('[data-test="crea-insert-draft"]').trigger('click')
    await nextTick()
    expect(messageField().element.value).toBe('typed\ndraft')
  })

  it('splices the Crea draft in at the caret of the field it was focused in', async () => {
    useCreaClipboard().setLastResponse('DRAFT')
    wrapper = await mountForm()
    await messageField().setValue('before after')
    await messageField().trigger('focus')
    messageField().element.setSelectionRange(7, 7)
    await wrapper.find('[data-test="crea-insert-draft"]').trigger('click')
    await flushPromises()
    expect(messageField().element.value).toBe('before DRAFTafter')
  })

  it('shows the Crea insert button only with a held draft and not on the memo tab', async () => {
    wrapper = await mountForm()
    const insert = () => wrapper.find('[data-test="crea-insert-draft"]')
    expect(insert().exists()).toBe(false)
    useCreaClipboard().setLastResponse('draft')
    await nextTick()
    expect(insert().exists()).toBe(true)
    await openTab(2)
    expect(insert().exists()).toBe(false)
  })

  it('appends the Crea supplement to the memo with the marker and switches to the memo tab (E-019)', async () => {
    useCreaSupplement().setLastSupplement('Genehmigt, da frei geteilte Impulse.')
    wrapper = await mountForm()
    await memoField().setValue('Impulse geschrieben')
    await wrapper.find('[data-test="crea-append-memo"]').trigger('click')
    await nextTick()
    // append-only: the original text is preserved untouched before the marker.
    expect(memoField().element.value).toBe(
      // The ALIAS, not the first name (NU-020): the memo travels into the booking.
      'Impulse geschrieben – 💬 berndh: Genehmigt, da frei geteilte Impulse.',
    )
    expect(tabs()[2].attributes('aria-selected')).toBe('true')
  })

  // A moderator whose stored login object predates the alias in verifyLogin. The marker
  // goes out WITHOUT a name rather than with the real one: this text lands in a booking
  // memo permanently, and the stored object is only refreshed at the next pass through
  // /authenticate, which an active moderator does not reach for hours.
  it('writes no name at all while the stored moderator has no alias yet', async () => {
    const current = storeState.moderator
    storeState.moderator = { firstName: 'Bernd' }
    try {
      useCreaSupplement().setLastSupplement('Genehmigt.')
      wrapper = await mountForm()
      await wrapper.find('[data-test="crea-append-memo"]').trigger('click')
      await nextTick()
      expect(memoField().element.value).toContain('💬 Genehmigt.')
      expect(memoField().element.value).not.toContain('Bernd')
    } finally {
      storeState.moderator = current
    }
  })

  it('shows the Crea append button only when a supplement is held', async () => {
    wrapper = await mountForm()
    const append = () => wrapper.find('[data-test="crea-append-memo"]')
    expect(append().exists()).toBe(false)
    useCreaSupplement().setLastSupplement('a note')
    await nextTick()
    expect(append().exists()).toBe(true)
  })

  // Twelve rows would push the save button out of a short phone window.
  it.each([
    ['mobile', '6'],
    ['desktop', '12'],
    ['unknown', '12'],
  ])('the text areas have six rows on a phone and twelve at the desk (%s)', async (side, rows) => {
    viewport.value = side
    wrapper = await mountForm()
    for (const index of [0, 1, 2]) {
      await openTab(index)
      expect(textareas().map((area) => area.attributes('rows'))).toContain(rows)
    }
    expect(wrapper.findAll('textarea').every((area) => area.attributes('rows') === rows)).toBe(true)
  })

  // The day and the time of a reminder stand side by side where there is room and one under
  // the other where there is not.
  it('lets the day and the time of a reminder wrap', async () => {
    wrapper = await mountForm()
    await reminderBox().setValue(true)
    const row = datepicker().element.parentElement
    expect(row.classList).toContain('flex-wrap')
    expect(row.classList).toContain('gap-2')
  })
})
