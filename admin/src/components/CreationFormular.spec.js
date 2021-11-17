import { mount } from '@vue/test-utils'
import CreationFormular from './CreationFormular.vue'

const localVue = global.localVue

describe('CreationFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationFormular, { localVue })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('have a DIV element with the class.componente-creation-formular', () => {
      expect(wrapper.find('.componente-creation-formular').exists()).toBeTruthy()
    })
  })
})
