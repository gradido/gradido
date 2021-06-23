import { mount } from '@vue/test-utils'
import GddSend from './GddSend'

const localVue = global.localVue

describe('GddSend', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $store: {
      state: {
        sessionId: 1234,
      },
    },
    $i18n: {
      locale: jest.fn(() => 'en'),
    },
    $n: jest.fn((n) => String(n)),
  }

  const Wrapper = () => {
    return mount(GddSend, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdd-send').exists()).toBeTruthy()
    })
  })
})
