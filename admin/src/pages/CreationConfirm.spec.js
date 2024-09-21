import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import CreationConfirm from './CreationConfirm.vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { createStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { BBadge, BPagination, BTab, BTabs } from 'bootstrap-vue-next'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

const createVuexStore = () => {
  return createStore({
    state: {
      openCreations: 0,
    },
    mutations: {
      setOpenCreations(state, count) {
        state.openCreations = count
      },
      openCreationsMinus(state, count) {
        state.openCreations -= count
      },
    },
  })
}

describe('CreationConfirm', () => {
  let wrapper
  let store
  let mockResult
  let mockRefetch
  let mockOnResultCallback
  const mockToastError = vi.fn()
  const mockToastSuccess = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date) => date.toISOString())

  beforeEach(() => {
    store = createVuexStore()
    vi.spyOn(store, 'commit')

    mockResult = ref(null)
    mockRefetch = vi.fn()
    mockOnResultCallback = null

    useQuery.mockReturnValue({
      onResult: (callback) => {
        mockOnResultCallback = callback
      },
      onError: vi.fn(),
      result: mockResult,
      refetch: mockRefetch,
    })

    useMutation.mockReturnValue({
      mutate: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    })

    useI18n.mockReturnValue({
      t: mockT,
      d: mockD,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
      toastSuccess: mockToastSuccess,
    })

    wrapper = mount(CreationConfirm, {
      global: {
        plugins: [store],
        stubs: {
          UserQuery: true,
          BButton: true,
          BTabs,
          BTab,
          BBadge,
          OpenCreationsTable: true,
          BPagination,
          Overlay: true,
          IBiBellFill: true,
          IBiCheck: true,
          IBiXCircle: true,
          IBiTrash: true,
          IBiList: true,
        },
        mocks: {
          $t: mockT,
          $d: mockD,
        },
      },
    })
  })

  const simulateQueryResult = async (data) => {
    mockResult.value = data
    if (mockOnResultCallback) {
      mockOnResultCallback({ data })
    }
    await nextTick()
  }

  it('initializes with correct default values', () => {
    expect(wrapper.vm.tabIndex).toBe(0)
    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.pageSize).toBe(25)
    expect(wrapper.vm.query).toBe('')
    expect(wrapper.vm.noHashtag).toBe(null)
    expect(wrapper.vm.hideResubmissionModel).toBe(true)
  })

  it('updates store and component state when open creations are fetched', async () => {
    const mockData = {
      adminListContributions: {
        contributionCount: 5,
        contributionList: Array(5)
          .fill({})
          .map((_, i) => ({ id: i + 1 })),
      },
    }

    await simulateQueryResult(mockData)

    expect(store.commit).toHaveBeenCalledWith('setOpenCreations', 5)
    expect(wrapper.vm.rows).toBe(5)
    expect(wrapper.vm.items).toEqual(mockData.adminListContributions.contributionList)
  })

  it('does not update store when not on the open tab', async () => {
    wrapper.vm.tabIndex = 1
    await nextTick()

    const mockData = {
      adminListContributions: {
        contributionCount: 10,
        contributionList: Array(10)
          .fill({})
          .map((_, i) => ({ id: i + 1 })),
      },
    }

    await simulateQueryResult(mockData)

    expect(store.commit).not.toHaveBeenCalledWith('setOpenCreations', 10)
    expect(wrapper.vm.rows).toBe(10)
    expect(wrapper.vm.items).toEqual(mockData.adminListContributions.contributionList)
  })

  it('refetches data when filters change', async () => {
    wrapper.vm.query = 'test query'
    await nextTick()

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'test query',
      }),
    )

    wrapper.vm.noHashtag = true
    await nextTick()

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        noHashtag: true,
      }),
    )
  })

  it('updates tabIndex and refetches when changing tabs', async () => {
    wrapper.vm.tabIndex = 2
    await nextTick()

    expect(wrapper.vm.currentPage).toBe(1)
    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 1,
        statusFilter: ['DENIED'],
      }),
    )
  })

  it('handles pagination changes', async () => {
    wrapper.vm.currentPage = 2
    await nextTick()

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 2,
      }),
    )
  })
})
