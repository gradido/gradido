import { mount } from '@vue/test-utils'
import FederationVisualize from './FederationVisualize'

const localVue = global.localVue

const mocks = {
  $t: (key) => key,
  $i18n: {
    locale: 'de',
    t: (key) => key,
  },
}

describe('Overview', () => {
  let wrapper

  const Wrapper = () => {
    return mount(FederationVisualize, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-confirm-register-mail', () => {
      expect(wrapper.find('div.federation-visualize').exists()).toBe(true)
    })
  })
})
