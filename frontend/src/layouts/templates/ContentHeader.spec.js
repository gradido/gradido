// AI-GENERATED — not an architecture reference

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ContentHeader from './ContentHeader'

// The layout fills one slot per section (#overview, #send, #transactions, #gdt, #settings).
// Naming a section the layout does not fill leaves the header empty -- which is exactly the
// fault below, so the test has to be able to see both.
const mountAt = (path) =>
  mount(ContentHeader, {
    global: { mocks: { $route: { path } } },
    slots: {
      overview: '<div data-test="head-overview">balance</div>',
      transactions: '<div data-test="head-transactions">balance</div>',
    },
  })

describe('ContentHeader', () => {
  it('fills the slot of the section the route names', () => {
    expect(mountAt('/overview').find('[data-test="head-overview"]').exists()).toBe(true)
    expect(mountAt('/transactions').find('[data-test="head-transactions"]').exists()).toBe(true)
  })

  it('takes a section from the first segment, whatever follows it', () => {
    expect(mountAt('/transactions/3').find('[data-test="head-transactions"]').exists()).toBe(true)
  })

  /**
   * ⛔ A trailing slash is a path a router really hands over -- `/overview/` matches the
   * `/overview` record. The line this component carried read the section as `overview/`,
   * no slot matched, and the balance row above the page came out empty. Found on the twin
   * of the file where coderabbit reported the same fault. (27.08.2026)
   */
  it('still finds the section when the path ends in a slash', () => {
    expect(mountAt('/overview/').find('[data-test="head-overview"]').exists()).toBe(true)
  })

  it('fills nothing where the path names no section', () => {
    expect(mountAt('/').find('[data-test="head-overview"]').exists()).toBe(false)
  })
})
