import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CommunityStatistic from './CommunityStatistic.vue'
import StatisticTable from '../components/Tables/StatisticTable.vue'
import { useAppToast } from '@/composables/useToast'
import { useQuery } from '@vue/apollo-composable'

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(),
}))

const defaultData = {
  communityStatistics: {
    totalUsers: 3113,
    deletedUsers: 35,
    totalGradidoCreated: '4083774.05000000000000000000',
    totalGradidoDecayed: '-1062639.13634129622923372197',
    dynamicStatisticsFields: {
      activeUsers: 1057,
      totalGradidoAvailable: '2513565.869444365732411569',
      totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
    },
  },
}

describe('CommunityStatistic', () => {
  let wrapper
  let mockResult
  let mockError
  let mockLoading
  let mockToastError

  beforeEach(() => {
    mockResult = ref(null)
    mockError = ref(null)
    mockLoading = ref(false)
    mockToastError = vi.fn()

    vi.mocked(useQuery).mockReturnValue({
      result: mockResult,
      loading: mockLoading,
      error: mockError,
    })

    vi.mocked(useAppToast).mockReturnValue({
      toastError: mockToastError,
    })

    wrapper = mount(CommunityStatistic, {
      global: {
        mocks: {
          $t: (key) => key,
          $n: (number) => number.toString(),
        },
        stubs: {
          StatisticTable: true,
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.community-statistic').exists()).toBe(true)
  })

  it('renders StatisticTable when not loading', async () => {
    mockLoading.value = false
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(StatisticTable).exists()).toBe(true)
  })

  it('does not render StatisticTable when loading', async () => {
    mockLoading.value = true
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(StatisticTable).exists()).toBe(false)
  })

  it('calls toastError when there is an error', async () => {
    mockError.value = new Error('Ouch!')
    await wrapper.vm.$nextTick()
    expect(mockToastError).toHaveBeenCalledWith('Ouch!')
  })

  it('updates statistics when result is available', async () => {
    mockResult.value = defaultData
    await wrapper.vm.$nextTick()
    const statisticTable = wrapper.findComponent(StatisticTable)
    expect(statisticTable.props('statistics')).toEqual({
      totalUsers: 3113,
      deletedUsers: 35,
      totalGradidoCreated: '4083774.05000000000000000000',
      totalGradidoDecayed: '-1062639.13634129622923372197',
      activeUsers: 1057,
      totalGradidoAvailable: '2513565.869444365732411569',
      totalGradidoUnbookedDecayed: '-500474.6738366222166261272',
    })
  })
})
