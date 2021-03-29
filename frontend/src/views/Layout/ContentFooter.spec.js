import { mount } from '@vue/test-utils'

import ContentFooter from './ContentFooter'

const localVue = global.localVue

describe('ContentFooter', () => {
  let wrapper

  let mocks = {
    $i18n: {
      locale: () => 'en',
    },
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return mount(ContentFooter, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the content footer', () => {
      expect(wrapper.find('footer.footer')).toBeDefined()
    })
  })
})
