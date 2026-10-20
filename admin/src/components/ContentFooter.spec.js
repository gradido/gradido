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
})
