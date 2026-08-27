import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import DashboardLayout from './DashboardLayout'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '@/routes/routes'
import { useQuery } from '@vue/apollo-composable'
import flushPromises from 'flush-promises'
import { forgetAllMemberAvatars, storedMemberAvatar } from '@/composables/useMemberAvatars'

const toastErrorSpy = vi.fn()

vi.mock('@/composables/useToast', () => ({
  useAppToast: () => ({
    toastError: toastErrorSpy,
  }),
}))

const mockRefetchFn = vi.fn()
const mockMutateFn = vi.fn()
const mockApolloQuery = vi.fn(() => Promise.resolve({ data: { memberAvatars: [] } }))
let onErrorHandler
let onResultHandler
const mockQueryResult = ref(null)
const loading = ref(false)

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    refetch: mockRefetchFn,
    result: mockQueryResult,
    onResult: (handler) => {
      onResultHandler = handler
    },
    onError: (handler) => {
      onErrorHandler = handler
    },
    loading,
  })),
  useLazyQuery: vi.fn(() => ({
    refetch: mockRefetchFn,
    result: mockQueryResult,
    onResult: (handler) => {
      onResultHandler = handler
    },
    onError: (handler) => {
      onErrorHandler = handler
    },
    loading,
  })),
  useApolloClient: vi.fn(() => ({ client: { query: mockApolloQuery } })),
  useMutation: vi.fn(() => ({
    mutate: mockMutateFn,
    onDone: vi.fn(),
    onError: vi.fn(),
  })),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (value) => value,
    n: (value) => value,
  }),
}))

const router = createRouter({
  history: createWebHistory(),
  routes,
})

describe('DashboardLayout', () => {
  let wrapper
  let store
  let logoutSpy
  let routerPushSpy

  const createVuexStore = () => {
    logoutSpy = vi.fn()
    return createStore({
      state: {
        publisherId: 123,
        firstName: 'User',
        lastName: 'Example',
        token: 'valid-token',
        roles: [],
      },
      actions: {
        logout: logoutSpy,
      },
    })
  }

  /**
   * ⚠️ `stubs` is an override, because `RouterLink: true` renders NO SLOT. Anything a link
   * carries -- an icon, a label -- is invisible to a test through the default stub, and a
   * `find` inside one comes back empty in a way that reads exactly like "it is not there".
   * A test that needs to see inside a link passes a stub that renders its children.
   */
  const createWrapper = (stubs = {}) => {
    store = createVuexStore()
    routerPushSpy = vi.spyOn(router, 'push')
    return mount(DashboardLayout, {
      global: {
        plugins: [store, router],
        stubs: {
          RouterLink: true,
          RouterView: true,
          LastTransactions: true,
          Navbar: true,
          Sidebar: true,
          MobileSidebar: true,
          // ⚠️ The settings menu asks two queries of its own (the thank you card's state).
          // Left un-stubbed they land in this file's shared useQuery spy and are counted as
          // picture requests -- twelve tests about member avatars fell over them.
          SettingsMenu: true,
          Breadcrumb: true,
          ContentHeader: true,
          RightSide: true,
          ContentFooter: true,
          SkeletonOverview: true,
          'fade-transition': true,
          // Last, so a caller can override ANY of them and not only RouterLink. Spread
          // first, an override was silently ignored for every other name.
          ...stubs,
        },
        mocks: {
          $t: (key) => key,
          $d: (d) => d,
          $n: vi.fn(),
          $i18n: {
            locale: 'en',
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = createWrapper()
  })

  afterEach(() => {
    // ⚠️ Every test mounts a layout and none took it down again, so they piled up and each
    // one kept listening. Harmless while nothing in here reacted to anything global — and
    // wrong the moment something did: a route change reached FOUR live layouts and the
    // refetch spy counted four calls for one navigation.
    wrapper?.unmount()
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  /**
   * The settings are a room one enters and leaves. While a settings route is open the menu
   * column carries the settings menu instead of the main one -- that is what makes the arrow
   * "back to account" mean anything, and it keeps the wide screen from showing two menu
   * columns side by side.
   *
   * ⚠️ These use the wrapper the surrounding beforeEach already mounted. A second layout of
   * their own would stay alive through the afterEach of the others and count their route
   * changes twice -- the very pile-up the note below the afterEach describes.
   */
  describe('the menu column on a settings route', () => {
    // A fresh layout starts on the skeleton, and the skeleton has no menu column at all.
    beforeEach(async () => {
      wrapper.vm.skeleton = false
      await nextTick()
    })

    it('carries the settings menu', async () => {
      await router.push('/settings/appearance')
      await nextTick()

      expect(wrapper.find('[data-test="settings-back-to-account"]').exists()).toBe(true)
      expect(wrapper.find('.main-sidebar').exists()).toBe(false)
    })

    it('carries the main menu everywhere else', async () => {
      await router.push('/transactions')
      await nextTick()

      expect(wrapper.find('.main-sidebar').exists()).toBe(true)
      expect(wrapper.find('[data-test="settings-back-to-account"]').exists()).toBe(false)
    })

    /**
     * ⛔ The drawer behind the hamburger renders the very same `Sidebar` component. Swap it
     * there as well and somebody on a phone would open the hamburger inside the settings and
     * find the settings again -- with no way back into the wallet. On a phone the list at
     * /settings is the settings menu; the drawer stays the way out.
     */
    /**
     * ⛔ And the column on the OTHER side goes away. `RightSide` answers `empty` for every
     * /settings route, so it rendered nothing there and still took a quarter of the screen:
     * with the menu that left the content six of twelve columns, and the widest screen gave
     * the settings the least room. It showed worst on the business card, whose contact field
     * stands beside the card and had no width left to type in.
     */
    it('drops the empty right column, so the content gets the room', async () => {
      await router.push('/settings/gradido-card')
      await nextTick()

      expect(wrapper.findComponent({ name: 'RightSide' }).exists()).toBe(false)
    })

    /**
     * ⛔ The tiles in the page heading linked RELATIVELY (`to="transactions"`). From a path
     * ending in a slash -- which a router really hands over, and which the section fix made
     * render this heading for the first time -- vue-router resolves that one segment too
     * deep: `/overview/` + `transactions` is `/overview/transactions`, which matches only
     * the catch-all. That route carries no `requiresAuth`, so App.vue swaps the whole page
     * to AuthLayout and the member is out of the wallet. Four leading slashes.
     */
    it('links out of the page heading by absolute path', async () => {
      await router.push('/overview')
      // ⚠️ The real ContentHeader, because the default stub renders no slots -- and the
      // links under test live inside them, so a stubbed header would report zero and pass.
      const withHeader = createWrapper({ ContentHeader: false })
      withHeader.vm.skeleton = false
      await nextTick()

      const targets = withHeader.findAll('router-link-stub').map((link) => link.attributes('to'))
      // ⚠️ Down BEFORE the assertions, not after. A second layout that outlives a failing
      // test keeps listening and counts the other tests' route changes a second time -- the
      // pile-up the note under the afterEach describes. Injecting the old relative links
      // showed it: one real failure, two unrelated tests dragged down with it.
      withHeader.unmount()

      expect(targets).toContain('/transactions')
      expect(targets.filter((target) => !target.startsWith('/'))).toEqual([])
    })

    it('keeps it on the overview, where the booking list belongs', async () => {
      await router.push('/overview')
      await nextTick()

      expect(wrapper.findComponent({ name: 'RightSide' }).exists()).toBe(true)
    })

    /**
     * ⛔ Since 27.08.2026 the same applies wherever the column has nothing to say -- and the
     * code pages are why it matters rather than merely tidies: they are held out to another
     * person, who was reading the member's last bookings beside the code. On /transactions
     * the column repeated the page it stands beside.
     */
    it.each(['/my-gradido-card', '/my-thank-you-card', '/scan', '/calculator', '/transactions'])(
      'drops it at %s as well',
      async (path) => {
        await router.push(path)
        await nextTick()

        expect(wrapper.findComponent({ name: 'RightSide' }).exists()).toBe(false)
      },
    )

    it('leaves the drawer on the main menu, even inside the settings', async () => {
      await router.push('/settings/appearance')
      await nextTick()

      expect(wrapper.findComponent({ name: 'MobileSidebar' }).exists()).toBe(true)
    })
  })

  /**
   * The balance in the header is fetched once, when this layout mounts — and the layout
   * outlives every route change. Until this watch existed, only a page that said so kept it
   * current (`Send` after a transfer, `Transactions` on paging), so a payment made anywhere
   * else left the old number standing everywhere the member went next. A thank you card
   * payment is exactly that: its own page, at somebody else's till, saying nothing here.
   */
  describe('the balance in the header', () => {
    it('asks again when the member opens the overview', async () => {
      await router.push('/transactions')
      mockRefetchFn.mockClear()

      await router.push('/overview')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledTimes(1)
    })

    it('asks again when the member opens the transactions', async () => {
      await router.push('/overview')
      mockRefetchFn.mockClear()

      await router.push('/transactions')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledTimes(1)
    })

    /**
     * ⚠️ With NO arguments. `refetch(variables)` replaces them, so passing the paging ones
     * along would send somebody sitting on page three back to page one every time they
     * glanced at their balance. Empty means "the same question again".
     */
    it('asks the same question again, rather than resetting the paging', async () => {
      await router.push('/settings')
      mockRefetchFn.mockClear()

      await router.push('/transactions')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledWith()
    })

    // The counterpart, and the one that keeps this from becoming "refetch on every click":
    // it is the two pages that show a balance, not the whole wallet.
    it('leaves other pages alone', async () => {
      await router.push('/overview')
      mockRefetchFn.mockClear()

      await router.push('/settings')
      await nextTick()

      expect(mockRefetchFn).not.toHaveBeenCalled()
    })
  })

  it('renders DIV .main-page', () => {
    expect(wrapper.find('div.main-page').exists()).toBe(true)
  })

  describe('at first', () => {
    it('renders a component Skeleton', () => {
      expect(wrapper.findComponent({ name: 'SkeletonOverview' }).exists()).toBe(true)
    })
  })

  // The pictures beside the bookings. This layout is the only place the list arrives, and
  // both places that draw a face read from what is fetched here, so the whole page costs
  // one request -- or none at all, which is the common case on a second visit.
  describe("other members' pictures", () => {
    const listWith = (linkedUsers) => ({
      data: {
        transactionList: {
          balance: { balanceGDT: '0', count: 0, linkCount: 0, balance: '0' },
          transactions: linkedUsers.map((linkedUser, index) => ({ id: index, linkedUser })),
        },
      },
    })
    const ANNA = {
      gradidoID: 'aaaa-anna',
      communityUuid: 'cccc-community',
      avatarUpdatedAt: '2026-08-17T10:00:00.000Z',
    }

    beforeEach(async () => {
      mockApolloQuery.mockClear()
      forgetAllMemberAvatars()
      await nextTick()
    })

    it('asks for the pictures it does not already hold', async () => {
      onResultHandler(listWith([ANNA]))
      await flushPromises()

      expect(mockApolloQuery).toHaveBeenCalledTimes(1)
      expect(mockApolloQuery.mock.calls[0][0].variables).toEqual({
        refs: [{ gradidoID: 'aaaa-anna', communityUuid: 'cccc-community' }],
      })
    })

    // The reason the date travels with every row in the first place: on the next visit
    // nothing has changed, so nothing is asked for.
    it('asks for nothing on a second list where nothing changed', async () => {
      mockApolloQuery.mockResolvedValueOnce({
        data: {
          memberAvatars: [{ ...ANNA, avatar: 'anna-picture' }],
        },
      })
      onResultHandler(listWith([ANNA]))
      await flushPromises()
      mockApolloQuery.mockClear()

      onResultHandler(listWith([ANNA]))
      await flushPromises()

      expect(mockApolloQuery).not.toHaveBeenCalled()
    })

    // ★ A member who switched their picture off arrives with no date at all. Their face has
    // to leave this device, and it must not depend on a request being made -- there is no
    // request to make for them.
    it('forgets a picture the list stops reporting a date for', async () => {
      mockApolloQuery.mockResolvedValueOnce({
        data: { memberAvatars: [{ ...ANNA, avatar: 'anna-picture' }] },
      })
      onResultHandler(listWith([ANNA]))
      await flushPromises()
      expect(storedMemberAvatar(ANNA, ANNA.avatarUpdatedAt)).toBe('anna-picture')

      mockApolloQuery.mockClear()
      onResultHandler(listWith([{ ...ANNA, avatarUpdatedAt: null }]))
      await flushPromises()

      expect(storedMemberAvatar(ANNA, ANNA.avatarUpdatedAt)).toBeNull()
      expect(mockApolloQuery).not.toHaveBeenCalled()
    })

    it('asks for nothing when no member has anything to show', async () => {
      onResultHandler(listWith([{ ...ANNA, avatarUpdatedAt: null }]))
      await flushPromises()
      expect(mockApolloQuery).not.toHaveBeenCalled()
    })

    /**
     * The request names members, not versions: a member who replaces their picture is asked
     * for under exactly the same variables as last time. A cached answer would hand back
     * the picture they just replaced, and the new one would never arrive.
     *
     * ⛔ `no-cache`, not `network-only`. Both skip the cache on the way IN, and only one of
     * them also refuses to WRITE. MemberAvatar carries no id and there are no type policies,
     * so nothing normalises the answer: every distinct ref list becomes its own ROOT_QUERY
     * entry holding a full copy of the base64, and nothing evicts it before logout --
     * measured at 2.1 MB of dead payload over eight pages, on top of the copy this wallet
     * already keeps on purpose and caps at 200.
     */
    it('always asks the server, and leaves no copy in the cache', async () => {
      onResultHandler(listWith([ANNA]))
      await flushPromises()
      expect(mockApolloQuery.mock.calls[0][0].fetchPolicy).toBe('no-cache')
    })

    // A second booking list arriving before the first answer would otherwise ask for
    // exactly the same faces again -- and on a slow connection a third one after that.
    it('does not ask again for what a request is already waiting on', async () => {
      mockApolloQuery.mockImplementationOnce(() => new Promise(() => {}))
      onResultHandler(listWith([ANNA]))
      await flushPromises()
      expect(mockApolloQuery).toHaveBeenCalledTimes(1)

      onResultHandler(listWith([ANNA]))
      await flushPromises()
      expect(mockApolloQuery).toHaveBeenCalledTimes(1)
    })

    // ★ A member can turn the page faster than an answer comes back. The older answer must
    // not land last and win -- least of all for somebody the newer list has just reported
    // as having nothing to show, whose face would return after being forgotten.
    it('drops an answer that a newer list has already overtaken', async () => {
      let answerTheFirstRequest
      mockApolloQuery.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerTheFirstRequest = () =>
              resolve({ data: { memberAvatars: [{ ...ANNA, avatar: 'anna-picture' }] } })
          }),
      )
      onResultHandler(listWith([ANNA]))
      await flushPromises()

      // The next list says she has nothing to show any more.
      onResultHandler(listWith([{ ...ANNA, avatarUpdatedAt: null }]))
      await flushPromises()

      // ...and only now does the first request come back with her picture.
      answerTheFirstRequest()
      await flushPromises()

      expect(storedMemberAvatar(ANNA, ANNA.avatarUpdatedAt)).toBeNull()
    })

    /**
     * ★ ...and only for her. Throwing the WHOLE answer away because a newer list arrived
     * costs the member every portrait in it -- downloaded, paid for, and dropped -- and the
     * list then shows initials although the bytes had already come. Only the members the
     * newest list withdrew are actually dangerous, and the store is told exactly who those
     * are.
     */
    it('keeps the rest of an answer a newer list overtook', async () => {
      const BEN = {
        gradidoID: 'bbbb-ben',
        communityUuid: 'cccc-community',
        avatarUpdatedAt: '2026-08-17T10:00:00.000Z',
      }
      let answerTheFirstRequest
      mockApolloQuery.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerTheFirstRequest = () =>
              resolve({
                data: {
                  memberAvatars: [
                    { ...ANNA, avatar: 'anna-picture' },
                    { ...BEN, avatar: 'ben-picture' },
                  ],
                },
              })
          }),
      )
      onResultHandler(listWith([ANNA, BEN]))
      await flushPromises()

      onResultHandler(listWith([{ ...ANNA, avatarUpdatedAt: null }, BEN]))
      await flushPromises()

      answerTheFirstRequest()
      await flushPromises()

      expect(storedMemberAvatar(ANNA, ANNA.avatarUpdatedAt)).toBeNull()
      expect(storedMemberAvatar(BEN, BEN.avatarUpdatedAt)).toBe('ben-picture')
    })

    /**
     * ⛔ The gap a counter inside this component could not close, because the component is
     * gone by then. The logout action wipes the picture store synchronously as its first
     * act, while Apollo's cancellation of the request in flight is two deferrals later -- a
     * microtask for clearStore, then a setTimeout for the cancel. An answer delivered in
     * between resolves normally, and writing it would hand the next member to sign in on
     * this browser the faces the previous one was allowed to see.
     */
    it('drops an answer that came back after the member logged out', async () => {
      let answerTheRequest
      mockApolloQuery.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerTheRequest = () =>
              resolve({ data: { memberAvatars: [{ ...ANNA, avatar: 'anna-picture' }] } })
          }),
      )
      onResultHandler(listWith([ANNA]))
      await flushPromises()

      // What store.js does, first thing in the logout action.
      forgetAllMemberAvatars()
      answerTheRequest()
      await flushPromises()

      expect(storedMemberAvatar(ANNA, ANNA.avatarUpdatedAt)).toBeNull()
    })

    // Best effort: nobody loses their overview over a portrait. The fetch is started and
    // not awaited, so a rejection cannot break the page by itself -- what it CAN do is
    // escape as an unhandled rejection, which is why the listener below is the assertion
    // that actually measures the catch. Without it, this case passes either way.
    it('shows the page anyway when the pictures cannot be fetched', async () => {
      const escaped = []
      const catchEscaping = (event) => escaped.push(event.reason ?? event)
      window.addEventListener('unhandledrejection', catchEscaping)
      process.on('unhandledRejection', catchEscaping)
      try {
        mockApolloQuery.mockRejectedValueOnce(new Error('network'))
        onResultHandler(listWith([ANNA]))
        await flushPromises()
        await flushPromises()
      } finally {
        window.removeEventListener('unhandledrejection', catchEscaping)
        process.off('unhandledRejection', catchEscaping)
      }

      expect(escaped).toEqual([])
      expect(storedMemberAvatar(ANNA, ANNA.avatarUpdatedAt)).toBeNull()
      expect(wrapper.find('.main-page').exists()).toBe(true)
    })
  })

  describe('after a timeout', () => {
    beforeEach(async () => {
      vi.advanceTimersByTime(1500)
      loading.value = false
      await nextTick()
    })

    describe('update transactions', () => {
      beforeEach(async () => {
        onResultHandler({
          data: {
            transactionList: {
              balance: {
                balanceGDT: '100',
                count: 4,
                linkCount: 8,
                balance: '1450',
              },
              transactions: ['transaction1', 'transaction2', 'transaction3', 'transaction4'],
            },
          },
        })

        await wrapper.vm.updateTransactions({ currentPage: 2, pageSize: 5 })
        await nextTick() // Ensure all promises are resolved
      })

      it('load call to the API', () => {
        expect(useQuery).toHaveBeenCalled()
      })

      it('updates balance', () => {
        expect(wrapper.vm.balance).toBe(1450)
      })

      it('updates transactions', () => {
        expect(wrapper.vm.transactions).toEqual([
          'transaction1',
          'transaction2',
          'transaction3',
          'transaction4',
        ])
      })

      it('updates GDT balance', () => {
        expect(wrapper.vm.GdtBalance).toBe(100)
      })

      it('updates transaction count', () => {
        expect(wrapper.vm.transactionCount).toBe(4)
      })

      it('updates transaction link count', () => {
        expect(wrapper.vm.transactionLinkCount).toBe(8)
      })
    })

    describe('update transactions returns error', () => {
      beforeEach(async () => {
        wrapper.vm.skeleton = false
        await wrapper
          .findComponent({ ref: 'router-view' })
          .vm.$emit('update-transactions', { currentPage: 2, pageSize: 5 })
        await nextTick()
      })

      it('sets pending to true', () => {
        expect(wrapper.vm.pending).toBeTruthy()
      })

      it('toasts the error message', () => {
        onErrorHandler({ message: 'Ouch!' })
        expect(toastErrorSpy).toHaveBeenCalledWith('Ouch!')
      })

      /**
       * ⛔ `pending` is handed down to the page inside the router-view, so a refetch that
       * fails must not leave it standing — that page would wait for something that is never
       * coming. It mattered less while only a deliberate action set it; now that opening the
       * overview or the transactions sets it, one failed request would strand whatever the
       * member opened next. (coderabbit, #3763)
       */
      it('stops the page waiting when the refetch fails', async () => {
        await router.push('/overview')
        await nextTick()
        // Read off the stub's rendered attributes: `RouterView: true` makes a stub that
        // declares no props, so what the layout hands down arrives as attrs, not props.
        const pendingNow = () => wrapper.find('router-view-stub').attributes('pending')
        expect(pendingNow()).toBe('true')

        onErrorHandler({ message: 'Ouch!' })
        await nextTick()

        expect(pendingNow()).toBe('false')
      })
    })

    it('has a component Navbar', () => {
      expect(wrapper.findComponent({ name: 'Navbar' }).exists()).toBe(true)
    })

    it('has a navbar', () => {
      expect(wrapper.find('.main-navbar').exists()).toBe(true)
    })

    it('has a sidebar', () => {
      expect(wrapper.find('.main-sidebar').exists()).toBeTruthy()
    })

    /**
     * The desktop twin of the navbar's quick symbol: above the menu, level with the page
     * heading, small and unmarked. (Bernd, 20.08.2026)
     */
    it('offers the calculator above the menu', () => {
      expect(wrapper.find('[data-test="sidebar-calculator"]').exists()).toBe(true)
    })

    /**
     * The same four tools as on the phone, in the same two-by-two arrangement -- one thing
     * to learn instead of two. This column has room for four in a row at 1280px but not at
     * 992px, where it is about 165px wide and four 44px targets are 176.
     *
     * ⚠️ The two new ones look alike: both carry the same square, and only the arrow says
     * which way the Gradido move. So the pairing of destination and direction is what must
     * not slip -- reaching for the wrong one at a counter shows the opposite code. Seeing
     * the arrow means seeing INSIDE the link, which the default stub does not allow.
     */
    it('offers both of the member own codes, each with its own direction', async () => {
      const seeing = createWrapper({
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      })
      // A fresh layout starts on the skeleton, and the skeleton has no sidebar at all --
      // the surrounding beforeEach advanced the clock for the shared wrapper, not for this
      // one. Without this the finds come back empty, which reads like a missing link.
      vi.advanceTimersByTime(1500)
      await nextTick()

      const cases = [
        ['sidebar-my-thank-you-card', '/my-thank-you-card', 'out'],
        ['sidebar-my-gradido-card', '/my-gradido-card', 'in'],
      ]

      for (const [test, href, direction] of cases) {
        const quick = seeing.find(`[data-test="${test}"]`)
        expect(quick.exists()).toBe(true)
        expect(quick.attributes('href')).toBe(href)
        expect(quick.find(`[data-test="quick-code-arrow-${direction}"]`).exists()).toBe(true)
      }

      seeing.unmount()
    })

    /**
     * ⛔ WHERE they sit is the whole point, and nothing else here can see it. Inside the menu
     * column the four tools pushed the menu down by their own height, so it no longer stood
     * level with the account panel opposite -- which is how it had always been. They live in
     * the heading row now, in the space its `offset-lg="2"` was leaving empty anyway.
     *
     * A jsdom test cannot measure a pixel, but it can hold the two apart: the tools in the
     * heading row, the menu alone in its column. (Bernd, 21.08.2026)
     */
    it('keeps the tools out of the menu column, so the menu stays level', () => {
      const row = wrapper.find('.breadcrumb .sidebar-quick-row')
      expect(row.exists()).toBe(true)

      // ⚠️ The COLUMN, not just "somewhere under the breadcrumb". Dropped into the ten-wide
      // column beside it the row would still be under `.breadcrumb` and would sit on top of
      // the page heading. It belongs in the two-wide one the offset used to leave empty --
      // the same width as the menu below it, which is what puts it in the same line.
      // (coderabbit, PR #3781)
      const column = row.element.parentElement
      expect(column.getAttribute('cols')).toBe('2')
      expect(column.getAttribute('class')).toContain('d-lg-block')

      const menuColumn = wrapper.find('.main-sidebar').element.parentElement
      expect(menuColumn.querySelector('.sidebar-quick-row')).toBe(null)
    })

    it('has a main content div', () => {
      expect(wrapper.find('div.main-content').exists()).toBeTruthy()
    })

    it('has a footer inside the main content', () => {
      expect(wrapper.find('div.main-page').find('footer.footer').exists()).toBeTruthy()
    })

    describe('navigation bar', () => {
      describe('logout', () => {
        beforeEach(async () => {
          mockMutateFn.mockResolvedValue({ logout: 'success' })
          await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
          await nextTick()
        })

        it('calls the API', () => {
          expect(mockMutateFn).toHaveBeenCalled()
        })

        it('dispatches logout to store', () => {
          expect(logoutSpy).toHaveBeenCalled()
        })

        it('redirects to login page', () => {
          expect(routerPushSpy).toHaveBeenCalledWith('/login')
        })
      })

      describe('logout fails', () => {
        beforeEach(async () => {
          mockMutateFn.mockRejectedValue(new Error('error'))
          await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
          await nextTick()
        })

        it('dispatches logout to store', () => {
          expect(logoutSpy).toHaveBeenCalled()
        })

        it('redirects to login page', () => {
          expect(routerPushSpy).toHaveBeenCalledWith('/login')
        })

        describe('redirect to login already done', () => {
          beforeEach(async () => {
            await router.push('/login')
            vi.clearAllMocks()
          })

          it('does not call the redirect to login', async () => {
            const routerPushSpy = vi.spyOn(router, 'push')
            await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('logout')
            await nextTick()
            expect(routerPushSpy).not.toHaveBeenCalled()
          })
        })
      })
    })

    describe.skip('set visible method', () => {
      beforeEach(async () => {
        await wrapper.findComponent({ name: 'NavbarNew' }).vm.$emit('set-visible', true)
      })

      it('sets visible to true', () => {
        expect(wrapper.vm.visible).toBe(true)
      })
    })

    describe.skip('admin method', () => {
      const windowLocationMock = vi.fn()
      beforeEach(() => {
        delete window.location
        window.location = { assign: windowLocationMock }
        wrapper.findComponent({ name: 'NavbarNew' }).vm.$emit('admin')
      })

      it('dispatches logout to store', () => {
        expect(store.dispatch).toHaveBeenCalledWith('logout')
      })

      it('changes window location to admin interface', () => {
        expect(windowLocationMock).toHaveBeenCalledWith(
          'http://localhost/admin/authenticate?token=valid-token',
        )
      })
    })
  })
})
