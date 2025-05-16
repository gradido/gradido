import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import TransactionLinkList from './TransactionLinkList.vue'
import { useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { BPagination, BTable } from 'bootstrap-vue-next'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

const mockLinks = [
  {
    amount: '19.99',
    code: '62ef8236ace7217fbd066c5a',
    createdAt: '2022-03-24T17:43:09.000Z',
    deletedAt: null,
    holdAvailableAmount: '20.51411720068412022949',
    id: 36,
    memo: 'Kein Trick, keine Zauberrei,\nbei Gradidio sei dabei!',
    redeemedAt: null,
    validUntil: '2022-04-07T17:43:09.000Z',
  },
  {
    amount: '19.99',
    code: '2b603f36521c617fbd066cef',
    createdAt: '2022-03-24T17:43:09.000Z',
    deletedAt: null,
    holdAvailableAmount: '20.51411720068412022949',
    id: 37,
    memo: 'Kein Trick, keine Zauberrei,\nbei Gradidio sei dabei!',
    redeemedAt: '2022-04-07T14:43:09.000Z',
    validUntil: '2022-04-07T17:43:09.000Z',
  },
  {
    amount: '19.99',
    code: '0bb789b5bd5b717fbd066eb5',
    createdAt: '2022-03-24T17:43:09.000Z',
    deletedAt: '2022-03-24T17:43:09.000Z',
    holdAvailableAmount: '20.51411720068412022949',
    id: 40,
    memo: 'Da habe ich mich wohl etwas übernommen.',
    redeemedAt: '2022-04-07T14:43:09.000Z',
    validUntil: '2022-04-07T17:43:09.000Z',
  },
  {
    amount: '19.99',
    code: '2d4a763e516b317fbd066a85',
    createdAt: '2022-01-01T00:00:00.000Z',
    deletedAt: null,
    holdAvailableAmount: '20.51411720068412022949',
    id: 33,
    memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
    redeemedAt: null,
    validUntil: '2022-01-15T00:00:00.000Z',
  },
]

describe('TransactionLinkList', () => {
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date) => new Date(date).toISOString())
  const mockToastError = vi.fn()
  let wrapper
  let mockResult
  let mockError
  let mockRefetch

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2022-04-01T00:00:00.000Z'))

    useI18n.mockReturnValue({ t: mockT, d: mockD })
    useAppToast.mockReturnValue({ toastError: mockToastError })

    mockResult = ref(null)
    mockError = ref(null)
    mockRefetch = vi.fn()

    useQuery.mockReturnValue({
      result: mockResult,
      error: mockError,
      refetch: mockRefetch,
    })

    wrapper = mount(TransactionLinkList, {
      props: {
        userId: 123,
      },
      global: {
        stubs: {
          BTable,
          BPagination,
        },
      },
    })
  })

  it('renders the component with mock data', async () => {
    mockResult.value = {
      listTransactionLinksAdmin: {
        count: mockLinks.length,
        links: mockLinks,
      },
    }
    await nextTick()
    expect(wrapper.find('.transaction-link-list').exists()).toBe(true)
    expect(wrapper.vm.items).toHaveLength(4)
    expect(wrapper.vm.rows).toBe(4)
  })

  it('formats amount correctly', () => {
    const amountField = wrapper.vm.fields.find((f) => f.key === 'amount')
    expect(amountField.formatter('19.99')).toBe('19.99 GDD')
  })

  it('formats status correctly for different scenarios', () => {
    const statusField = wrapper.vm.fields.find((f) => f.key === 'contributionStatus')

    // Open transaction
    expect(statusField.formatter(null, null, mockLinks[0])).toBe('open')

    // Deleted transaction
    expect(statusField.formatter(null, null, mockLinks[2])).toContain('deleted')
    expect(statusField.formatter(null, null, mockLinks[2])).toContain('2022-03-24T17:43:09.000Z')

    // Redeemed transaction
    expect(statusField.formatter(null, null, mockLinks[1])).toContain('redeemed')
    expect(statusField.formatter(null, null, mockLinks[1])).toContain('2022-04-07T14:43:09.000Z')

    // Expired transaction
    expect(statusField.formatter(null, null, mockLinks[3])).toContain('expired')
    expect(statusField.formatter(null, null, mockLinks[3])).toContain('2022-01-15T00:00:00.000Z')
  })

  it('displays correct memo', () => {
    const memoField = wrapper.vm.fields.find((f) => f.key === 'memo')
    expect(memoField.label).toBe('transactionlist.memo')
    expect(memoField.class).toBe('text-break')
  })

  it('formats dates correctly', () => {
    const createdAtField = wrapper.vm.fields.find((f) => f.key === 'createdAt')
    const validUntilField = wrapper.vm.fields.find((f) => f.key === 'validUntil')

    expect(createdAtField.formatter('2022-03-24T17:43:09.000Z')).toBe('2022-03-24T17:43:09.000Z')
    expect(validUntilField.formatter('2022-04-07T17:43:09.000Z')).toBe('2022-04-07T17:43:09.000Z')
  })

  it('refetches data when currentPage changes', async () => {
    wrapper.vm.currentPage = 2
    await nextTick()
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('refetches data when perPage changes', async () => {
    wrapper.vm.perPage = 10
    await nextTick()
    expect(mockRefetch).toHaveBeenCalled()
  })
})
