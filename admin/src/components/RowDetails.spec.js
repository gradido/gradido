// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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

  it('names the icon by the page it sits on', () => {
    expect(createWrapper().find('b-icon').attributes('icon')).toBe('x')
    expect(createWrapper({ type: 'UserSearch' }).find('b-icon').attributes('icon')).toBe(
      'eye-slash-fill',
    )
  })

  it('labels the button', () => {
    expect(createWrapper().find('button').text()).toBe('hide_details')
  })
})
