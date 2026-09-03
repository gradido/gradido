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
import { forgetViewport } from '@/composables/useViewport'
import { transactionsUserCountQuery } from '@/graphql/transactions.graphql'
import { LAST_TRANSACTIONS_PAGE_SIZE, PAGE_SIZE } from '@/constants'

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

// ⚠️ The zoom composable builds its labels through `i18n.global.t`, because a composable is
// not a setup scope. This file replaces the whole `vue-i18n` module, so `@/i18n` would find
// no `createI18n` to call -- mocked here rather than widened above, so the vue-i18n stub
// keeps saying only what this component asks of it.
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))

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

  // ⚠️ `gradidoID` is what the remembered column choice is filed under, and it is null by
  // default here on purpose: that is the state a layout mounted inside the gap between the
  // token and the login answer is really in, and nothing may be remembered then.
  const createVuexStore = (gradidoID = null) => {
    logoutSpy = vi.fn()
    return createStore({
      state: {
        publisherId: 123,
        firstName: 'User',
        lastName: 'Example',
        token: 'valid-token',
        roles: [],
        gradidoID,
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
  const createWrapper = (stubs = {}, gradidoID = null) => {
    store = createVuexStore(gradidoID)
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

    /**
     * ⛔ The layout takes the panel from the matched record and passes it on, rather than
     * working it out from the path a second time. That is what lets two routes of one section
     * differ -- `/matching/karte` says `rightSide: null` beside its `bareChrome` while
     * `/matching/:tab` says `matching`, which a lookup keyed by the first path segment could
     * not express. ⚠️ That pair cannot be checked here: `MATCHING_ACTIVE` is compiled into the
     * bundle (`process.env.MATCHING_ACTIVE` in config/index.js), and no value is set for the
     * UNIT-TEST run, so those routes are not registered in this file at all. Nothing to do
     * with the servers -- ki-playground carries the flag on. The pair is held in
     * routes.test.js, which loads the table with the flag mocked on.
     */
    it('carries the panel the route named', async () => {
      await router.push('/overview')
      await nextTick()
      expect(wrapper.findComponent({ name: 'RightSide' }).props('panel')).toBe('transactions')

      await router.push('/contributions/contribute')
      await nextTick()
      expect(wrapper.findComponent({ name: 'RightSide' }).props('panel')).toBe('contributions')
    })

    /**
     * The phone carries two of the three panels. On the overview it used to render the column
     * and then nothing inside it -- an empty block's worth of air above the page, for a list
     * that hides itself below 992px anyway. One condition per column now, not one for both.
     */
    it('gives the phone a column only where the phone has a panel', async () => {
      await router.push('/overview')
      await nextTick()
      expect(wrapper.findAllComponents({ name: 'RightSide' })).toHaveLength(1)

      await router.push('/contributions/contribute')
      await nextTick()
      expect(wrapper.findAllComponents({ name: 'RightSide' })).toHaveLength(2)
    })

    it('keeps it on the overview, where the booking list belongs', async () => {
      await router.push('/overview')
      await nextTick()

      expect(wrapper.findComponent({ name: 'RightSide' }).exists()).toBe(true)
    })

    /**
     * ⛔ That the column is THERE, not merely that the route named a panel.
     *
     * In `<script setup>` the template compiler resolves a tag by camelising it against the
     * setup bindings, so a binding called `lastTransactions` wins over the imported
     * `LastTransactions` and the column renders a ref instead of a component -- silently, no
     * warning, no error. This layout lost a whole column to exactly that on 27.08.2026
     * (`rightSide` vs `RightSide`), and it happened a second time while the fix of
     * 30.08.2026 was being written: the new ref that feeds this column was first given the
     * column's own name. Nothing in this file failed. Measured in the compiler output, then
     * held here.
     *
     * ⚠️ With the REAL RightSide, because the default stub renders no slots -- and the column
     * lives in one, so a stubbed panel reports nothing either way.
     */
    it('renders the booking column itself, not only the panel name', async () => {
      await router.push('/overview')
      const withPanel = createWrapper({ RightSide: false })
      withPanel.vm.skeleton = false
      await nextTick()

      const rendered = withPanel.findComponent({ name: 'LastTransactions' }).exists()
      // Down before the assertion — see the note on the page-heading links above.
      withPanel.unmount()

      expect(rendered).toBe(true)
    })

    /**
     * ⛔ Since 27.08.2026 the same applies wherever the column has nothing to say -- and the
     * code pages are why it matters rather than merely tidies: they are held out to another
     * person, who was reading the member's last bookings beside the code. On /transactions
     * the column repeated the page it stands beside.
     */
    it.each(['/my-gradido-card', '/my-thank-you-card', '/scan', '/calculator'])(
      'drops it at %s as well',
      async (path) => {
        await router.push(path)
        await nextTick()

        expect(wrapper.findComponent({ name: 'RightSide' }).exists()).toBe(false)
      },
    )

    /**
     * KF-009. The column now has two positions on three routes, and which one it starts on
     * is the route's own answer -- the overview opens on bookings because that is the page
     * one opens to see where one stands; the send form and the booking list open on
     * contacts, because beside them the bookings would be the page repeated.
     */
    describe('the switch over the column (KF-009)', () => {
      const KEY = (path) => `right-side:member-1:${path}`

      afterEach(() => {
        window.localStorage.clear()
      })

      it.each([
        ['/overview', 'transactions'],
        ['/transactions', 'contacts'],
        ['/send', 'contacts'],
      ])('starts %s on the position that route named', async (path, panel) => {
        await router.push(path)
        await nextTick()

        expect(wrapper.findComponent({ name: 'RightSide' }).props('panel')).toBe(panel)
      })

      /**
       * ⛔ That the panel is THERE, not merely that the route named it -- the same guard the
       * booking column carries two tests above, and for the same reason: a setup binding
       * named like a tag hides the component silently, and this file has lost a column to
       * that twice. Measured in the compiler output as well; held here.
       *
       * ⚠️ With the REAL RightSide, because a default stub renders no slots and the panel
       * lives in one.
       */
      it('renders the contacts panel itself, not only its name', async () => {
        await router.push('/transactions')
        const withPanel = createWrapper({ RightSide: false, ContactsPanel: true })
        withPanel.vm.skeleton = false
        await nextTick()

        const rendered = withPanel.findComponent({ name: 'ContactsPanel' }).exists()
        withPanel.unmount()

        expect(rendered).toBe(true)
      })

      it('renders the switch itself over a column that has two positions', async () => {
        await router.push('/overview')
        const withPanel = createWrapper({ RightSide: false, ContactsPanel: true })
        withPanel.vm.skeleton = false
        await nextTick()

        const rendered = withPanel.findComponent({ name: 'PanelSwitch' }).exists()
        withPanel.unmount()

        expect(rendered).toBe(true)
      })

      // The contributions column has nothing to switch, so it gets no switch.
      it('gives no switch to a column with one position', async () => {
        await router.push('/contributions/contribute')
        const withPanel = createWrapper({ RightSide: false })
        withPanel.vm.skeleton = false
        await nextTick()

        const rendered = withPanel.findComponent({ name: 'PanelSwitch' }).exists()
        withPanel.unmount()

        expect(rendered).toBe(false)
      })

      it('lets a remembered choice beat the route default', async () => {
        window.localStorage.setItem(KEY('/overview'), 'contacts')
        await router.push('/overview')
        const remembered = createWrapper({}, 'member-1')
        remembered.vm.skeleton = false
        await nextTick()

        const panel = remembered.findComponent({ name: 'RightSide' }).props('panel')
        remembered.unmount()

        expect(panel).toBe('contacts')
      })

      /**
       * ⛔ One answer per route, not one for the column. Somebody who wants bookings beside
       * the overview and contacts beside the send form is expressing two wishes.
       */
      it('remembers each route on its own', async () => {
        // Both flipped AWAY from their own default, in opposite directions -- so a single
        // shared key could not produce this pair of answers.
        window.localStorage.setItem(KEY('/transactions'), 'bookings')
        window.localStorage.setItem(KEY('/overview'), 'contacts')
        await router.push('/transactions')
        const remembered = createWrapper({}, 'member-1')
        remembered.vm.skeleton = false
        await nextTick()
        const onTransactions = remembered.findComponent({ name: 'RightSide' }).props('panel')

        await router.push('/overview')
        await nextTick()
        const onOverview = remembered.findComponent({ name: 'RightSide' }).props('panel')
        remembered.unmount()

        expect(onTransactions).toBe('transactions')
        expect(onOverview).toBe('contacts')
      })

      /**
       * ⛔ Nothing is remembered without a member. The id is null before the login answer
       * arrives and again after signing out, and one shared key would hand the next person
       * on a shared device the previous one's column.
       */
      it('remembers nothing while nobody is named', async () => {
        window.localStorage.setItem(KEY('/overview'), 'contacts')
        await router.push('/overview')
        await nextTick()

        expect(wrapper.findComponent({ name: 'RightSide' }).props('panel')).toBe('transactions')
        expect(window.localStorage.getItem('right-side:null:/overview')).toBeNull()
      })

      /**
       * ⛔ The WIRING, which nothing else here covers: the switch emitting and the layout
       * acting on it are two halves, each tested on its own, and a missing
       * `@update:model-value` would leave both green while the switch did nothing at all.
       * ⚠️ With the real PanelSwitch, because a stub emits nothing.
       */
      it('turns the column when the switch is used, and remembers it', async () => {
        await router.push('/overview')
        const withPanel = createWrapper({ RightSide: false, ContactsPanel: true }, 'member-1')
        withPanel.vm.skeleton = false
        await nextTick()
        expect(withPanel.findComponent({ name: 'RightSide' }).props('panel')).toBe('transactions')

        await withPanel.find('[data-test="panel-switch-contacts"]').trigger('click')
        await nextTick()

        const panel = withPanel.findComponent({ name: 'RightSide' }).props('panel')
        withPanel.unmount()

        expect(panel).toBe('contacts')
        expect(window.localStorage.getItem(KEY('/overview'))).toBe('contacts')
      })

      /**
       * ⛔ Two components, not one with a posture prop. The strip was the column minus its
       * column-only parts, and a state the column handles therefore had no counterpart
       * there: a member with contacts and no hearts got an empty box over the send form.
       * Each posture declares its own states now, so which one the layout hands to which
       * column is the thing worth holding.
       */
      it('gives the phone the strip and the desk the column', async () => {
        await router.push('/send')
        const withPanel = createWrapper(
          { RightSide: false, ContactsPanel: true, ContactsStrip: true },
          'member-1',
        )
        withPanel.vm.skeleton = false
        await nextTick()

        const strips = withPanel.findAllComponents({ name: 'ContactsStrip' }).length
        const columns = withPanel.findAllComponents({ name: 'ContactsPanel' }).length
        withPanel.unmount()

        expect({ strips, columns }).toEqual({ strips: 1, columns: 1 })
      })

      /**
       * ⛔ A column is MOUNTED only where it can be seen. Both were mounted at every width
       * with one hidden by CSS -- tolerable while the hidden twin only rendered, and not
       * once it asks the server: a phone paid a contactList request and a portrait fetch
       * for a subtree behind `display:none`.
       *
       * ⚠️ jsdom has no `matchMedia`, so the composable answers `unknown` and both columns
       * mount, exactly as before -- which is what every other test in this file assumes.
       * Here the query is stubbed so the real answer can be measured.
       */
      it.each([
        ['desktop', true, { strips: 0, columns: 1 }],
        ['a phone', false, { strips: 1, columns: 0 }],
      ])('mounts one column on %s, not both', async (unused, matches, expected) => {
        vi.stubGlobal('matchMedia', () => ({ matches, addEventListener: vi.fn() }))
        forgetViewport()
        await router.push('/send')
        const withPanel = createWrapper(
          { RightSide: false, ContactsPanel: true, ContactsStrip: true },
          'member-1',
        )
        withPanel.vm.skeleton = false
        await nextTick()

        const counted = {
          strips: withPanel.findAllComponents({ name: 'ContactsStrip' }).length,
          columns: withPanel.findAllComponents({ name: 'ContactsPanel' }).length,
        }
        withPanel.unmount()
        vi.unstubAllGlobals()
        forgetViewport()

        expect(counted).toEqual(expected)
      })

      /**
       * ⛔ The phone keeps its strip whatever the switch says. The switch is rendered only
       * in the desktop column, so a member who set /send to bookings on a wide window and
       * then narrowed it lost the strip with no control anywhere to bring it back.
       */
      it('keeps the phone strip when the switch stands on bookings', async () => {
        window.localStorage.setItem(KEY('/send/:communityIdentifier?/:userIdentifier?'), 'bookings')
        vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn() }))
        forgetViewport()
        await router.push('/send')
        const onPhone = createWrapper(
          { RightSide: false, ContactsPanel: true, ContactsStrip: true },
          'member-1',
        )
        onPhone.vm.skeleton = false
        await nextTick()

        const strips = onPhone.findAllComponents({ name: 'ContactsStrip' }).length
        onPhone.unmount()
        vi.unstubAllGlobals()
        forgetViewport()

        expect(strips).toBe(1)
      })

      /**
       * BAU-11: the phone carries the strip over the send form and nowhere else. Two columns
       * mean the mobile one is mounted as well -- it is hidden by CSS, not by `v-if`.
       */
      it.each([
        ['/send', 2],
        ['/transactions', 1],
        ['/overview', 1],
      ])('gives the phone a column at %s only where it has one', async (path, columns) => {
        await router.push(path)
        await nextTick()

        expect(wrapper.findAllComponents({ name: 'RightSide' })).toHaveLength(columns)
      })
    })

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
     * ⛔ The fourth copy of "which page is this?" in this file family, and it carried the
     * same blind spot as the other three: `/overview/` is not `/overview` to `includes`, and
     * a router really hands that path over. Header and column read it correctly since the
     * section fix; this line would have left the balance beside them at whatever it was when
     * the layout mounted.
     */
    it.each(['/overview/', '/transactions/'])('asks again at %s as well', async (path) => {
      await router.push('/send')
      mockRefetchFn.mockClear()

      await router.push(path)
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledTimes(1)
    })

    it('still asks nowhere else', async () => {
      await router.push('/overview')
      mockRefetchFn.mockClear()

      await router.push('/calculator')
      await nextTick()

      expect(mockRefetchFn).not.toHaveBeenCalled()
    })

    /**
     * ⛔ With the SECTION's own variables, not with none.
     *
     * This test asserted the opposite until 30.08.2026 -- `toHaveBeenCalledWith()`, defended
     * as "the same question again, rather than resetting the paging". The defence was wrong
     * about its own mechanism: the watch fires on a PATH change, and turning a page does not
     * change the path, so it never protected anybody sitting on page three. What the empty
     * refetch did instead was carry the last page turned OUT of the list and into whatever
     * the member opened next.
     */
    it('asks for the first page of the section it is going to', async () => {
      await router.push('/settings')
      mockRefetchFn.mockClear()

      await router.push('/transactions')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledWith({
        currentPage: 1,
        pageSize: PAGE_SIZE,
        order: 'DESC',
      })
    })

    // The other section asks in the column's size, not the list's -- the overview shows
    // eight bookings and has no business fetching a full page for them.
    it('asks the overview in the size its column reads', async () => {
      await router.push('/settings')
      mockRefetchFn.mockClear()

      await router.push('/overview')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledWith({
        currentPage: 1,
        pageSize: LAST_TRANSACTIONS_PAGE_SIZE,
        order: 'DESC',
      })
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

  /**
   * The bug Bernd reported on 30.08.2026, in both the halves he described.
   *
   * One query serves two readers who want different things from it, and the page number used
   * to stay on it after a paginator click. So the overview's column opened on page three of
   * the member's bookings and called them the newest, and coming back to the list showed page
   * three under a paginator that had been rebuilt at one -- with the buttons back to page one
   * disabled, because as far as it knew it was already there.
   */
  describe('after the member has turned a page', () => {
    const listPage = (rows) => ({
      data: {
        transactionList: {
          balance: { balanceGDT: '0', count: 40, linkCount: 0, balance: '0' },
          transactions: rows,
        },
      },
    })

    beforeEach(async () => {
      await router.push('/transactions')
      onResultHandler(listPage(['newest']))
      await wrapper.vm.updateTransactions({ currentPage: 2, pageSize: PAGE_SIZE })
      await nextTick()
    })

    it('starts the overview at the newest bookings again', async () => {
      mockRefetchFn.mockClear()

      await router.push('/overview')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledWith({
        currentPage: 1,
        pageSize: LAST_TRANSACTIONS_PAGE_SIZE,
        order: 'DESC',
      })
    })

    it('starts the list at page one when the member comes back to it', async () => {
      await router.push('/overview')
      mockRefetchFn.mockClear()

      await router.push('/transactions')
      await nextTick()

      expect(mockRefetchFn).toHaveBeenCalledWith({
        currentPage: 1,
        pageSize: PAGE_SIZE,
        order: 'DESC',
      })
      // And what the list is handed, so the paginator below it starts where the rows do.
      expect(wrapper.vm.listPage).toBe(1)
    })

    /**
     * ⛔ And the column holds its own rows, so the page the list is on does not reach it
     * while the refetch after a navigation is still out. Feeding it the paged list was the
     * coupling; asking for page one on arrival only shortened how long the wrong rows
     * showed.
     *
     * ⚠️ The obvious hole -- a page-three answer landing after the navigation has set the
     * page back to one -- is closed by Apollo rather than by this code; the ref's own note
     * says where and quotes the line.
     */
    it('keeps the column on the newest bookings while the list is elsewhere', async () => {
      onResultHandler(listPage(['older']))
      await nextTick()

      expect(wrapper.vm.transactions).toEqual(['older'])
      expect(wrapper.vm.newestTransactions).toEqual(['newest'])
    })
  })

  /**
   * ⛔ That the page number REACHES the page inside the router-view. Everything else about
   * this fix can be right and the member still sees the old defect if this one binding is
   * missing: Transactions.vue would fall back to its prop default of 1 for ever, and the
   * paginator would sit at one under whatever rows arrived.
   *
   * The review of 30.08.2026 found it by deleting the binding -- all 71 tests stayed green.
   */
  it('hands the page it holds to the page inside the router-view', async () => {
    // A fresh layout starts on the skeleton, and the skeleton renders no router-view at all.
    wrapper.vm.skeleton = false
    await router.push('/transactions')
    await wrapper.vm.updateTransactions({ currentPage: 4, pageSize: PAGE_SIZE })
    await nextTick()

    // ⚠️ Read as an attribute: RouterView is stubbed here and the stub declares no props of
    // its own, so everything handed to it arrives as a string.
    expect(wrapper.find('router-view-stub').attributes('list-page')).toBe('4')
  })

  /**
   * ⛔ The member who reloads on their bookings, or opens a bookmark to them, makes no
   * navigation at all -- so the watch above never fires and this one call is everything they
   * get. It used to ask for ten rows while the paginator divided by twenty-five, which put
   * bookings 11 to 25 on no page anybody could click.
   */
  it('asks for a full page when the member arrives on the transactions directly', async () => {
    await router.push('/transactions')
    useQuery.mockClear()

    const onTransactions = createWrapper()
    const asked = useQuery.mock.calls.find(([query]) => query === transactionsUserCountQuery)
    // Down before the assertion — a second layout that outlives a failing test keeps
    // listening and counts the other tests' route changes a second time.
    onTransactions.unmount()

    expect(asked[1]).toEqual({ currentPage: 1, pageSize: PAGE_SIZE, order: 'DESC' })
  })

  /**
   * ⛔ `updateTransactions({})` is what `Send` calls after a transfer -- no page, no size.
   * Before the defaults were added it reached Apollo as two `undefined` variables and the
   * SERVER decided the page. Dropping the defaults again leaves every other test green.
   */
  it('reads a transfer as page one, when the page that asks names nothing', async () => {
    mockRefetchFn.mockClear()

    await wrapper.vm.updateTransactions({})
    await nextTick()

    expect(mockRefetchFn).toHaveBeenCalledWith({
      currentPage: 1,
      pageSize: PAGE_SIZE,
      order: 'DESC',
    })
    expect(wrapper.vm.listPage).toBe(1)
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
