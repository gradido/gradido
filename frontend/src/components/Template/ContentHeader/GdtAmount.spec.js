import { mount } from '@vue/test-utils'
import GdtAmount from './GdtAmount'

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
  $n: jest.fn((n) => n),
}

const propsData = {
  path: 'string',
  GdtBalance: 123.45,
  badgeShow: false,
  showStatus: false,
}

describe('GdtAmount', () => {
  let wrapper

  const Wrapper = () => {
    return mount(GdtAmount, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component gdt-amount', () => {
      expect(wrapper.find('div.gdt-amount').exists()).toBe(true)
    })
  })
})
