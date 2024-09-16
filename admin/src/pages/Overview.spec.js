import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import Overview from './Overview.vue'
import { adminListContributions } from '@/graphql/adminListContributions'
import { useQuery } from '@vue/apollo-composable'
import { createStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

vi.mock('@vue/apollo-composable')
vi.mock('@/composables/useToast')
vi.mock('vue-i18n')

const createVuexStore = () => {
  return createStore({
    state: {
      openCreations: 0,
    },
    mutations: {
      setOpenCreations(state, count) {
        state.openCreations = count
      },
    },
  })
}

describe('Overview', () => {
  let wrapper
  let store
  let mockResult
  let mockOnResult
  let mockOnError
  const mockToastError = vi.fn()
  const mockT = vi.fn((key) => key)

  beforeEach(() => {
    store = createVuexStore()
    mockResult = ref(null)
    mockOnResult = vi.fn()
    mockOnError = vi.fn()

    useQuery.mockReturnValue({
      result: mockResult,
      onResult: mockOnResult,
      onError: mockOnError,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
    })

    useI18n.mockReturnValue({
      t: mockT,
    })

    wrapper = mount(Overview, {
      global: {
        plugins: [store],
        stubs: {
          BCard: true,
          BCardText: true,
          BLink: true,
        },
      },
    })
  })

  const updateQueryResult = async (count) => {
    mockResult.value = { adminListContributions: { contributionCount: count } }
    await nextTick()
  }

  it('calls useQuery with correct parameters', () => {
    expect(useQuery).toHaveBeenCalledWith(adminListContributions, {
      statusFilter: ['IN_PROGRESS', 'PENDING'],
      hideResubmission: true,
    })
  })

  it('updates store when query result is received', async () => {
    const resultHandler = mockOnResult.mock.calls[0][0]
    resultHandler({ data: { adminListContributions: { contributionCount: 3 } } })
    await nextTick()
    expect(store.state.openCreations).toBe(3)
  })

  it('calls toastError when query encounters an error', () => {
    const errorHandler = mockOnError.mock.calls[0][0]
    errorHandler({ message: 'Test error' })
    expect(mockToastError).toHaveBeenCalledWith('Test error')
  })

  it('displays correct header and styling when there are open creations', async () => {
    await updateQueryResult(2)
    const card = wrapper.find('[data-test="open-creations-card"]')
    expect(card.attributes('header')).toBe('open_creations')
    expect(card.attributes('headerbgvariant')).toBe('success')
    expect(card.attributes('bordervariant')).toBe('success')
    expect(wrapper.vm.openCreations).toBe(2)
  })

  it('displays correct header and styling when there are no open creations', async () => {
    await updateQueryResult(0)
    const card = wrapper.find('[data-test="open-creations-card"]')
    expect(card.attributes('header')).toBe('not_open_creations')
    expect(card.attributes('headerbgvariant')).toBe('danger')
    expect(card.attributes('bordervariant')).toBe('primary')
    expect(wrapper.vm.openCreations).toBe(0)
  })

  it('reactively updates card based on query result changes', async () => {
    // Initial state: no open creations
    await updateQueryResult(0)
    expect(wrapper.find('[data-test="open-creations-card"]').attributes('header')).toBe(
      'not_open_creations',
    )

    // Update to having open creations
    await updateQueryResult(1)
    expect(wrapper.find('[data-test="open-creations-card"]').attributes('header')).toBe(
      'open_creations',
    )
  })

  it('translates headers correctly', async () => {
    await updateQueryResult(0)
    expect(mockT).toHaveBeenCalledWith('not_open_creations')

    await updateQueryResult(1)
    expect(mockT).toHaveBeenCalledWith('open_creations')
  })

  it('correct number of open creations', async () => {
    await updateQueryResult(5)
    expect(wrapper.vm.openCreations).toBe(5)

    await updateQueryResult(0)
    expect(wrapper.vm.openCreations).toBe(0)
  })
})
