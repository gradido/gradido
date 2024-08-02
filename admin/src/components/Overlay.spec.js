import { mount } from '@vue/test-utils'
import Overlay from './Overlay'
import { vi, describe, beforeEach, it, expect } from 'vitest'

const localVue = global.localVue

const propsData = {
  item: {},
}

const mocks = {
  $t: vi.fn((t) => t),
  $d: vi.fn((d) => String(d)),
}

describe('Overlay', () => {
  let wrapper

  const Wrapper = () => {
    return mount(Overlay, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-overlay', () => {
      expect(wrapper.find('.component-overlay').exists()).toBeTruthy()
    })
  })
})
