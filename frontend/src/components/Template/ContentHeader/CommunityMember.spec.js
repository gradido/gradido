import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CommunityMember from './CommunityMember'
import CONFIG from '@/config'
import { BBadge } from 'bootstrap-vue-next'

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

  it('displays the community name from CONFIG, as the heading of the tile', () => {
    expect(wrapper.find('[data-test="community-name"]').text()).toBe(CONFIG.COMMUNITY_NAME)
    expect(wrapper.find('[data-test="community-name"]').classes()).toContain('h4')
  })

  it('labels the tile as the community, not as a membership', () => {
    expect(wrapper.text()).toContain('community.community')
    expect(mockT).not.toHaveBeenCalledWith('member')
    expect(mockT).not.toHaveBeenCalledWith('community.communityMember')
  })

  it('says what the number counts: the members', () => {
    const count = wrapper.find('[data-test="community-member-count"]')
    expect(count.text()).toContain('123')
    expect(count.text()).toContain('community.members')
    expect(count.attributes('title')).toBe('community.members')
  })

  it('shows a dash while the count has not arrived, not a bare icon', () => {
    const count = createWrapper({ totalUsers: null }).find('[data-test="community-member-count"]')
    expect(count.text()).toContain('—')
    expect(count.text()).not.toContain('null')
  })

  it('keeps the white text of the gradient: the real badge carries no colour variant', () => {
    // `text-bg-secondary` (BBadge's default) sets black `!important` text and comes after
    // `.bg-gradido-gradient` in the stylesheet, so it wins over the gradient's white.
    const badge = mount(CommunityMember, {
      props: { totalUsers: 123 },
      global: { mocks: { $t: mockT, CONFIG }, components: { BBadge } },
    }).find('.badge')
    expect(badge.classes()).toContain('bg-gradido-gradient')
    expect(badge.classes().filter((c) => /^text-bg-.+/.test(c))).toEqual([])
  })

  it('updates when totalUsers prop changes', async () => {
    await wrapper.setProps({ totalUsers: 456 })
    expect(wrapper.text()).toContain('456')
  })
})
