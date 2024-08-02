import { mount } from '@vue/test-utils'
import NotFoundPage from './NotFoundPage'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const mocks = {
  $t: vi.fn((t) => t),
}

describe('NotFoundPage', () => {
  let wrapper

  const Wrapper = () => {
    return mount(NotFoundPage, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a svg', () => {
      expect(wrapper.find('svg').exists()).toBeTruthy()
    })

    it('has a back button', () => {
      expect(wrapper.find('.test-back').exists()).toBeTruthy()
    })
  })
})
