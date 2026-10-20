import { useQuery } from '@vue/apollo-composable'
import { mount } from '@vue/test-utils'
import { BPagination, BTable } from 'bootstrap-vue-next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { TransactionLinkList } from './TransactionLinkList'

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

  const showLinks = async (links = mockLinks, count = links.length) => {
    mockResult.value = { listTransactionLinksAdmin: { count, links } }
    await nextTick()
  }
  const cells = (row) =>
    wrapper
      .findAll('tbody tr')
      [row].findAll('td')
      .map((cell) => cell.text())

  it('renders the component with mock data', async () => {
    await showLinks()
    expect(wrapper.find('.transaction-link-list').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(4)
    expect(wrapper.find('.h3').text()).toBe('transactionlink.name')
  })

  it('shows no table before there are links', () => {
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('formats amount correctly', async () => {
    await showLinks()
    expect(cells(0)[1]).toBe('19.99 GDD')
  })

  it('formats status correctly for different scenarios', async () => {
    await showLinks()
    // Open transaction
    expect(cells(0)[4]).toBe('open')
    // Redeemed transaction
    expect(cells(1)[4]).toBe('redeemed: 2022-04-07T14:43:09.000Z')
    // Deleted transaction, deleted wins over redeemed
    expect(cells(2)[4]).toBe('deleted: 2022-03-24T17:43:09.000Z')
    // Expired transaction
    expect(cells(3)[4]).toBe('expired: 2022-01-15T00:00:00.000Z')
  })

  it('displays correct memo', async () => {
    await showLinks()
    expect(wrapper.findAll('thead th')[2].text()).toBe('transactionlist.memo')
    const memo = wrapper.findAll('tbody tr')[0].findAll('td')[2]
    expect(memo.classes()).toContain('text-break')
    expect(memo.text()).toBe(mockLinks[0].memo)
  })

  it('formats dates correctly', async () => {
    await showLinks()
    expect(cells(0)[0]).toBe('2022-03-24T17:43:09.000Z')
    expect(cells(0)[3]).toBe('2022-04-07T17:43:09.000Z')
  })

  it('asks for the page of the user it shows', () => {
    const variables = useQuery.mock.lastCall[1]
    expect(variables()).toEqual({ currentPage: 1, pageSize: 5, userId: 123 })
  })

  it('refetches data when currentPage changes', async () => {
    await showLinks(mockLinks, 12)
    expect(mockRefetch).not.toHaveBeenCalled()
    await wrapper.find('[aria-label="Go to page 2"]').trigger('click')
    expect(mockRefetch).toHaveBeenCalled()
    expect(useQuery.mock.lastCall[1]()).toMatchObject({ currentPage: 2 })
  })

  it('toasts when the query fails', async () => {
    mockError.value = new Error('Ouch')
    await nextTick()
    // ⚠️ The component reads `message` off the ref, not off the error: the toast says nothing.
    expect(mockToastError).toHaveBeenCalledWith(undefined)
  })
})
