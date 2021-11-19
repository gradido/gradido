import { mount } from '@vue/test-utils'
import NavBar from './NavBar.vue'

const localVue = global.localVue

const mocks = {
  $store: {
    state: {
      openCreations: 1,
    },
  },
}

describe('NavBar', () => {
  let wrapper

  const Wrapper = () => {
    return mount(NavBar, { localVue, mocks })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a DIV element with the class.component-nabvar', () => {
      expect(wrapper.find('.component-nabvar').exists()).toBeTruthy()
    })
  })
})
