import { mount } from '@vue/test-utils'
import NavBar from './NavBar.vue'

const localVue = global.localVue

const mocks = {
  $store: {
    state: {
<<<<<<< HEAD
      openCreations: 1,
=======
      openCreations: 0,
>>>>>>> ddaaab9c (add Tests, CreationFormular.spec.js, NavBar.spec.js, UserTable.spec.js)
    },
  },
}

describe('NavBar', () => {
  let wrapper

  const Wrapper = () => {
<<<<<<< HEAD
    return mount(NavBar, { localVue, mocks })
=======
    return mount(NavBar, { mocks, localVue })
>>>>>>> ddaaab9c (add Tests, CreationFormular.spec.js, NavBar.spec.js, UserTable.spec.js)
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
