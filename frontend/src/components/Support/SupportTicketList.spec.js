// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { useQuery } from '@vue/apollo-composable'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { listSupportTickets } from '@/graphql/supportTickets.graphql'
import { SupportTicketList } from './SupportTicketList'

const mockRefetch = vi.fn()

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {} }) }))
vi.mock('@/components/Support/SupportTicketListItem', () => ({
  SupportTicketListItem: {
    name: 'SupportTicketListItem',
    props: ['id', 'text', 'status', 'messagesVisible'],
    emits: ['toggle-messages-visible', 'ticket-changed'],
    template: '<div class="row-stub" />',
  },
}))
vi.mock('@/components/PaginatorRouteParamsPage.vue', () => ({
  default: { name: 'PaginatorRouteParamsPage', props: ['totalCount'], template: '<div />' },
}))

const TICKETS = [
  { id: 13, text: 'second', status: 'OPEN' },
  { id: 12, text: 'first', status: 'CLOSED' },
]

const answering = (tickets) => {
  vi.mocked(useQuery).mockReturnValue({
    result: ref({ listSupportTickets: { count: tickets.length, tickets } }),
    loading: ref(false),
    refetch: mockRefetch,
  })
}

const rows = (wrapper) => wrapper.findAllComponents({ name: 'SupportTicketListItem' })

describe('SupportTicketList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for the first page of the member own requests, and again and again', () => {
    answering(TICKETS)
    mount(SupportTicketList)
    const [document, variables, options] = vi.mocked(useQuery).mock.calls[0]
    expect(document).toBe(listSupportTickets)
    expect(variables()).toEqual({ currentPage: 1, pageSize: 25 })
    expect(options).toMatchObject({ fetchPolicy: 'cache-and-network' })
  })

  it('asks for the page the member turns to', async () => {
    answering(TICKETS)
    const wrapper = mount(SupportTicketList)
    const [, variables] = vi.mocked(useQuery).mock.calls[0]
    wrapper.findComponent({ name: 'PaginatorRouteParamsPage' }).vm.$emit('update:modelValue', 2)
    expect(variables()).toEqual({ currentPage: 2, pageSize: 25 })
  })

  it('shows a row for each request, as the server orders them', () => {
    answering(TICKETS)
    expect(rows(mount(SupportTicketList)).map((row) => row.props('id'))).toEqual([13, 12])
  })

  it('opens one thread at a time, and closes it again', async () => {
    answering(TICKETS)
    const wrapper = mount(SupportTicketList)
    await rows(wrapper)[0].vm.$emit('toggle-messages-visible')
    expect(rows(wrapper).map((row) => row.props('messagesVisible'))).toEqual([true, false])
    await rows(wrapper)[1].vm.$emit('toggle-messages-visible')
    expect(rows(wrapper).map((row) => row.props('messagesVisible'))).toEqual([false, true])
    await rows(wrapper)[1].vm.$emit('toggle-messages-visible')
    expect(rows(wrapper).map((row) => row.props('messagesVisible'))).toEqual([false, false])
  })

  it('asks again where a request changed', async () => {
    answering(TICKETS)
    const wrapper = mount(SupportTicketList)
    await rows(wrapper)[0].vm.$emit('ticket-changed')
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('says so where the member has asked nothing yet', () => {
    answering([])
    expect(mount(SupportTicketList).text()).toContain('support.noRequests')
  })
})
