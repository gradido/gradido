import { mount } from '@vue/test-utils'
import ContentFooter from './ContentFooter'

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
  $i18n: {
    locale: jest.fn(() => 'en'),
  },
}

describe('ContentFooter', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContentFooter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".content-footer"', () => {
      expect(wrapper.find('div.content-footer').exists()).toBe(true)
    })
  })
})
