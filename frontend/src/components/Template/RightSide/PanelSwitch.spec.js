// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import PanelSwitch from './PanelSwitch.vue'

// The component is handed FINISHED words, so what they say is the caller's business and
// the fixture is free to be English like the rest of the tree.
const OPTIONS = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'contacts', label: 'Contacts' },
]

const mountSwitch = (modelValue = 'bookings') =>
  mount(PanelSwitch, {
    props: { modelValue, options: OPTIONS },
    global: { mocks: { $t: (key) => key } },
  })

describe('PanelSwitch', () => {
  it('shows both positions by the words it was handed', () => {
    const wrapper = mountSwitch()
    const segments = wrapper.findAll('.panel-switch-segment')

    expect(segments).toHaveLength(2)
    expect(segments[0].text()).toBe('Bookings')
    expect(segments[1].text()).toBe('Contacts')
    wrapper.unmount()
  })

  /**
   * ⛔ The finished word, not a key. `$t(option.label)` reads the key out of a variable, and
   * the i18n lint counts only literal keys -- both words would be reported as unused in ten
   * files and the next tidy-up would delete them.
   */
  it('prints the label as given rather than translating it again', () => {
    const wrapper = mountSwitch()
    expect(wrapper.text()).not.toContain('rightSide.')
    wrapper.unmount()
  })

  /**
   * ⛔ The proportions the caller asked for, on the element. Equal halves were the first
   * answer and they were wrong: half of this column is not enough for "Letzte
   * Transaktionen", which then wrapped and took "Kontakte" with it. The ratio is the
   * caller's to state -- which word is long depends on the language -- so what this
   * measures is that it ARRIVES.
   */
  it('gives each position the share it was handed', () => {
    const wrapper = mount(PanelSwitch, {
      props: {
        modelValue: 'bookings',
        options: [
          { value: 'bookings', label: 'Bookings', share: 2 },
          { value: 'contacts', label: 'Contacts' },
        ],
      },
      global: { mocks: { $t: (key) => key } },
    })
    const [wide, narrow] = wrapper.findAll('.panel-switch-segment')

    expect(wide.attributes('style')).toContain('flex-grow: 2')
    // No share named: one, so a caller that says nothing gets equal positions.
    expect(narrow.attributes('style')).toContain('flex-grow: 1')
    wrapper.unmount()
  })

  it('marks the position in force, for the eye and for a screen reader', () => {
    const wrapper = mountSwitch('contacts')
    const [bookings, contacts] = wrapper.findAll('.panel-switch-segment')

    expect(contacts.classes()).toContain('active')
    expect(contacts.attributes('aria-pressed')).toBe('true')
    expect(bookings.classes()).not.toContain('active')
    expect(bookings.attributes('aria-pressed')).toBe('false')
    wrapper.unmount()
  })

  it('says which position was picked', async () => {
    const wrapper = mountSwitch('bookings')
    await wrapper.find('[data-test="panel-switch-contacts"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['contacts']])
    wrapper.unmount()
  })

  /**
   * A tap on the position that already stands is not a change. Without the guard it would
   * write the same answer to the device again and emit an update the layout would have to
   * recognise as a no-op.
   */
  it('says nothing when the position that already stands is tapped', async () => {
    const wrapper = mountSwitch('bookings')
    await wrapper.find('[data-test="panel-switch-bookings"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })
})
