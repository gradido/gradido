import { mount } from '@vue/test-utils'

import CloseButton from './CloseButton'

const localVue = global.localVue

describe('CloseButton', () => {

  let wrapper
  let propsData = {
    target: ["Target", 0],
    expanded: false,
  }

  const Wrapper = () => {
    return mount(CloseButton, { localVue, propsData })
  }

  describe('mount', () => {

    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('emmits click event', () => {
      console.log(wrapper.html())
      wrapper.find('.navbar-toggler').trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
    })
    
  })
  
})
