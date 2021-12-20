import { mount } from '@vue/test-utils'
import ConfirmRegisterMailFormular from './ConfirmRegisterMailFormular.vue'

const localVue = global.localVue

const mocks = {
  $moment: jest.fn(() => {
    return {
      format: jest.fn((m) => m),
      subtract: jest.fn(() => {
        return {
          format: jest.fn((m) => m),
        }
      }),
    }
  }),
}

const propsData = {
  email: '',
  dateLastSend: '',
}

describe('ConfirmRegisterMailFormular', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ConfirmRegisterMailFormular, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-confirm-register-mail', () => {
      expect(wrapper.find('.component-confirm-register-mail').exists()).toBeTruthy()
    })
  })
})
