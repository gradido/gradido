// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { useQuery } from '@vue/apollo-composable'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { __route } from 'vue-router'
import { listSupportTickets } from '@/graphql/supportTickets.graphql'
import { SupportTicketList } from './SupportTicketList'

const mockRefetch = vi.fn()

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  const route = reactive({ params: {} })
  return { useRoute: () => route, __route: route }
})
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

const answering = (tickets, error = null) => {
  vi.mocked(useQuery).mockReturnValue({
    result: ref(error ? undefined : { listSupportTickets: { count: tickets.length, tickets } }),
    loading: ref(false),
    error: ref(error),
    refetch: mockRefetch,
  })
}

const rows = (wrapper) => wrapper.findAllComponents({ name: 'SupportTicketListItem' })

describe('SupportTicketList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __route.params = {}
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

  it('takes a list that could not be read for no empty list', () => {
    answering([], new Error('Network error'))
    const text = mount(SupportTicketList).text()
    expect(text).toContain('support.failed')
    expect(text).not.toContain('support.noRequests')
  })

  it('follows the page in the address, also back in the history', async () => {
    answering(TICKETS)
    mount(SupportTicketList)
    const [, variables] = vi.mocked(useQuery).mock.calls[0]
    __route.params = { tab: 'my-requests', page: '3' }
    await flushPromises()
    expect(variables()).toEqual({ currentPage: 3, pageSize: 25 })
    __route.params = { tab: 'my-requests' }
    await flushPromises()
    expect(variables()).toEqual({ currentPage: 1, pageSize: 25 })
  })
})
