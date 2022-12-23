import { mount } from '@vue/test-utils'
import CommunityMember from './CommunityMember'

const localVue = global.localVue

const mocks = {
  $i18n: {
    locale: 'en',
  },
  $t: jest.fn((t) => t),
}

const propsData = {
  totalUsers: 123,
}

describe('CommunityMember', () => {
  let wrapper

  const Wrapper = () => {
    return mount(CommunityMember, { localVue, mocks, propsData })
  }
  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the component community-member', () => {
      expect(wrapper.find('div.community-member').exists()).toBe(true)
    })
  })
})
