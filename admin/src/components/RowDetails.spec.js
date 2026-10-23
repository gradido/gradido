// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IBiEyeSlashFill from '~icons/bi/eye-slash-fill'
import IBiX from '~icons/bi/x'
import { RowDetails } from './RowDetails'

const row = { item: { id: 7 } }

describe('RowDetails', () => {
  const createWrapper = (props = {}) =>
    mount(RowDetails, {
      props: { row, slotName: 'details', type: 'PageCreationConfirm', index: 3, ...props },
      slots: { details: '<div class="test-details">details</div>' },
    })

  it('shows the slot it is named for', () => {
    expect(createWrapper().find('.test-details').text()).toBe('details')
  })

  it('hands row and index back when the details are hidden', async () => {
    const wrapper = createWrapper()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('row-toggle-details')).toEqual([[row, 3]])
  })

  // The <b-icon> it carried before drew nothing: bootstrap-vue-next has no such component, so
  // the button showed its word and an empty unknown element.
  it('the hide button carries an icon', () => {
    const button = createWrapper().find('button')
    expect(button.find('svg').exists()).toBe(true)
    expect(button.find('b-icon').exists()).toBe(false)
  })

  it('shows a cross on the confirmation page and a closed eye everywhere else', () => {
    expect(createWrapper().findComponent(IBiX).exists()).toBe(true)
    expect(createWrapper().findComponent(IBiEyeSlashFill).exists()).toBe(false)
    const elsewhere = createWrapper({ type: 'show-creation' })
    expect(elsewhere.findComponent(IBiEyeSlashFill).exists()).toBe(true)
    expect(elsewhere.findComponent(IBiX).exists()).toBe(false)
  })

  // Its surface comes from Bootstrap's card, which a dark mode can turn; a fixed white would not.
  it('leaves the surface of the card to Bootstrap', () => {
    expect(createWrapper().find('.card').classes()).not.toContain('bg-white')
  })

  it('labels the button', () => {
    expect(createWrapper().find('button').text()).toBe('hide_details')
  })
})
