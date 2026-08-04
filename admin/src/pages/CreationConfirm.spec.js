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

    // The group filter replaced the old "hide #hashtags" switch: it asks which group a
    // contribution belongs to, not whether its text happens to contain a '#'.
    wrapper.vm.creationGroup = '*untagged'
    await nextTick()

    expect(mockRefetch).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          creationGroup: '*untagged',
        }),
      }),
    )
  })

  it('offers all, all groups and no group before the real groups', () => {
    // The real groups follow behind; here the query is mocked away, so only the three
    // fixed entries remain -- which is exactly what this asserts.
    expect(wrapper.vm.creationGroupFilterOptions.map((option) => option.value)).toEqual([
      '',
      '*grouped',
      '*untagged',
    ])
  })

  // A scoped moderator may only work in their own groups, so the filter offers only those.
  // The backend enforces the boundary; this keeps the dropdown from offering choices that
  // would return nothing (no "all", no "no group", no group outside the scope).
  describe('group filter for a scoped moderator', () => {
    const GROUPS = [
      { tag: 'firefighter', name: 'Feuerwehr' },
      { tag: 'garden', name: 'Garten' },
      { tag: 'other', name: 'Andere' },
    ]

    const mountWithModerator = (moderator) => {
      const scopedStore = createStore({
        state: { openCreations: 0, moderator },
        mutations: {
          setOpenCreations(state, count) {
            state.openCreations = count
          },
          openCreationsMinus(state, count) {
            state.openCreations -= count
          },
        },
      })
      return mount(CreationConfirm, {
        global: {
          plugins: [scopedStore],
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
          mocks: { $t: mockT, $d: mockD },
        },
      })
    }

    beforeEach(() => {
      // Both queries share the mocked useQuery; this feeds the group list to the dropdown.
      mockResult.value = { creationGroups: GROUPS }
    })

    it('offers only "all my groups" and the moderator\'s own groups', () => {
      const scoped = mountWithModerator({
        roles: ['MODERATOR'],
        seesAllCreationGroups: false,
        visibleCreationGroups: ['firefighter', 'garden'],
      })
      expect(scoped.vm.creationGroupFilterOptions.map((option) => option.value)).toEqual([
        '*grouped',
        'firefighter',
        'garden',
      ])
    })

    it('defaults the selection to "all my groups"', () => {
      const scoped = mountWithModerator({
        roles: ['MODERATOR'],
        seesAllCreationGroups: false,
        visibleCreationGroups: ['firefighter', 'garden'],
      })
      expect(scoped.vm.creationGroup).toBe('*grouped')
    })

    // ⚠️ A session that predates the rename. The whole store is persisted to localStorage and
    // verifyLogin only runs again at /authenticate, so a moderator who was signed in when
    // this deploys still carries the OLD field names in their browser. Reading only the new
    // ones leaves both undefined, and `?? true` then promotes them to the administrator's
    // view: every group in the community offered, and the ones they do not moderate
    // answering with an empty table. This is the test that says the fallback has to stay
    // until no such session can exist any more.
    it('still respects a scope stored under the pre-rename field names', () => {
      const scoped = mountWithModerator({
        roles: ['MODERATOR'],
        seesAllGroups: false,
        visibleGroupTags: ['firefighter', 'garden'],
      })
      expect(scoped.vm.creationGroupFilterOptions.map((option) => option.value)).toEqual([
        '*grouped',
        'firefighter',
        'garden',
      ])
      expect(scoped.vm.creationGroup).toBe('*grouped')
    })

    it('offers only "no group" to a moderator scoped to untagged contributions', () => {
      const scoped = mountWithModerator({
        roles: ['MODERATOR'],
        seesAllCreationGroups: false,
        visibleCreationGroups: [],
      })
      expect(scoped.vm.creationGroupFilterOptions.map((option) => option.value)).toEqual([
        '*untagged',
      ])
      expect(scoped.vm.creationGroup).toBe('*untagged')
    })

    // "No group" is not a group, so it never appears in visibleCreationGroups. Deciding from that
    // list alone would leave this moderator with '*grouped' and their group -- and
    // '*grouped' is the exact complement of "no group", so the ungrouped contributions they
    // are assigned to would have no reachable filter at all.
    it('offers "no group" too when the scope covers the ungrouped contributions', () => {
      const scoped = mountWithModerator({
        roles: ['MODERATOR'],
        seesAllCreationGroups: false,
        seesUntagged: true,
        visibleCreationGroups: ['firefighter'],
      })
      expect(scoped.vm.creationGroupFilterOptions.map((option) => option.value)).toEqual([
        '*grouped',
        '*untagged',
        'firefighter',
      ])
    })

    it('leaves an administrator the full set', () => {
      const scoped = mountWithModerator({
        roles: ['ADMIN'],
        seesAllCreationGroups: true,
        visibleCreationGroups: [],
      })
      expect(scoped.vm.creationGroupFilterOptions.map((option) => option.value)).toEqual([
        '',
        '*grouped',
        '*untagged',
        'firefighter',
        'garden',
        'other',
      ])
    })
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
