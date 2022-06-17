import { shallowMount } from '@vue/test-utils'
import Profile from './Profile'

const localVue = global.localVue

describe('Profile', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return shallowMount(Profile, { localVue, mocks })
  }

  describe('shallow Mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a user card', () => {
      expect(wrapper.findComponent({ name: 'UserCard' }).exists()).toBeTruthy()
    })

    it('has a user first and last name form', () => {
      expect(wrapper.findComponent({ name: 'UserData' }).exists()).toBeTruthy()
    })

    it('has a user change language form', () => {
      expect(wrapper.findComponent({ name: 'UserLanguage' }).exists()).toBeTruthy()
    })

    it('has a user change password form', () => {
      expect(wrapper.findComponent({ name: 'UserPassword' }).exists()).toBeTruthy()
    })

    it('has a user change newsletter form', () => {
      expect(wrapper.findComponent({ name: 'UserNewsletter' }).exists()).toBeTruthy()
    })
  })
})
