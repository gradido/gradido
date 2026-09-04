import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import Transactions from './Transactions.vue'
import { GdtEntryType } from '@/graphql/enums'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { PAGE_SIZE } from '@/constants'
import { bookingsWithMemberRoute } from '@/utils/bookingsRoute'

const mockScrollTo = vi.fn()
window.scrollTo = mockScrollTo

// Reactive, so a test can change the address the way the router does and watch the page
// follow it.
const mockRoute = reactive({ path: '/transactions', query: {} })
const mockRouterReplace = vi.fn()
const mockRouter = {
  replace: mockRouterReplace,
}
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => mockRouter),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    // The key, and the name after it where one was handed in -- so the label can be read
    // for which sentence it chose AND whom it named.
    t: (key, params) => (params?.name ? `${key}:${params.name}` : key),
    d: (date) => String(date),
  }),
}))

// ⚠️ Needed since this page mounts the contact window: that pulls in the avatar-zoom
// composable, which builds its labels through `i18n.global.t` because a composable is no
// setup scope -- and the stub above has replaced the whole `vue-i18n` module, so `@/i18n`
// would find no `createI18n` to call and the file would not even load. (The same mock
// LastTransactions.spec carries, for the same chain.)
vi.mock('@/i18n', () => ({
  default: { global: { t: (key) => key } },
}))

// The GDT list's lazy query.
const mockLoadGdt = vi.fn()
const mockOnResult = vi.fn()
const mockOnError = vi.fn()
// The GDD list's own query.
let listResultHandler
let listErrorHandler
const mockRefetchList = vi.fn(() => Promise.resolve())
const mockLoading = ref(false)
/** The single-contact lookup behind the window this page opens (useContactWindow). */
const mockContactLookup = vi.fn(() => Promise.resolve({ data: { contactList: { contacts: [] } } }))
vi.mock('@vue/apollo-composable', () => ({
  useLazyQuery: vi.fn(() => ({
    load: mockLoadGdt,
    onResult: mockOnResult,
    onError: mockOnError,
  })),
  useQuery: vi.fn(() => ({
    onResult: (handler) => {
      listResultHandler = handler
    },
    onError: (handler) => {
      listErrorHandler = handler
    },
    refetch: mockRefetchList,
    loading: mockLoading,
  })),
  useApolloClient: vi.fn(() => ({ client: { query: mockContactLookup } })),
}))

const mockFetchMemberAvatars = vi.fn()
vi.mock('@/composables/useMemberAvatars', () => ({
  fetchMemberAvatars: (...args) => mockFetchMemberAvatars(...args),
}))

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({
    toastError: mockToastError,
  })),
}))

vi.mock('@/components/GddTransactionList', () => ({
  default: {
    name: 'GddTransactionList',
    // Declared so the tests can read them as props rather than as fallthrough attributes.
    props: [
      'currentPage',
      'transactions',
      'transactionCount',
      'transactionLinkCount',
      'openLinkCount',
      'narrowed',
      'pending',
    ],
    emits: ['update-transactions', 'open-member'],
    template: '<div class="mock-gdd-transaction-list"></div>',
  },
}))

vi.mock('@/components/Contacts/ContactWindow.vue', () => ({
  default: {
    name: 'ContactWindow',
    props: ['modelValue', 'contact'],
    template:
      '<div data-test="contact-window" :data-open="String(modelValue)" :data-who="contact?.user?.gradidoID ?? \'\'" :data-bookings="String(contact?.bookings)" />',
  },
}))

vi.mock('@/components/GdtTransactionList', () => ({
  default: {
    name: 'GdtTransactionList',
    template: '<div class="mock-gdt-transaction-list"></div>',
  },
}))

const MARGRET = { gradidoID: 'margret-id', communityUuid: 'home', alias: 'Margret' }
const answer = (rows, balance = {}) => ({
  data: {
    transactionList: {
      balance: { count: rows.length, linkCount: 0, openLinkCount: 0, ...balance },
      transactions: rows,
    },
  },
})
/** The address the contact window builds for this member -- the SAME module, both ends. */
const narrowedTo = (member) => bookingsWithMemberRoute(member).query

describe('Transactions', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(Transactions, {
      props,
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
        mocks: {
          $t: (key) => key,
          $n: (n) => String(n),
          $d: (d) => d,
        },
      },
    })
  }

  /** What the page asked the server with -- the computed handed to useQuery, unwrapped. */
  const askedWith = async () => {
    const { useQuery } = await import('@vue/apollo-composable')
    const call = useQuery.mock.calls.find(([query]) => query === transactionsQuery)
    return { variables: call[1].value, options: call[2].value }
  }

  const list = () => wrapper.findComponent({ name: 'GddTransactionList' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.path = '/transactions'
    mockRoute.query = {}
    mockLoading.value = false
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders page', () => {
    wrapper = createWrapper()
    expect(wrapper.find('.transactions').exists()).toBe(true)
  })

  it('renders the GDD transaction table when gdt is false', () => {
    wrapper = createWrapper({ gdt: false })
    expect(wrapper.find('.mock-gdd-transaction-list').exists()).toBe(true)
  })

  it('renders the GDT transaction table when gdt is true', () => {
    wrapper = createWrapper({ gdt: true })
    expect(wrapper.find('.mock-gdt-transaction-list').exists()).toBe(true)
  })

  /**
   * The page owns its list: its own query, its own page number. The layout hands nothing
   * down here any more, so what this page asks for is the whole story of what it shows.
   */
  describe("the GDD list, the page's own query", () => {
    it('asks for page one in the size the paginator divides by, narrowed to nobody', async () => {
      wrapper = createWrapper()
      const { variables, options } = await askedWith()
      expect(variables).toEqual({
        currentPage: 1,
        pageSize: PAGE_SIZE,
        order: 'DESC',
        counterparty: null,
      })
      // Out of the cache: the virtual rows carry fixed ids and would be shared with the
      // layout's answer otherwise.
      expect(options).toEqual({ fetchPolicy: 'no-cache', enabled: true })
    })

    it('does not ask for it on the GDT tab', async () => {
      wrapper = createWrapper({ gdt: true })
      const { options } = await askedWith()
      expect(options.enabled).toBe(false)
    })

    it('takes rows and counts off the answer, and asks for the faces beside them', async () => {
      wrapper = createWrapper()
      const rows = [
        { id: 1, typeId: 'DECAY', linkedUser: null },
        { id: 2, typeId: 'SEND', linkedUser: MARGRET },
      ]
      listResultHandler(answer(rows, { count: 40, linkCount: 3, openLinkCount: 1 }))
      await nextTick()

      expect(list().props('transactions')).toEqual(rows)
      expect(list().props('transactionCount')).toBe(40)
      expect(list().props('transactionLinkCount')).toBe(3)
      expect(list().props('openLinkCount')).toBe(1)
      // The apollo client this page holds, whatever it carries -- what is measured here
      // is WHICH members were handed over, not the client's shape.
      expect(mockFetchMemberAvatars).toHaveBeenCalledWith(expect.anything(), [null, MARGRET])
    })

    it('hands the list the waiting state of its own query', async () => {
      mockLoading.value = true
      wrapper = createWrapper()
      expect(list().props('pending')).toBe(true)
      mockLoading.value = false
      await nextTick()
      expect(list().props('pending')).toBe(false)
    })

    it('marks the count as failed and says so when the query fails', async () => {
      wrapper = createWrapper()
      listErrorHandler(new Error('API Error'))
      await nextTick()

      expect(list().props('transactionCount')).toBe(-1)
      expect(mockToastError).toHaveBeenCalledWith('API Error')
    })

    it('turns a page by asking for it, and tells the layout nothing', async () => {
      wrapper = createWrapper()
      await list().vm.$emit('update-transactions', { currentPage: 2, pageSize: PAGE_SIZE })
      await nextTick()

      const { variables } = await askedWith()
      expect(variables.currentPage).toBe(2)
      // The paginator starts where the rows will: the same number goes down to the list.
      expect(list().props('currentPage')).toBe(2)
      expect(mockRefetchList).not.toHaveBeenCalled()
      expect(wrapper.emitted('update-transactions')).toBeUndefined()
    })

    /**
     * The link summary row, after a link was withdrawn: GddTransactionList asks for the
     * page it is on. The variables do not change, so the query would not run on its own --
     * and the balance in the header moved, which is the layout's to refresh.
     */
    it('fetches the page again and tells the layout when the list asks for the page it is on', async () => {
      wrapper = createWrapper()
      await list().vm.$emit('update-transactions', { currentPage: 1, pageSize: PAGE_SIZE })
      await nextTick()

      expect(mockRefetchList).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('update-transactions')).toEqual([[{}]])
    })

    // The failure is reported through onError; a second report as an unhandled rejection
    // would be noise beside the toast.
    it('does not let a failed refetch escape as an unhandled rejection', async () => {
      mockRefetchList.mockReturnValueOnce(Promise.reject(new Error('offline')))
      const escaped = []
      const catchEscaping = (event) => {
        escaped.push(event.reason)
        event.preventDefault()
      }
      window.addEventListener('unhandledrejection', catchEscaping)
      process.on('unhandledRejection', catchEscaping)
      try {
        wrapper = createWrapper()
        await list().vm.$emit('update-transactions', { currentPage: 1, pageSize: PAGE_SIZE })
        await new Promise((resolve) => setTimeout(resolve, 0))
      } finally {
        window.removeEventListener('unhandledrejection', catchEscaping)
        process.off('unhandledRejection', catchEscaping)
      }
      expect(escaped).toEqual([])
    })

    // The tabs share this component instance: the GDT tab and back must not carry the
    // page number over, the way a navigation into the list never did.
    it('starts on page one again after the GDT tab', async () => {
      wrapper = createWrapper()
      await list().vm.$emit('update-transactions', { currentPage: 3, pageSize: PAGE_SIZE })
      await wrapper.setProps({ gdt: true })
      await wrapper.setProps({ gdt: false })
      await nextTick()

      const { variables } = await askedWith()
      expect(variables.currentPage).toBe(1)
      expect(list().props('currentPage')).toBe(1)
    })
  })

  /**
   * The contact window's link: "51 bookings, last on 24.08." opens this page narrowed to
   * that member, by the pair in the address.
   */
  describe('narrowed to one member', () => {
    beforeEach(() => {
      mockRoute.query = narrowedTo(MARGRET)
    })

    it('asks the server for the bookings with that member only', async () => {
      wrapper = createWrapper()
      const { variables } = await askedWith()
      expect(variables.counterparty).toEqual({ gradidoID: 'margret-id', communityUuid: 'home' })
      expect(list().props('narrowed')).toBe(true)
    })

    it('sends the id alone when the address names no community', async () => {
      mockRoute.query = narrowedTo({ gradidoID: 'margret-id', communityUuid: null })
      wrapper = createWrapper()
      const { variables } = await askedWith()
      expect(variables.counterparty).toEqual({ gradidoID: 'margret-id', communityUuid: null })
    })

    it('shows the mark, named after the rows once they are there', async () => {
      wrapper = createWrapper()
      const mark = wrapper.find('[data-test="transactions-filter"]')
      expect(mark.exists()).toBe(true)
      // Before an answer there is no row to take a name from.
      expect(mark.text()).toContain('transaction.onlyWithSomeone')

      listResultHandler(answer([{ id: 2, typeId: 'SEND', linkedUser: MARGRET }]))
      await nextTick()
      expect(wrapper.find('[data-test="transactions-filter"]').text()).toContain(
        'transaction.onlyWith:Margret',
      )
    })

    // The rows beneath and the contact window show the id for such a member; the mark
    // must not be the one place that shows the alias the wallet suppresses everywhere else.
    it('names a member with a legacy alias too short to count by the id, as the rows do', async () => {
      wrapper = createWrapper()
      listResultHandler(
        answer([{ id: 2, typeId: 'SEND', linkedUser: { ...MARGRET, alias: 'ab' } }]),
      )
      await nextTick()
      expect(wrapper.find('[data-test="transactions-filter"]').text()).toContain(
        'transaction.onlyWith:margret-id',
      )
    })

    it('leads back to the whole list on the same path, without the parameters', () => {
      wrapper = createWrapper()
      const cross = wrapper.findComponent('[data-test="transactions-filter-clear"]')
      expect(cross.props('to')).toEqual({ path: '/transactions' })
    })

    it('starts a different member on page one, with nothing of the last list on screen', async () => {
      wrapper = createWrapper()
      listResultHandler(
        answer([{ id: 2, typeId: 'SEND', linkedUser: MARGRET }], {
          linkCount: 2,
          openLinkCount: 1,
        }),
      )
      await list().vm.$emit('update-transactions', { currentPage: 3, pageSize: PAGE_SIZE })
      await nextTick()
      expect(list().props('currentPage')).toBe(3)

      mockRoute.query = narrowedTo({ gradidoID: 'somebody-else', communityUuid: 'home' })
      await nextTick()

      const { variables } = await askedWith()
      expect(variables.currentPage).toBe(1)
      expect(variables.counterparty.gradidoID).toBe('somebody-else')
      expect(list().props('transactions')).toEqual([])
      expect(list().props('transactionLinkCount')).toBe(0)
      expect(list().props('openLinkCount')).toBe(0)
      expect(wrapper.find('[data-test="transactions-filter"]').text()).toContain(
        'transaction.onlyWithSomeone',
      )
    })

    // ⛔ The address rebuilt with the SAME pair (a hash edit, an unrelated parameter) is
    // not a different member. Apollo would not ask again for equal variables, so a reset
    // here would have emptied the list for good.
    it('keeps the list when the address is rebuilt with the same member', async () => {
      wrapper = createWrapper()
      const rows = [{ id: 2, typeId: 'SEND', linkedUser: MARGRET }]
      listResultHandler(answer(rows))
      await nextTick()

      mockRoute.query = { ...narrowedTo(MARGRET), unrelated: '1' }
      await nextTick()

      expect(list().props('transactions')).toEqual(rows)
      expect(list().props('transactionCount')).toBe(1)
    })

    // ⛔ `?with=a&with=b` arrives as an array. Sent on, the schema refuses the whole
    // request; read as nothing, the page shows everything -- and then it must not claim
    // otherwise, so the mark stays away too.
    it('reads no narrowing from an address that names two members', async () => {
      mockRoute.query = { with: ['a', 'b'], community: 'home' }
      wrapper = createWrapper()
      const { variables } = await askedWith()
      expect(variables.counterparty).toBeNull()
      expect(wrapper.find('[data-test="transactions-filter"]').exists()).toBe(false)
      expect(list().props('narrowed')).toBe(false)
    })

    it('shows no mark on the GDT tab, whatever the address says', () => {
      wrapper = createWrapper({ gdt: true })
      expect(wrapper.find('[data-test="transactions-filter"]').exists()).toBe(false)
    })
  })

  describe('GDT transactions', () => {
    beforeEach(() => {
      wrapper = createWrapper({ gdt: true })
    })

    it('calls loadGdt on mount', () => {
      expect(mockLoadGdt).toHaveBeenCalled()
    })

    it('updates GDT transactions on successful query', async () => {
      const mockResult = {
        data: {
          listGDTEntries: {
            count: 4,
            gdtEntries: [
              {
                id: 1,
                amount: 100,
                gdt: 1700,
                factor: 17,
                comment: '',
                date: '2021-05-02T17:20:11+00:00',
                gdtEntryType: GdtEntryType.FORM,
              },
            ],
          },
        },
      }

      mockOnResult.mock.calls[0][0](mockResult)
      await nextTick()

      expect(wrapper.vm.transactionsGdt).toEqual(mockResult.data.listGDTEntries.gdtEntries)
      expect(wrapper.vm.transactionGdtCount).toBe(4)
    })

    it('calls router.replace when on /transactions path', async () => {
      const mockResult = { data: { listGDTEntries: { count: 0, gdtEntries: [] } } }
      mockOnResult.mock.calls[0][0](mockResult)
      await nextTick()

      expect(mockRouterReplace).toHaveBeenCalledWith('/gdt')
      expect(mockScrollTo).toHaveBeenCalledWith(0, 0)
    })

    it('handles error in GDT query', async () => {
      const error = new Error('API Error')
      mockOnError.mock.calls[0][0](error)
      await nextTick()

      expect(wrapper.vm.transactionGdtCount).toBe(-1)
      expect(mockToastError).toHaveBeenCalledWith('API Error')
    })

    it('updates GDT transactions when gdtPage changes', async () => {
      await wrapper.setProps({ gdt: true })
      vi.clearAllMocks()

      wrapper.vm.gdtPage = 2
      await nextTick()

      expect(mockLoadGdt).toHaveBeenCalled()
    })
  })

  /**
   * KF-010 in the booking list: a tap on a counterparty's name opens the contact window --
   * the same window the contact list opens -- rather than jumping into the send form. The
   * row hands over the MEMBER; the figures the window states are a grouping over all
   * bookings with them and come from a lookup of their own.
   */
  describe('the contact window over the list', () => {
    const OTHER = { gradidoID: 'other-id', communityUuid: 'far', alias: 'Anna' }
    const contactFor = (member, bookings) => ({
      user: member,
      firstAt: '2025-08-01',
      lastAt: '2026-01-01',
      bookings,
    })
    const answering = (contact) =>
      Promise.resolve({ data: { contactList: { contacts: contact ? [contact] : [] } } })

    const windowAttrs = () => wrapper.find('[data-test="contact-window"]').attributes()

    it('stays closed, and asks nothing, until a name is tapped', () => {
      wrapper = createWrapper()

      expect(windowAttrs()['data-open']).toBe('false')
      expect(mockContactLookup).not.toHaveBeenCalled()
    })

    // ⛔ Open on the row's own member BEFORE the lookup answers. The other way round is a
    // tap that does nothing for a round trip, which on a phone reads as a broken button.
    it('opens on the tapped member at once, and asks about the pair', async () => {
      mockContactLookup.mockReturnValue(new Promise(() => {}))
      wrapper = createWrapper()

      list().vm.$emit('open-member', MARGRET)
      await nextTick()

      expect(windowAttrs()['data-open']).toBe('true')
      expect(windowAttrs()['data-who']).toBe(MARGRET.gradidoID)
      // Nothing invented while the figures are unknown -- absent, not zero.
      expect(windowAttrs()['data-bookings']).toBe('undefined')
      expect(mockContactLookup.mock.calls[0][0].variables).toEqual({
        ref: { gradidoID: MARGRET.gradidoID, communityUuid: MARGRET.communityUuid },
      })
    })

    it('fills in the figures the lookup brings', async () => {
      mockContactLookup.mockReturnValue(answering(contactFor(MARGRET, 51)))
      wrapper = createWrapper()

      list().vm.$emit('open-member', MARGRET)
      await flushPromises()
      await nextTick()

      expect(windowAttrs()['data-bookings']).toBe('51')
      expect(windowAttrs()['data-who']).toBe(MARGRET.gradidoID)
    })

    /**
     * ⛔ An answer that lands after the window was closed must not reopen it. The member
     * has moved on; a window coming back by itself a second later is the wallet acting on
     * its own.
     */
    it('does not reopen a window that was closed while the lookup was out', async () => {
      let answer
      mockContactLookup.mockReturnValue(
        new Promise((resolve) => {
          answer = resolve
        }),
      )
      wrapper = createWrapper()

      list().vm.$emit('open-member', MARGRET)
      await nextTick()
      wrapper.findComponent({ name: 'ContactWindow' }).vm.$emit('update:modelValue', false)
      await nextTick()
      expect(windowAttrs()['data-open']).toBe('false')

      answer({ data: { contactList: { contacts: [contactFor(MARGRET, 51)] } } })
      await flushPromises()
      await nextTick()

      expect(windowAttrs()['data-open']).toBe('false')
    })

    /**
     * ⛔ And a LATE answer must not write one person's figures under another's name. Two
     * taps in quick succession is all it takes; without the guard the first answer lands
     * last and the window states Margret's count over Anna's face.
     */
    it('drops an answer that is no longer the person on screen', async () => {
      let firstAnswer
      mockContactLookup
        .mockReturnValueOnce(
          new Promise((resolve) => {
            firstAnswer = resolve
          }),
        )
        .mockReturnValueOnce(answering(contactFor(OTHER, 7)))
      wrapper = createWrapper()

      list().vm.$emit('open-member', MARGRET)
      await nextTick()
      list().vm.$emit('open-member', OTHER)
      await flushPromises()
      await nextTick()
      expect(windowAttrs()['data-who']).toBe(OTHER.gradidoID)
      expect(windowAttrs()['data-bookings']).toBe('7')

      firstAnswer({ data: { contactList: { contacts: [contactFor(MARGRET, 51)] } } })
      await flushPromises()
      await nextTick()

      // Still Anna, still Anna's count.
      expect(windowAttrs()['data-who']).toBe(OTHER.gradidoID)
      expect(windowAttrs()['data-bookings']).toBe('7')
    })

    it('leaves the window standing when the lookup fails', async () => {
      mockContactLookup.mockReturnValue(Promise.reject(new Error('no')))
      wrapper = createWrapper()

      list().vm.$emit('open-member', MARGRET)
      await flushPromises()
      await nextTick()

      expect(windowAttrs()['data-open']).toBe('true')
      expect(windowAttrs()['data-who']).toBe(MARGRET.gradidoID)
      expect(windowAttrs()['data-bookings']).toBe('undefined')
    })
  })
})
