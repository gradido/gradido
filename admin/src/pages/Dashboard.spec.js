// AI-GENERATED — not an architecture reference

import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { useAdminStore } from '@/store/useAdminStore'
import { adminStore } from '../../test/adminStore'
import { Dashboard } from './Dashboard'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('vue-i18n')

// The router link, as far as the page uses it: where it goes, and its text.
const BLinkStub = {
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { 'data-to': props.to }, slots.default?.())
  },
}

describe('Dashboard', () => {
  let wrapper
  let store
  let creationsResult
  let onCreationsResult
  let onCreationsError
  const mockToastError = vi.fn()

  beforeEach(() => {
    vi.mocked(useQuery).mockClear()
    mockToastError.mockClear()
    store = adminStore({ openCreations: 0 })
    creationsResult = ref(null)
    onCreationsResult = vi.fn()
    onCreationsError = vi.fn()

    // Each query answers as itself: a page that asked the wrong one would get nothing.
    useQuery.mockImplementation((document) => {
      if (document === adminListContributionsCount) {
        return { result: creationsResult, onResult: onCreationsResult, onError: onCreationsError }
      }
      throw new Error('a query the page does not send')
    })
    useAppToast.mockReturnValue({ toastError: mockToastError })
    useI18n.mockReturnValue({
      t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
    })
    wrapper = mount(Dashboard, {
      global: {
        plugins: [store],
        stubs: { BLink: BLinkStub },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('welcomes whoever comes in', () => {
    expect(wrapper.find('h2').text()).toBe('dashboard.welcome')
  })

  // Every moderator opens this page every time. What takes the server seconds has a page of its
  // own, so a second query here is a decision to take, not a line to add.
  it('asks the server one question, for the open creations, each time anew', () => {
    expect(useQuery).toHaveBeenCalledTimes(1)
    expect(useQuery).toHaveBeenCalledWith(
      adminListContributionsCount,
      { filter: { statusFilter: ['IN_PROGRESS', 'PENDING'], hideResubmission: true } },
      { fetchPolicy: 'network-only' },
    )
  })

  it('passes the open creations on to the badge in the menu', () => {
    const [handler] = onCreationsResult.mock.calls[0]
    handler({ data: { adminListContributions: { contributionCount: 3 } } })
    expect(useAdminStore(store).openCreations).toBe(3)
  })

  it('says nothing about them before the answer is there', () => {
    expect(wrapper.find('[data-test="open-creations"]').exists()).toBe(false)
  })

  it('shows the open creations of today as a link to them', async () => {
    creationsResult.value = { adminListContributions: { contributionCount: 3 } }
    await nextTick()
    const link = wrapper.find('[data-test="open-creations"]')
    expect(link.text()).toBe('dashboard.today {"n":3}')
    expect(link.attributes('data-to')).toBe('/creation-confirm')
  })

  it('says "one" and "none" in words', async () => {
    creationsResult.value = { adminListContributions: { contributionCount: 1 } }
    await nextTick()
    expect(wrapper.find('[data-test="open-creations"]').text()).toBe('dashboard.todayOne')
    creationsResult.value = { adminListContributions: { contributionCount: 0 } }
    await nextTick()
    expect(wrapper.find('[data-test="open-creations"]').text()).toBe('dashboard.todayNone')
  })

  it('tells an error of the open creations', () => {
    onCreationsError.mock.calls[0][0]({ message: 'Test error' })
    expect(mockToastError).toHaveBeenCalledWith('Test error')
  })
})
