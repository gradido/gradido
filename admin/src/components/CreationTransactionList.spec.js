import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminListContributionsShort } from '../graphql/adminListContributions.graphql'
import { CreationTransactionList } from './CreationTransactionList'

vi.mock('@vue/apollo-composable')
vi.mock('vue-i18n')
vi.mock('@/composables/useToast')

const contributions = [
  {
    id: 1,
    createdAt: '2024-03-05T10:00:00.000Z',
    contributionDate: '2024-02-01T00:00:00.000Z',
    confirmedAt: '2024-03-06T10:00:00.000Z',
    contributionStatus: 'CONFIRMED',
    amount: '100',
    memo: 'a memo',
  },
  {
    id: 2,
    createdAt: '2024-04-05T10:00:00.000Z',
    contributionDate: '2024-03-01T00:00:00.000Z',
    confirmedAt: null,
    contributionStatus: 'PENDING',
    amount: '50',
    memo: 'another memo',
  },
]

describe('CreationTransactionList', () => {
  let wrapper
  let mockResult
  const mockRefetch = vi.fn()
  const mockT = vi.fn((key) => key)
  const mockD = vi.fn((date, format) => `${format ?? 'date'}:${date.toISOString()}`)
  const mockToastError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockResult = ref(null)
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
        mocks: {
          $t: mockT,
          $d: mockD,
        },
      },
    })
  })

  const showContributions = async (count = contributions.length) => {
    mockResult.value = {
      adminListContributions: { contributionCount: count, contributionList: contributions },
    }
    await nextTick()
  }
  const cells = (row) =>
    wrapper
      .findAll('tbody tr')
      [row].findAll('td')
      .map((cell) => cell.text())

  it('renders the component', () => {
    expect(wrapper.find('.component-creation-transaction-list').exists()).toBe(true)
    expect(wrapper.find('.h3').text()).toBe('transactionlist.title')
  })

  it('shows no contributions before the answer', () => {
    expect(wrapper.findAll('tbody tr td').map((cell) => cell.text())).not.toContain('a memo')
  })

  it('calls useQuery with correct parameters', () => {
    expect(useQuery).toHaveBeenCalled()
    const call = useQuery.mock.calls[0]
    expect(call[0]).toBe(adminListContributionsShort)
    expect(call[1]).toEqual({
      filter: {
        userId: 1,
      },
      paginated: {
        currentPage: 1,
        pageSize: 10,
        order: 'DESC',
      },
    })
  })

  it('refetches data when currentPage changes', async () => {
    await showContributions(25)
    expect(mockRefetch).not.toHaveBeenCalled()
    await wrapper.find('[aria-label="Go to page 2"]').trigger('click')
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows the columns in order', async () => {
    await showContributions()
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      'transactionlist.submitted',
      'transactionlist.period',
      'transactionlist.confirmed',
      'transactionlist.status',
      'transactionlist.amount',
      'transactionlist.memo',
    ])
  })

  it('formats the cells', async () => {
    await showContributions()
    expect(cells(0)).toEqual([
      new Date(contributions[0].createdAt).toLocaleDateString(),
      'month:2024-02-01T00:00:00.000Zdate:2024-02-01T00:00:00.000Z',
      new Date(contributions[0].confirmedAt).toLocaleDateString(),
      'CONFIRMED',
      '100 GDD',
      'a memo',
    ])
    expect(wrapper.find('tbody tr td .font-weight-bold').text()).toBe(
      'month:2024-02-01T00:00:00.000Z',
    )
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[5].classes()).toContain('text-break')
  })

  it('leaves the confirmation empty while there is none', async () => {
    await showContributions()
    expect(cells(1)[2]).toBe('')
  })

  it('opens the help with its button', () => {
    const help = wrapper.find('button')
    expect(help.text()).toBe('help.help')
    expect(help.attributes('aria-controls')).toBe('collapse-1')
    expect(wrapper.find('#collapse-1').text()).toContain(
      'transactionlist.submitted math.equals help.transactionlist.submitted',
    )
  })
})
