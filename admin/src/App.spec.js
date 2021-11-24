import { shallowMount } from '@vue/test-utils'
import App from './App'

const localVue = global.localVue

const stubs = {
  RouterView: true,
}

describe('App', () => {
  let wrapper

  const Wrapper = () => {
    return shallowMount(App, { localVue, stubs })
  }

  describe('shallowMount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a div with id "app"', () => {
      expect(wrapper.find('div#app').exists()).toBeTruthy()
    })
  })
})
