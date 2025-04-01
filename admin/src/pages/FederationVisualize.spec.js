import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import FederationVisualize from './FederationVisualize.vue'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { BButton, BListGroup, BRow, BCol, BListGroupItem } from 'bootstrap-vue-next'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')

describe('FederationVisualize', () => {
  let wrapper
  let mockResult
  let mockLoading
  let mockRefetch
  let mockError
  const mockToastError = vi.fn()

  beforeEach(() => {
    mockResult = ref(null)
    mockLoading = ref(false)
    mockRefetch = vi.fn()
    mockError = ref(null)

    useQuery.mockReturnValue({
      result: mockResult,
      loading: mockLoading,
      refetch: mockRefetch,
      error: mockError,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
    })

    wrapper = mount(FederationVisualize, {
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BButton,
          BListGroup,
          BRow,
          BCol,
          BListGroupItem,
          IBiArrowClockwise: true,
          'community-visualize-item': true,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.federation-visualize').exists()).toBe(true)
  })

  it('displays the correct header', () => {
    expect(wrapper.find('.h2').text()).toBe('federation.gradidoInstances')
  })

  it('renders the refresh button', () => {
    const refreshButton = wrapper.find('[data-test="federation-communities-refresh-btn"]')
    expect(refreshButton.exists()).toBe(true)
  })

  it('calls refetch when refresh button is clicked', async () => {
    const refreshButton = wrapper.find('[data-test="federation-communities-refresh-btn"]')
    await refreshButton.trigger('click')
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('displays communities when data is loaded', async () => {
    const mockCommunities = [
      { publicKey: '1', foreign: true },
      { publicKey: '2', foreign: false },
    ]
    mockResult.value = { allCommunities: mockCommunities }
    await nextTick()

    const listItems = wrapper.findAllComponents({ name: 'BListGroupItem' })
    expect(listItems).toHaveLength(2)

    expect(listItems[0].props('variant')).toBe('warning')
    expect(listItems[1].props('variant')).toBe('primary')
  })

  it('shows loading animation when fetching data', async () => {
    mockLoading.value = true
    await nextTick()
    const refreshButton = wrapper.find('[data-test="federation-communities-refresh-btn"]')
    expect(refreshButton.attributes('animation')).toBe('spin')
  })

  it('displays error toast when query fails', async () => {
    mockError.value = new Error('Test error')
    await nextTick()
    expect(mockToastError).toHaveBeenCalledWith('Test error')
  })

  it('renders correct column headers', () => {
    const columns = wrapper.findAll('.list-group > .row > div')
    expect(columns[0].text()).toBe('federation.verified')
    expect(columns[1].text()).toBe('federation.url')
    expect(columns[2].text()).toBe('federation.name')
    expect(columns[3].text()).toBe('federation.lastAnnouncedAt')
    expect(columns[4].text()).toBe('federation.createdAt')
  })
})
