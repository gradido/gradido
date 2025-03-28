import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CreationTransactionList from './CreationTransactionList.vue'
import { useQuery } from '@vue/apollo-composable'
import { adminListContributionsShort } from '../graphql/adminListContributions.graphql'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

describe('CreationTransactionList', () => {
  let wrapper
  const mockResult = vi.fn()
  const mockRefetch = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date) => date.toISOString())
  const mockToastError = vi.fn()

  beforeEach(() => {
    useQuery.mockReturnValue({
      result: mockResult,
      refetch: mockRefetch,
    })

    useI18n.mockReturnValue({
      t: mockT,
      d: mockD,
    })

    useAppToast.mockReturnValue({
      toastError: mockToastError,
    })

    wrapper = mount(CreationTransactionList, {
      props: {
        userId: 1,
      },
      global: {
        stubs: {
          BTable: true,
          BPagination: true,
          BButton: true,
          BCollapse: true,
        },
        directives: {
          'b-toggle': {},
        },
      },
    })
  })

  it('renders the component', () => {
    expect(wrapper.find('.component-creation-transaction-list').exists()).toBe(true)
  })

  it('initializes with correct data', () => {
    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.perPage).toBe(10)
    expect(wrapper.vm.items).toEqual([])
    expect(wrapper.vm.rows).toBe(0)
  })

  it('calls useQuery with correct parameters', () => {
    expect(useQuery).toHaveBeenCalled()
    const call = useQuery.mock.calls[0]
    expect(call[0]).toBe(adminListContributionsShort)
    expect(call[1]).toEqual(
      expect.objectContaining({
        filter: {
          userId: 1,
        },
        paginated: {
          currentPage: expect.any(Number),
          pageSize: expect.any(Number),
          order: 'DESC',
        },
      }),
    )
  })

  it('refetches data when currentPage changes', async () => {
    wrapper.vm.currentPage = 2
    await wrapper.vm.$nextTick()
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('formats fields correctly', () => {
    const fields = wrapper.vm.fields
    expect(fields).toHaveLength(6)
    expect(fields[0].key).toBe('createdAt')
    expect(fields[1].key).toBe('contributionDate')
    expect(fields[2].key).toBe('confirmedAt')
    expect(fields[3].key).toBe('status')
    expect(fields[4].key).toBe('amount')
    expect(fields[5].key).toBe('memo')
  })

  it('formats amount correctly', () => {
    const amountField = wrapper.vm.fields.find((f) => f.key === 'amount')
    expect(amountField.formatter(100)).toBe('100 GDD')
  })
})
