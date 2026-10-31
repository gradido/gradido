import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { ContentFooter } from './ContentFooter'

describe('ContentFooter', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(ContentFooter, {})
  })

  it('renders the footer', () => {
    expect(wrapper.find('.copyright').exists()).toBe(true)
  })

  it('links the copyright to gradido.net in the language shown', () => {
    expect(wrapper.find('a[href="https://gradido.net/en"]').exists()).toBe(true)
  })

  it('links the version to the commit it was built from', () => {
    expect(wrapper.find('a[href^="https://github.com/gradido/gradido/commit/"]').exists()).toBe(
      true,
    )
  })

  // Bernd, 31.10.2026: the name above, the version on a line of its own, at every width.
  it('stands the version on a line of its own, below the name', () => {
    const lines = wrapper.findAll('.copyright > div')
    expect(lines).toHaveLength(2)
    expect(lines[0].find('a[href^="https://gradido.net/"]').exists()).toBe(true)
    expect(lines[0].find('a[href^="https://github.com/"]').exists()).toBe(false)
    expect(lines[1].find('a[href^="https://github.com/gradido/gradido/commit/"]').exists()).toBe(
      true,
    )
  })

  it('keeps no stroke between the two', () => {
    expect(wrapper.find('.copyright').text()).not.toContain('|')
  })
})
