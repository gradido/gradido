import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { listContributionLinks } from '@/graphql/listContributionLinks.js'
import { useAppToast } from '@/composables/useToast'
import ContributionLinks from '@/pages/ContributionLinks.vue'

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(),
}))

describe('ContributionLink', () => {
  let wrapper
  let mockResult
  let mockError
  let mockRefetch
  let mockToastError

  const mockData = {
    listContributionLinks: {
      links: [
        {
          id: 1,
          name: 'Meditation',
          memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
          amount: '200',
          validFrom: '2022-04-01',
          validTo: '2022-08-01',
          cycle: 'täglich',
          maxPerCycle: '3',
          maxAmountPerMonth: 0,
          link: 'https://localhost/redeem/CL-1a2345678',
        },
      ],
      count: 1,
    },
  }

  beforeEach(() => {
    mockResult = ref(null)
    mockError = ref(null)
    mockRefetch = vi.fn()
    mockToastError = vi.fn()

    vi.mocked(useQuery).mockReturnValue({
      result: mockResult,
      error: mockError,
      refetch: mockRefetch,
    })

    vi.mocked(useAppToast).mockReturnValue({
      toastError: mockToastError,
    })

    wrapper = mount(ContributionLinks, {
      global: {
        mocks: {
          $t: (key) => key,
          $d: (date) => date,
        },
        stubs: {
          ContributionLink: true,
        },
      },
    })
  })

  it('calls useQuery with listContributionLinks', () => {
    expect(useQuery).toHaveBeenCalledWith(listContributionLinks, null, {
      fetchPolicy: 'network-only',
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.contribution-link').exists()).toBe(true)
  })

  it('passes correct data to child component when query is successful', async () => {
    mockResult.value = mockData
    await wrapper.vm.$nextTick()
    const childComponent = wrapper.findComponent({ name: 'ContributionLink' })
    expect(childComponent.props('items')).toEqual(mockData.listContributionLinks.links)
    expect(childComponent.props('count')).toBe(mockData.listContributionLinks.count)
  })

  it('passes empty data to child component when query result is null', async () => {
    mockResult.value = null
    await wrapper.vm.$nextTick()
    const childComponent = wrapper.findComponent({ name: 'ContributionLink' })
    expect(childComponent.props('items')).toEqual([])
    expect(childComponent.props('count')).toBe(0)
  })

  it('calls toastError when there is an error', async () => {
    mockError.value = new Error('OUCH!')
    await wrapper.vm.$nextTick()
    expect(mockToastError).toHaveBeenCalledWith(
      'listContributionLinks has no result, use default data',
    )
  })

  it('calls refetch when get-contribution-links event is emitted', async () => {
    wrapper.findComponent({ name: 'ContributionLink' }).vm.$emit('get-contribution-links')
    await wrapper.vm.$nextTick()
    expect(mockRefetch).toHaveBeenCalled()
  })
})
