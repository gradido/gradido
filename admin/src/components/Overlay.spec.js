import { mount } from '@vue/test-utils'
import Overlay from './Overlay.vue'

const localVue = global.localVue

const propsData = {
  items: {},
}

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => String(d)),
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
