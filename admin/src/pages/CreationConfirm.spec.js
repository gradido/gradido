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
  let mockMutate
  const mockToastError = vi.fn()
  const mockToastSuccess = vi.fn()
  const mockToastWarning = vi.fn()
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

    mockMutate = vi.fn().mockResolvedValue({})
    useMutation.mockReturnValue({
      mutate: mockMutate,
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
      toastWarning: mockToastWarning,
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
        filter: expect.objectContaining({
          query: 'test query',
        }),
      }),
    )

    wrapper.vm.noHashtag = true
    await nextTick()

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          noHashtag: true,
        }),
      }),
    )
  })

  it('updates tabIndex and refetches when changing tabs', async () => {
    wrapper.vm.tabIndex = 2
    await nextTick()

    expect(wrapper.vm.currentPage).toBe(1)
    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        paginated: expect.objectContaining({
          currentPage: 1,
        }),
        filter: expect.objectContaining({
          statusFilter: ['DENIED'],
        }),
      }),
    )
  })

  it('handles pagination changes', async () => {
    wrapper.vm.currentPage = 2
    await nextTick()

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        paginated: expect.objectContaining({
          currentPage: 2,
        }),
      }),
    )
  })

  const openItems = (count, userId) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      userId,
      contributionStatus: 'IN_PROGRESS',
      user: { firstName: 'Anna', lastName: 'Muster' },
    }))

  it('excludes the just-saved contribution from the bulk resubmission loop', async () => {
    await simulateQueryResult({
      adminListContributions: { contributionCount: 3, contributionList: openItems(3, 7) },
    })

    wrapper.vm.onResubmissionSaved({ id: 1, resubmissionAt: '2026-08-01T08:46:00' })
    expect(wrapper.vm.bulkResubmission.show).toBe(true)

    mockMutate.mockClear()
    await wrapper.vm.applyBulkResubmission()

    const ids = mockMutate.mock.calls.map((call) => call[0].id)
    expect(ids).toEqual([2, 3])
    expect(mockToastSuccess).toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('does not offer bulk resubmission for a mixed participant list', async () => {
    await simulateQueryResult({
      adminListContributions: {
        contributionCount: 2,
        contributionList: [...openItems(1, 7), { ...openItems(1, 8)[0], id: 2 }],
      },
    })

    wrapper.vm.onResubmissionSaved({ id: 1, resubmissionAt: '2026-08-01T08:46:00' })
    expect(wrapper.vm.bulkResubmission.show).toBe(false)
  })

  it('shows a neutral notice when an unchanged save has no group to propagate to', async () => {
    await simulateQueryResult({
      adminListContributions: { contributionCount: 1, contributionList: openItems(1, 7) },
    })

    wrapper.vm.onResubmissionSaved({
      id: 1,
      resubmissionAt: '2026-08-01T08:46:00',
      unchanged: true,
    })

    expect(wrapper.vm.bulkResubmission.show).toBe(false)
    expect(mockToastWarning).toHaveBeenCalled()
  })

  it('shows a neutral notice for a no-reminder no-op even within a group', async () => {
    await simulateQueryResult({
      adminListContributions: { contributionCount: 3, contributionList: openItems(3, 7) },
    })

    wrapper.vm.onResubmissionSaved({ id: 1, resubmissionAt: null, unchanged: true })

    expect(wrapper.vm.bulkResubmission.show).toBe(false)
    expect(mockToastWarning).toHaveBeenCalled()
  })
})
