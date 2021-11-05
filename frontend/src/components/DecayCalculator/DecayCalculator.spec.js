import { mount } from '@vue/test-utils'
import DecayCalculator from './DecayCalculator.vue'

const localVue = global.localVue

describe('Status', () => {
  let wrapper

  const mocks = {
    $n: jest.fn((n) => n),
  }

  const Wrapper = () => {
    return mount(DecayCalculator, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    describe('balance is pending', () => {
      it('it displays an en-dash', () => {
        expect(wrapper.find('div#decay_calculator').exists()).toBeTruthy()
      })
    })
  })
})
