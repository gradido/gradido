// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { createBootstrap } from 'bootstrap-vue-next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useI18n } from 'vue-i18n'
import { DecisionModal } from './DecisionModal'

vi.mock('vue-i18n')

describe('DecisionModal', () => {
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date, format) => {
    if (format === 'month') {
      return 'January'
    }
    if (format === 'year') {
      return '2023'
    }
    return date.toISOString()
  })
  let wrapper

  const mockItem = {
    amount: '100',
    contributionDate: '2023-01-15T00:00:00.000Z',
    memo: 'Test memo',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      emailContact: {
        email: 'john.doe@example.com',
      },
    },
  }

  // The REAL modal, drawn in place instead of at the end of the page: what is measured here
  // are the classes and the order bootstrap-vue-next makes of the props and slots, which a
  // stub would answer to whatever was written into it.
  const mountModal = (props = {}) => {
    const modal = mount(DecisionModal, {
      props: { modelValue: true, item: mockItem, ...props },
      // No focus trap: jsdom lays nothing out, so the trap finds nothing to focus and throws a
      // few frames after a test has ended -- into whichever test runs then.
      attrs: { teleportDisabled: true, noTrap: true },
      slots: {
        title: '<div>Test Title</div>',
        text: '<p>Test Text</p>',
        question: '<p>Test Question?</p>',
        'submit-btn': '<button class="submit-stub">Submit</button>',
      },
      global: { plugins: [createBootstrap()] },
    })
    mounted.push(modal)
    return modal
  }

  const mounted = []

  beforeEach(() => {
    useI18n.mockReturnValue({ t: mockT, d: mockD })
    wrapper = mountModal()
  })

  afterEach(() => {
    for (const modal of mounted.splice(0)) {
      modal.unmount()
    }
  })

  it('is a centred, scrollable modal', () => {
    const dialog = wrapper.find('.modal-dialog')
    expect(dialog.exists()).toBe(true)
    expect(dialog.classes()).toContain('modal-dialog-centered')
    expect(dialog.classes()).toContain('modal-dialog-scrollable')
  })

  it('shows amount, month, text, name and address', () => {
    const body = wrapper.find('.modal-body')
    expect(body.text()).toContain('100 GDD')
    expect(body.text()).toContain('January 2023')
    expect(body.text()).toContain('Test memo')
    expect(body.text()).toContain('John Doe')
    expect(body.text()).toContain('john.doe@example.com')
    expect(body.html()).toContain('<p>Test Text</p>')
    expect(body.html()).toContain('<p>Test Question?</p>')
    expect(wrapper.find('.modal-title').text()).toBe('Test Title')
  })

  it('cancel tells the page', async () => {
    const cancel = wrapper
      .findAll('.modal-footer button')
      .find((b) => b.text() === 'overlay.cancel')
    await cancel.trigger('click')
    expect(wrapper.emitted('overlay-cancel')).toHaveLength(1)
  })

  // The decision first: on a phone it stands above the way back (column), at the desk to the
  // right of it (row-reverse from sm on).
  it('the submit slot stands first in the footer', () => {
    const footer = wrapper.find('.modal-footer')
    const buttons = footer.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['Submit', 'overlay.cancel'])
    expect(footer.find('.flex-column.flex-sm-row-reverse').exists()).toBe(true)
  })

  // The × closes it through the v-model, as Escape and the backdrop do: the page hears that it
  // is closed, and nothing else.
  it('says it was closed when its × is pressed', async () => {
    await wrapper.find('.modal-header .btn-close').trigger('click')
    // bootstrap-vue-next lets go of the v-model in a timeout of its own.
    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')).toEqual([[false]]))
    expect(wrapper.emitted('overlay-cancel')).toBeUndefined()
  })

  // The dialog is drawn before any contribution was chosen, with the empty item the page holds
  // until then. An invalid date must not reach the formatter, which throws on it.
  it('draws nothing broken before a contribution was chosen', () => {
    mockD.mockClear()
    const empty = mountModal({ modelValue: false, item: {} })
    expect(empty.find('.modal-body').text()).not.toContain('Invalid')
    expect(mockD).not.toHaveBeenCalled()
  })
})
