import { mount } from '@vue/test-utils'
import ContentFooter from './ContentFooter'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const mocks = {
  $t: vi.fn((t) => t),
  $i18n: {
    locale: vi.fn(() => 'en'),
  },
}

describe('ContentFooter', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContentFooter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the div element ".content-footer"', () => {
      expect(wrapper.find('div.content-footer').exists()).toBe(true)
    })
  })
})
