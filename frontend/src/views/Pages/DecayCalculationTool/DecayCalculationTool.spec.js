import { mount } from '@vue/test-utils'
import DecayCalculationTool from './DecayCalculationTool.vue'

const localVue = global.localVue

describe('Status', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return mount(DecayCalculationTool, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    describe('I can call the div', () => {
      it('I can call the class', () => {
        expect(wrapper.find('div.page_decaycalculator').exists()).toBeTruthy()
      })
    })
  })
})
