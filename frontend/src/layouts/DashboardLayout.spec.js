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

  const createWrapper = () => {
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
          Breadcrumb: true,
          ContentHeader: true,
          RightSide: true,
          ContentFooter: true,
          SkeletonOverview: true,
          'fade-transition': true,
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
