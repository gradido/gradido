// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { RowDetails } from './RowDetails'

describe('RowDetails', () => {
  const createWrapper = () =>
    mount(RowDetails, {
      props: { slotName: 'details' },
      slots: { details: '<div class="test-details">details</div>' },
    })

  it('shows the slot it is named for', () => {
    expect(createWrapper().find('.test-details').text()).toBe('details')
  })

  // Bernd, 24.10.2026: the details button of the row closes the row, its arrow turned up while
  // it is open, so the card's own "hide details" at its end went. Below the message stand only
  // "cancel" and "save".
  it('has no button of its own', () => {
    expect(createWrapper().find('button').exists()).toBe(false)
    expect(createWrapper().text()).not.toContain('hide_details')
  })

  // Its surface comes from Bootstrap's card, which a dark mode can turn; a fixed white would not.
  it('leaves the surface of the card to Bootstrap', () => {
    expect(createWrapper().find('.card').classes()).not.toContain('bg-white')
  })

  // The phone rules of the contributions table reach the card by this name (OpenCreationsTable.css).
  it('names its card for the phone rules', () => {
    expect(createWrapper().find('.card').classes()).toContain('row-details-card')
  })
})
