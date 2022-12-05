import { mount } from '@vue/test-utils'
import FirstName from './FirstName'

const localVue = global.localVue

describe('FirstName', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
  }

  const propsData = {
    balance: 0.0,
  }

  const Wrapper = () => {
    return mount(FirstName, {
      localVue,
      mocks,
      propsData,
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.first-name').exists()).toBe(true)
    })
  })
})
