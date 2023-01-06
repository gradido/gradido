import { mount } from '@vue/test-utils'
import GddAmount from './GddAmount'

const localVue = global.localVue

const state = {
  language: 'en',
}

const mocks = {
  $store: {
    state,
  },
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
}

const propsData = {
  path: 'string',
  balance: 123.45,
  badgeShow: false,
  showStatus: false,
}

describe('GddAmount', () => {
  let wrapper

  const Wrapper = () => {
    return mount(GddAmount, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component gdd-amount', () => {
      expect(wrapper.find('div.gdd-amount').exists()).toBe(true)
    })
  })
})
