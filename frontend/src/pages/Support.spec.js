// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { BTab, BTabs } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { Support } from './Support'

const mockRoute = reactive({ params: { tab: 'write' } })
const mockReplace = vi.fn()
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/components/Contributions/NavContributions', () => ({
  NavContributions: { name: 'NavContributions', props: ['tabs', 'routeBase'], template: '<nav />' },
}))
vi.mock('@/components/Support/SupportForm', () => ({
  SupportForm: { name: 'SupportForm', emits: ['sent'], template: '<form />' },
}))
vi.mock('@/components/Support/SupportTicketList', () => ({
  SupportTicketList: { name: 'SupportTicketList', template: '<ul />' },
}))
vi.mock('@/pages/InfoStatistic', () => ({
  InfoStatistic: { name: 'InfoStatistic', template: '<div class="info" />' },
}))

const mountAt = (tab) => {
  mockRoute.params.tab = tab
  return mount(Support, { global: { components: { BTab, BTabs } } })
}

describe('Support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has the three tabs: write, my requests, information', () => {
    const nav = mountAt('write').findComponent({ name: 'NavContributions' })
    expect(nav.props('routeBase')).toBe('/support/')
    expect(nav.props('tabs').map((tab) => [tab.route, tab.label])).toEqual([
      ['write', 'support.write'],
      ['my-requests', 'support.myRequests'],
      ['information', 'info'],
    ])
  })

  it.each([
    ['write', 0],
    ['my-requests', 1],
    ['information', 2],
  ])('opens the tab of the route %s', (tab, index) => {
    expect(mountAt(tab).vm.tabIndex).toBe(index)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('leads an unknown tab to writing', () => {
    expect(mountAt('elsewhere').vm.tabIndex).toBe(0)
    expect(mockReplace).toHaveBeenCalledWith({ path: '/support/write' })
  })

  it('shows the member own requests once a request is sent', async () => {
    const wrapper = mountAt('write')
    await flushPromises()
    await wrapper.findComponent({ name: 'SupportForm' }).vm.$emit('sent')
    expect(mockPush).toHaveBeenCalledWith({ path: '/support/my-requests' })
  })

  it('shows what the page "Information" shows under the third tab', async () => {
    const wrapper = mountAt('information')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'InfoStatistic' }).exists()).toBe(true)
  })
})
