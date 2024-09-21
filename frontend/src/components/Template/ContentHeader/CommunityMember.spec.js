import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CommunityMember from './CommunityMember'
import CONFIG from '@/config'

// Mock vue-i18n
const mockT = vi.fn((key) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}))

describe('CommunityMember', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(CommunityMember, {
      props: {
        totalUsers: 123,
        ...props,
      },
      global: {
        mocks: {
          $t: mockT,
          CONFIG,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  it('renders the component community-member', () => {
    expect(wrapper.find('div.community-member').exists()).toBe(true)
  })

  it('displays the correct number of total users', () => {
    expect(wrapper.text()).toContain('123')
  })

  it('displays the community name from CONFIG', () => {
    expect(wrapper.text()).toContain(CONFIG.COMMUNITY_NAME)
  })

  it('uses the correct translations', () => {
    expect(mockT).toHaveBeenCalledWith('member')
    expect(mockT).toHaveBeenCalledWith('community.communityMember')
  })

  it('updates when totalUsers prop changes', async () => {
    await wrapper.setProps({ totalUsers: 456 })
    expect(wrapper.text()).toContain('456')
  })
})
