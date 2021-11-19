import { mount } from '@vue/test-utils'
import NavBar from './NavBar.vue'

const localVue = global.localVue

describe('NavBar', () => {
  let wrapper

  const Wrapper = () => {
    return mount(NavBar, { localVue })
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
