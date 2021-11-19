import { mount } from '@vue/test-utils'
import CreationFormular from './CreationFormular.vue'

const localVue = global.localVue

const mocks = { $moment: jest.fn() }

describe('CreationFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CreationFormular, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-creation-formular', () => {
      expect(wrapper.find('.component-creation-formular').exists()).toBeTruthy()
    })
  })
})
