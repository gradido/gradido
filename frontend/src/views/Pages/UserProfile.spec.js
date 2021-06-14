import { shallowMount } from '@vue/test-utils'

import UserProfile from './UserProfile'

const localVue = global.localVue

describe('UserProfile', () => {
  let wrapper

  const Wrapper = () => {
    return shallowMount(UserProfile, { localVue })
  }

  describe('shallowMount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component', () => {
      expect(wrapper.findComponent({ name: 'user-card' }).exists()).toBeTruthy()
    })
  })
})
