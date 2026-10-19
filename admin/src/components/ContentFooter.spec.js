import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import ContentFooter from './ContentFooter.vue'

describe('ContentFooter', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(ContentFooter, {})
  })

  it('renders the footer', () => {
    expect(wrapper.find('.content-footer').exists()).toBe(true)
  })
})
