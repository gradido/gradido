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

    it('have a DIV element with the class.componente-nabvar', () => {
      expect(wrapper.find('.componente-nabvar').exists()).toBeTruthy()
    })
  })
})
