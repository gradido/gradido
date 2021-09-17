import { shallowMount } from '@vue/test-utils'
import UserProfileOverview from './UserProfileOverview'

const localVue = global.localVue

describe('UserProfileOverview', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
  }

  const Wrapper = () => {
    return shallowMount(UserProfileOverview, { localVue, mocks })
  }

  describe('shallow Mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('has a user card', () => {
      expect(wrapper.findComponent({ name: 'UserCard' }).exists()).toBeTruthy()
    })

    it('has a user first and last name form', () => {
      expect(wrapper.findComponent({ name: 'FormUserData' }).exists()).toBeTruthy()
    })

    it('has a user change password form', () => {
      expect(wrapper.findComponent({ name: 'FormUserPasswort' }).exists()).toBeTruthy()
    })

    it('has a user change language form', () => {
      expect(wrapper.findComponent({ name: 'FormUserLanguage' }).exists()).toBeTruthy()
    })
  })
})
