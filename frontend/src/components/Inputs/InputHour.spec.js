import { mount } from '@vue/test-utils'
import InputHour from './InputHour'

const localVue = global.localVue

describe('InputHour', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
    $route: {
      params: {},
    },
  }

  describe('mount in a InputHour', () => {
    const propsData = {
      rules: {},
      name: '',
      label: '',
      placeholder: '',
      value: 500,
      validMaxTime: 25,
    }

    const Wrapper = () => {
      return mount(InputHour, {
        localVue,
        mocks,
        propsData,
      })
    }

    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component input-hour', () => {
      expect(wrapper.find('div.input-hour').exists()).toBe(true)
    })
  })
})
