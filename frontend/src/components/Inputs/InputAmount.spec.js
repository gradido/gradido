import { mount } from '@vue/test-utils'
import InputAmount from './InputAmount'

const localVue = global.localVue

describe('InputAmount', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
  }

  const propsData = {
    name: '',
    label: '',
    placeholder: '',
    value: '',
  }

  const Wrapper = () => {
    return mount(InputAmount, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component input-amount', () => {
      expect(wrapper.find('div.input-amount').exists()).toBe(true)
    })
  })
})
