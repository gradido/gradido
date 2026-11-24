// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { AliasFirstChoice } from '@/components/AliasFirstChoice'
import { AvatarZoom } from '@/components/Avatar/AvatarZoom'
import { Breadcrumb } from '@/components/Breadcrumb/breadcrumb'
import { ContentFooter } from '@/components/ContentFooter'
import { EmailConfirmationReminder } from '@/components/EmailConfirmationReminder'
import { EmailConfirmationStrip } from '@/components/EmailConfirmationStrip'
import { EventMatchingHomeInvitation } from '@/components/EventMatchingHomeInvitation'
import { FirstCreation } from '@/components/FirstCreation'
import { Navbar } from '@/components/Menu/Navbar'
import { QuickCodeIcon } from '@/components/Menu/QuickCodeIcon'
import { SettingsSidebar } from '@/components/Menu/SettingsSidebar'
import { Sidebar } from '@/components/Menu/Sidebar'
import { MobileSidebar } from '@/components/MobileSidebar/MobileSidebar'
import { SessionLogoutTimeout } from '@/components/SessionLogoutTimeout'
import { SkeletonOverview } from '@/components/skeleton/Overview'
import { CommunityMember } from '@/components/Template/ContentHeader/CommunityMember'
import { GddAmount } from '@/components/Template/ContentHeader/GddAmount'
import { GdtAmount } from '@/components/Template/ContentHeader/GdtAmount'
import { ContactsPanel } from '@/components/Template/RightSide/ContactsPanel'
import { ContactsStrip } from '@/components/Template/RightSide/ContactsStrip'
import { LastTransactions } from '@/components/Template/RightSide/LastTransactions'
import { PanelSwitch } from '@/components/Template/RightSide/PanelSwitch'
import { useAppBadge } from '@/composables/useAppBadge'
import { startChatUpdates, stopChatUpdates } from '@/composables/useChatUpdates'
import { refreshContactsPanel } from '@/composables/useContactsPanel'
import { ensureFavorites } from '@/composables/useFavorites'
import { ensureKeptPictures, startKeptPictures } from '@/composables/useKeptPictures'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useRightSidePref } from '@/composables/useRightSidePref'
import { supportTicketsActiveNow } from '@/composables/useSupportTicketsMenu'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import CONFIG from '@/config'
import { LAST_TRANSACTIONS_PAGE_SIZE } from '@/constants'
import { logout } from '@/graphql/mutations'
import { transactionsUserCountQuery } from '@/graphql/transactions.graphql'
import { ContentHeader } from '@/layouts/templates/ContentHeader'
import { ContributionsTemplate } from '@/layouts/templates/ContributionsTemplate'
import { MatchingTemplate } from '@/layouts/templates/MatchingTemplate'
import { RightSide } from '@/layouts/templates/RightSide'
import { SupportTemplate } from '@/layouts/templates/SupportTemplate'
import { useWalletStore } from '@/store/useWalletStore'
import { goBackToAdmin, wayBackFor } from '@/utils/adminWayBack'
import { routeSection } from '@/utils/routeSection'
import IMdiCalculator from '~icons/mdi/calculator'
import IMdiQrcodeScan from '~icons/mdi/qrcode-scan'
import './DashboardLayout.css'

/** The rows of the booking query, as the column beside the overview takes them. */
type NewestBookings = NonNullable<InstanceType<typeof LastTransactions>['$props']['transactions']>

export const DashboardLayout = defineComponent({
  name: 'DashboardLayout',
  setup(_props, { expose }) {
    const store = useWalletStore()
    const route = useRoute()
    const { t } = useI18n()
    const { client: apolloClient } = useApolloClient()

    // The member's own pictures of their contacts (AS-023): WHO they are of is read from the device
    // here, in setup, before anything is drawn -- so that the first paint already shows letters where
    // the member's picture is still to come, and never the contact's own face first. The pictures
    // themselves come with one request, asked for here as well, and anew for another member.
    watch(
      () => [store.gradidoID, store.communityUuid],
      ([member, community]) => {
        startKeptPictures(member, community)
        ensureKeptPictures(apolloClient)
      },
      { immediate: true },
    )

    // A route may bring its own head — the map does. Then the navbar, the page
    // heading and the content header are just distance between you and what you came
    // for, at every size. On a phone the map takes the whole screen, so the footer
    // goes too; on desktop it stays, and the menu keeps the logo the navbar took with
    // it. Every other route leaves these empty and is untouched.
    //
    // `bareChrome: 'phone'` is the same wish for the phone only -- the member's own codes. There
    // the code needs the width; on the desk there is room for the code AND the wallet around
    // it, and without navbar, tools and heading the page looked as if it had left the wallet
    // (Bernd, 08.10.2026). So below lg such a route is bare like the others, and from lg on
    // it is an ordinary page: the navbar is back, the heading is the route's `pageTitle`, and
    // the page's own head steps aside (OwnCodeView).
    const bareChrome = computed(() => route.meta.bareChrome === true)
    const barePhone = computed(() => Boolean(route.meta.bareChrome))
    const settingsChrome = computed(() => Boolean(route.meta.settingsChrome))
    /**
     * Which panel the right-hand column carries, straight from the matched route record.
     *
     * ⛔ It used to be looked up by the first path segment, in a table of its own. Two things
     * that costs, and both of them bit:
     *
     * - **Sibling routes cannot differ.** `/matching/karte` declares `bareChrome` because the map
     *   wants the whole canvas, and `/matching/entries` wants the matching panel -- but both are
     *   the section `matching`, so the table had one answer for two routes and the map paid a
     *   quarter of every desktop screen. It says `rightSide: null` now, one line under the
     *   `bareChrome` it belongs with.
     * - **The path had to be parsed at all.** `/overview/` is a path a router really hands over,
     *   and reading it as text got the section wrong; the matched RECORD cannot be wrong about
     *   itself. That class of bug turned up four times in one day in this file family.
     *
     * And a route added later now carries its own answer instead of needing an edit in a file two
     * directories away that its author has no reason to open.
     *
     * ⛔ NOT named `rightSide`. In `<script setup>` the template compiler resolves a tag against
     * the setup bindings by camelizing it, so `<right-side>` finds a binding called `rightSide`
     * BEFORE the imported component -- and renders a boolean instead of the column. Silently.
     * (Written for the .vue file this was; the name stays.)
     */
    const rightSidePanel = computed(() => (route.meta.rightSide as string | undefined) ?? null)

    /**
     * The column with two positions (KF-009).
     *
     * `bookings-or-contacts` is not a panel but a QUESTION the route asks: which of the two
     * shall stand here? The route brings the answer for a first visit (`rightSideDefault`), the
     * member's own answer -- remembered on this device -- wins over it, and the switch above
     * the column is where it is given. ⛔ Not a setting: E-020, and the whole reason it lives
     * where it is used.
     */
    /**
     * Which side of the breakpoint the window is on, so a column is MOUNTED only where it can
     * be seen. Both columns were mounted at every width and one hidden by CSS -- harmless while
     * the hidden twin only rendered, and not once it asks the server.
     *
     * `unknown` (no media query available) mounts both, exactly as before.
     */
    const viewport = useViewport()
    const showDesktopColumn = computed(() => viewport.value !== 'mobile')
    const showMobileColumn = computed(() => viewport.value !== 'desktop')

    const SWITCHABLE_PANEL = 'bookings-or-contacts'
    const PANEL_POSITIONS = ['bookings', 'contacts']
    // What each position renders. The slot is still called `transactions` because that is the
    // panel's name in this column and has been since long before there was anything to switch;
    // `bookings` is what the switch SAYS, which is the member's word for it.
    const POSITION_SLOT: Record<string, string> = { bookings: 'transactions', contacts: 'contacts' }

    // ⛔ Translated here, with the keys written out. The switch is handed finished words: the
    // i18n lint counts only literal keys, so a list of key STRINGS would have both of them
    // reported as unused in ten files -- and the next tidy-up would remove them.
    const panelOptions = computed(() => [
      // ⛔ The VALUE stays `bookings`: it is what `useRightSidePref` has already written to
      // every member's device, and renaming it would silently forget their choice. Only the
      // word changes -- and to a key that already exists in all ten languages, because it is
      // the heading `LastTransactions` used to print for itself.
      // ⛔ Two thirds to one third, not half and half. "Letzte Transaktionen" needs the room
      // and "Kontakte" does not: at equal widths the long word wrapped to two lines -- in
      // German as soon as the active tab turned bold, and in French at any weight. The ratio
      // lives here because it is a fact about these two WORDS, and the switch never sees them.
      { value: 'bookings', label: t('transaction.lastTransactions'), share: 2 },
      { value: 'contacts', label: t('rightSide.contacts'), share: 1 },
    ])

    const isSwitchable = computed(() => rightSidePanel.value === SWITCHABLE_PANEL)

    /**
     * What the remembered choice is filed under.
     *
     * ⛔ The matched record's PATTERN, not `route.path` and not the page title. The send form's
     * path carries a recipient (`/send/<community>/<member>`), so the resolved path would file
     * one answer per person written to; the pattern is one string per route and cannot collide
     * with another route's. And it is the route's own identity rather than a display key, which
     * a later rename of a heading must not be able to reach into somebody's stored choice.
     */
    const rightSideRouteKey = computed(() =>
      isSwitchable.value ? (route.matched[route.matched.length - 1]?.path ?? null) : null,
    )
    const rightSideFallback = computed(
      () => (route.meta.rightSideDefault as string | undefined) ?? PANEL_POSITIONS[0],
    )

    const { choice: panelChoice, choose: choosePanel } = useRightSidePref(
      rightSideRouteKey,
      rightSideFallback,
      PANEL_POSITIONS,
    )

    /**
     * The slot the column actually renders -- one name, wherever it came from.
     *
     * ⛔ NOT named after any tag in this file. `<right-side>`, `<last-transactions>` and
     * `<contacts-panel>` are resolved against the setup bindings by camelizing them, so a
     * binding called `rightSide`, `lastTransactions` or `contactsPanel` would hide the
     * component behind a value -- silently, with the column rendering nothing. It has happened
     * twice in this file; see the note over `rightSidePanel`.
     */
    const activePanelSlot = computed(() => {
      if (!rightSidePanel.value) {
        return null
      }
      if (!isSwitchable.value) {
        return rightSidePanel.value
      }
      // `?? ''` for the types only: no position is named '', so bookings it is, as for null.
      return POSITION_SLOT[panelChoice.value ?? ''] ?? POSITION_SLOT.bookings
    })

    /**
     * What the phone carries above the page, which is a different question from what stands
     * beside it on a desk.
     *
     * ⛔ A route that names its phone panel is answered BEFORE the switch is consulted, and
     * that ordering is the point. The switch is rendered only inside the desktop column
     * (KF-009: the phone has none) while its choice is remembered per device -- so a member who
     * set /send to bookings on a wide window and then narrowed it lost the favourites strip
     * with no control anywhere to bring it back.
     *
     * ⚠️ The fall-through below DOES read the switch, and it is only safe because `MOBILE_CARRIES`
     * and the switch's own slots are disjoint sets. Putting `contacts` on that list would hand
     * the desktop switch straight back to the phone -- name the panel on the route instead.
     *
     * A route that says `rightSideMobile` names the panel the phone gets there; today only the
     * send form does, and it names the contacts (BAU-11) -- a strip of favourites is a shortcut
     * into the field right beneath it, while over the overview or the booking list it would be
     * a shortcut to nowhere.
     *
     * Everything else is carried only if it is on the list below -- an ALLOW-list, not a list
     * of exceptions. Two things follow from that and both were wrong the other way round: the
     * booking list is not on it (`LastTransactions` hides itself below 992px, so mounting it
     * could never show anything -- it only built up to eight base64 pictures for a subtree
     * nobody can see, and below 992px that list IS the page), and the contacts are not on it
     * either, so they reach a phone only where a route names them. A deny-list handed them to
     * every route whose column happened to stand on contacts, which is two routes more than
     * BAU-11 asks for -- and a panel added later would land there by default.
     */
    const MOBILE_CARRIES = ['contributions', 'matching']
    const mobilePanelSlot = computed(() => {
      if (route.meta.rightSideMobile) {
        return route.meta.rightSideMobile as string
      }
      const slot = activePanelSlot.value
      return slot && MOBILE_CARRIES.includes(slot) ? slot : null
    })
    const showMobilePanel = computed(() => Boolean(mobilePanelSlot.value))
    // ⚠️ `d-lg-flex`, not `d-lg-block`: the three places this lands on are rows.
    const chromeHidden = computed(() => {
      if (bareChrome.value) {
        return 'd-none'
      }
      return barePhone.value ? 'd-none d-lg-flex' : ''
    })
    const mobileHidden = computed(() => (barePhone.value ? 'd-none d-lg-block' : ''))
    const bareTopSpace = computed(() => (bareChrome.value ? 'pt-lg-4' : ''))

    /**
     * The sections whose content header shows the balance cards -- the slots of
     * `<ContentHeader>` further down that have something in them. `pageEdge.spec.js` holds the two
     * together.
     */
    const BALANCE_SECTIONS = ['overview', 'send', 'transactions', 'gdt']
    /**
     * The air between the balance cards and the page. The desk always had it (`mt-lg-3`); the
     * phone had not. There the two cards stand one above the other, the second brings its 16px
     * above itself and nothing below, and a page whose first box has no margin of its own ran
     * straight into it: the tile under the community card, the decay row under the GDT
     * card, the first GDT entry (Bernd, 21.09.2026). Only under the cards -- everywhere else
     * the phone keeps the page close under its heading, as it did.
     */
    const contentGap = computed(() =>
      BALANCE_SECTIONS.includes(routeSection(route.path)) ? 'mt-3' : 'mt-0 mt-lg-3',
    )
    /**
     * A route that prints no heading may ask for the heading's place (`contentAtHeading`): the
     * calculator needs the height, and a keypad says what it is without a title over it. The
     * heading's row cannot simply go -- the four tools stand in it, beside where the heading
     * was -- so on the desk the page is lifted by that row's height instead. DashboardLayout.css,
     * `.content-at-heading`. Below lg these routes are bare and nothing is lifted.
     */
    const contentLift = computed(() => (route.meta.contentAtHeading ? 'content-at-heading' : ''))
    const router = useRouter()

    /**
     * What this layout's booking query asks for -- always the same thing: the balance, and the
     * member's newest bookings in the size the column beside the overview reads.
     *
     * ⛔ Not the list the transactions page shows. That page fetches its own (Transactions.vue),
     * with its own page number and, where a contact window sent it there, narrowed to one
     * member. While one query served both, every page turn had to be kept out of the column
     * by hand, and a filter would have had to be kept out of the balance as well.
     */
    const NEWEST_BOOKINGS = {
      currentPage: 1,
      pageSize: LAST_TRANSACTIONS_PAGE_SIZE,
      order: 'DESC',
    }

    const {
      refetch: useRefetchTransactionsQuery,
      onError,
      onResult,
    } = useQuery(transactionsUserCountQuery, NEWEST_BOOKINGS, { fetchPolicy: 'network-only' })
    const { mutate: useLogoutMutation } = useMutation(logout)
    const { toastError } = useAppToast()

    const balance = ref(0)
    // The phone's menu, open or shut: here, where both the drawer (MobileSidebar) and its opener
    // in the navbar can see it -- the opener has to say which one it is.
    const mobileMenuOpen = ref(false)
    /**
     * Bumped every time the query above ANSWERS.
     *
     * ⛔ Not decoration and not a counter of anything anybody reads: it is how the first-creation
     * window can tell a balance fetched AFTER the booking from the one it already had. The
     * number alone cannot say that — a member whose creation was the first thing on the account
     * goes from 0 to 100, but one who already had 100 would go from 100 to 100, and a stale
     * number and a fresh one are then the same value.
     */
    const balanceStamp = ref(0)
    const GdtBalance = ref(0)
    /** The rows the column beside the overview draws from -- the newest, never a paged list. */
    const newestTransactions = ref<NewestBookings>([])
    const skeleton = ref(true)
    const totalUsers = ref<number | null>(null)

    // only error correction, normally skeleton should be visible less than 1500ms
    onMounted(() => {
      // The member's hearts, once per session -- the rows that carry a heart read them from
      // the composable, so no booking query has to ask for them.
      ensureFavorites(apolloClient)
      // The chat's one beat (E-017), for as long as this layout -- the signed-in wallet -- stands:
      // the mark in the menu, and the messages that arrive in an open thread. It stops with the
      // layout, and the store's logout stops it as well.
      startChatUpdates(apolloClient)
      setTimeout(() => {
        skeleton.value = false
      }, 1500)
    })

    onBeforeUnmount(stopChatUpdates)
    // The menu's numbers on the icon of the wallet installed as an app (utils/appBadge).
    useAppBadge(store)

    // The switch of new support requests (K5) is the community's: kept in the store once the beat
    // names it, so that the menu stands right at the next start before the first answer comes.
    watch(supportTicketsActiveNow, (active) => {
      if (active !== null) {
        store.setSupportTicketsActive(active)
      }
    })

    /**
     * Signs the member out. By their own word -- "Abmelden" in a menu, or in the question before a
     * session ends -- unless the session's clock says otherwise (`ranOut`, SessionLogoutTimeout):
     * the time ran out, or could not be extended. The store is told which: only the member's own
     * word takes what they wrote in a conversation and did not send off this device (utils/chatDraft).
     *
     * ⚠️ And whose word it is, taken with the word and not when the store hears of it: the server is
     * asked first, and by the time it has answered another sign-out may have got ahead and cleared
     * the store -- the clock ends the session while "Abmelden" is on its way.
     */
    const logoutUser = async (how?: { ranOut?: boolean }) => {
      const said = { byOwnWord: how?.ranOut !== true, member: store.gradidoID }
      try {
        await useLogoutMutation()
        await store.logout(said)
        await router.push('/login')
      } catch {
        await store.logout(said)
        if (router.currentRoute.value.path !== '/login') {
          await router.push('/login')
        }
      }
    }

    /**
     * A page changed something and wants the numbers up here to catch up: `Send` after a
     * transfer, the transactions page after a link was withdrawn from its summary row.
     *
     * No page number any more. Turning a page is the transactions page's own business now, and
     * this query asks for the newest bookings whatever happens -- so the refetch takes no
     * variables and repeats the ones it was mounted with.
     */
    const updateTransactions = (args: { contactsChanged?: boolean } = {}) => {
      useRefetchTransactionsQuery()?.catch(() => {
        // The failure is reported through onError below; without the catch a network failure
        // would also surface as an unhandled rejection beside the toast.
      })
      // ⚠️ The CALLER says whether a counterparty was involved, and only that refreshes the
      // contacts. Guessing it from the shape of the call was close but not right: `Send`
      // calls this twice, once after a transfer and once after creating a LINK, and a link
      // names nobody -- so every link cost a contact-list round trip whose answer was identical.
      //
      // ⛔ And it is never dropped. With no panel on screen `refreshContactsPanel` marks the
      // list as due instead of fetching, so the next mount asks -- a transfer made while the
      // column stood on bookings used to be lost for the rest of the session.
      if (args.contactsChanged) {
        refreshContactsPanel(apolloClient)
      }
    }

    /**
     * The two pages a member opens to check where they stand.
     *
     * ⛔ The balance in the header is fetched ONCE, when this layout mounts -- and the layout
     * outlives every route change, so nothing brings it up to date on its own. Until now the
     * only thing that refreshed it was a page saying so: `Send` emits `update-transactions`
     * after a transfer. A payment made anywhere ELSE left the old number standing on every
     * screen the member visited afterwards -- and a thank you card payment happens on its own
     * page, at somebody else's till, and says nothing to this layout.
     *
     * ⚠️ Not a cache policy and not a page reload. The query already asks the server
     * (`network-only`); it simply never ran a second time. A reload would have hidden that by
     * throwing the whole application away, which is why it looked like an answer.
     *
     * Which pages: the ones whose route says `refreshBalance` -- declared there, for the reason
     * `rightSidePanel` above gives. Not every route: the contact window's send buttons push
     * /send/<community>/<member>, and a query on every one of those drew nothing.
     */
    watch(
      () => route.path,
      () => {
        // `path` is what changed; the answer is on the route record it changed to.
        if (!route.meta.refreshBalance) {
          return
        }
        useRefetchTransactionsQuery()?.catch(() => {
          // reported through onError below, as in `updateTransactions`
        })
      },
    )

    // The pictures shown beside the newest bookings, fetched once for the column's rows. The
    // transactions page asks for its own rows' pictures the same way (Transactions.vue).
    //
    // Each row carries a date, not a picture. Everything whose date still matches what the
    // wallet already holds needs nothing; on a second visit that is usually all of them, and
    // nothing is requested at all.
    //
    // ⚠️ Forgetting comes FIRST and does not depend on the request succeeding. A member who
    // switched their picture off arrives with no date, and their face has to leave this device
    // whether or not anything else works.
    //
    // Best effort by design: nobody loses their overview over a portrait.
    //
    // ⛔ Staleness is NOT guarded here any more, and that is the point: it is guarded in the
    // store, which is the thing that outlives this component. A counter in `setup()` is one per
    // layout instance, while the pictures are one per module -- so the instance that a logout
    // destroys keeps a counter nobody can ever bump again, and its guard passes by definition.
    // `forgetWithdrawnMemberAvatars` now names the withdrawn members to the store, and
    // `rememberMemberAvatars` refuses exactly those. Everything else in a late answer is kept
    // rather than thrown away: the bytes were paid for, and discarding them shows initials on
    // a list whose portraits had already arrived.
    const collectMemberAvatars = async (rows: NewestBookings) => {
      await fetchMemberAvatars(
        apolloClient,
        rows.map((row) => row.linkedUser),
      )
    }

    onResult((value) => {
      if (value?.data) {
        if (value.data.transactionList) {
          const tr = value.data.transactionList
          GdtBalance.value = tr.balance?.balanceGDT === null ? 0 : Number(tr.balance?.balanceGDT)
          newestTransactions.value = tr.transactions || []
          collectMemberAvatars(newestTransactions.value)
          balance.value = Number(tr.balance?.balance) || 0
          balanceStamp.value += 1
        }
        if (value.data.communityStatistics) {
          totalUsers.value = value.data.communityStatistics.totalUsers || 0
        }
      }
      skeleton.value = false
    })

    onError((error) => {
      toastError(error.message)
    })

    const admin = () => {
      // ⭐ In the window the admin interface opened for a look at the map, "Admin" is the way back:
      // that admin interface is still there behind this window, signed in and where the
      // moderator left it. So the window closes, and nobody is signed out -- the wallet stays
      // signed in as it does when the window is closed by hand (isMapWindowOfAdmin says why this
      // is not done by going there in this window). Anywhere else it goes to the admin interface:
      // to the page a pin, bubble or arrow of it was pressed on where the wallet came from one
      // (the bar "Zurück zum Admin" takes the same way), else to its start (utils/adminWayBack.js).
      goBackToAdmin({
        adminAuthUrl: CONFIG.ADMIN_AUTH_URL,
        token: store.token,
        // adminWayBack.js is untyped, and its default `back = null` reads as "null only".
        back: wayBackFor(store.gradidoID) as null,
        signOut: () => store.logout(undefined), // logout without redirect
      })
    }

    // What the specs read and set on the instance.
    expose({ skeleton, balance, GdtBalance, newestTransactions, updateTransactions })

    // The balance cards over the page, one slot per section (see `BALANCE_SECTIONS`).
    const contentHeader = () => (
      <ContentHeader
        // No props of ContentHeader: they land on its element as attributes, as they did.
        {...({
          balance: balance.value,
          'gdt-balance': GdtBalance.value,
          'total-users': totalUsers.value,
        } as object)}
        v-slots={{
          overview: () => (
            <BRow>
              <BCol cols='12' lg='5'>
                <div>
                  <RouterLink to='/transactions'>
                    {/* The balance is the one account card on the overview, so it
                        stands as the open card does on the transactions page: full
                        colour, green border. It used to be dimmed like the card of
                        the page one is NOT on. No GDD badge here: beside the
                        community tile there is nothing to tell it apart from
                        (Bernd, 04.10.2026). */}
                    <GddAmount balance={balance.value} showStatus={true} badgeShow={false} />
                  </RouterLink>
                </div>
              </BCol>
              <BCol cols='12' lg='7'>
                <div class='h-100 d-flex flex-column'>
                  {/* null until the first answer, as it was handed on before */}
                  <CommunityMember totalUsers={totalUsers.value as number} />
                </div>
              </BCol>
            </BRow>
          ),
          send: () => (
            <BRow>
              <BCol cols='12' lg='6'>
                <div>
                  <GddAmount
                    balance={balance.value}
                    // no prop of GddAmount: an attribute on its element, as it was
                    {...({ badge: true } as object)}
                    showStatus={true}
                    badgeShow={false}
                  />
                </div>
              </BCol>
              <BCol cols='12' lg='6'>
                <div>
                  <RouterLink to='/gdt'>
                    <GdtAmount gdtBalance={GdtBalance.value} badgeShow={false} />
                  </RouterLink>
                </div>
              </BCol>
            </BRow>
          ),
          transactions: () => (
            <BRow>
              <BCol cols='12' lg='6'>
                <div>
                  <GddAmount balance={balance.value} showStatus={true} />
                </div>
              </BCol>
              <BCol cols='12' lg='6'>
                <div>
                  <RouterLink to='/gdt'>
                    <GdtAmount gdtBalance={GdtBalance.value} />
                  </RouterLink>
                </div>
              </BCol>
            </BRow>
          ),
          gdt: () => (
            <BRow>
              <BCol cols='12' lg='6'>
                <div>
                  <RouterLink to='/transactions'>
                    <GddAmount balance={balance.value} showStatus={false} />
                  </RouterLink>
                </div>
              </BCol>
              <BCol cols='12' lg='6'>
                <div>
                  <GdtAmount
                    // no prop of GdtAmount: an attribute on its element, as it was
                    {...({ badge: true } as object)}
                    showStatus={true}
                    gdtBalance={GdtBalance.value}
                  />
                </div>
              </BCol>
            </BRow>
          ),
          settings: () => null,
        }}
      />
    )

    return () => (
      <div class='main-page'>
        {skeleton.value ? (
          <div>
            <SkeletonOverview />
          </div>
        ) : (
          <div class='mx-lg-0'>
            {/* navbar */}
            <BRow class={chromeHidden.value}>
              <BCol>
                <Navbar
                  class='main-navbar'
                  balance={balance.value}
                  menuOpen={mobileMenuOpen.value}
                  onToggle-menu={() => {
                    mobileMenuOpen.value = !mobileMenuOpen.value
                  }}
                />
              </BCol>
            </BRow>
            <MobileSidebar
              open={mobileMenuOpen.value}
              onUpdate:open={(open: boolean) => {
                mobileMenuOpen.value = open
              }}
              onAdmin={admin}
              onLogout={logoutUser}
            />

            {/* Breadcrumb */}
            <BRow class={['breadcrumb', chromeHidden.value]}>
              {/* ⛔ A real column where an `offset-lg="2"` used to be. The four till tools stood
                  INSIDE the menu column below and pushed the whole menu down by their own height,
                  so it no longer stood level with the account panel opposite. Here they take the
                  space the offset was leaving empty anyway: level with the page heading, and the
                  menu is back where it was. (Bernd, 21.08.2026)

                  Below lg the column is gone and the breadcrumb starts at the left, exactly as
                  the offset did -- the phone has its own copy of these tools in the navbar.

                  Small and unmarked on purpose: tools for those who run a till, not headline
                  features. Scan left of the calculator, because scanning is the more general act;
                  two by two like the phone, and the rows mean something -- reading a code above,
                  showing one below. */}
              <BCol cols='2' class='d-none d-lg-block'>
                <div class='sidebar-quick-row'>
                  <RouterLink
                    to='/scan'
                    aria-label={t('navigation.scanner')}
                    data-test='sidebar-scanner'
                  >
                    <IMdiQrcodeScan />
                  </RouterLink>
                  <RouterLink
                    to='/calculator'
                    aria-label={t('navigation.calculator')}
                    data-test='sidebar-calculator'
                  >
                    <IMdiCalculator />
                  </RouterLink>
                  <RouterLink
                    to='/my-thank-you-card'
                    aria-label={t('pageTitle.my-thank-you-card')}
                    data-test='sidebar-my-thank-you-card'
                  >
                    <QuickCodeIcon direction='out' />
                  </RouterLink>
                  <RouterLink
                    to='/my-gradido-card'
                    aria-label={t('pageTitle.my-gradido-card')}
                    data-test='sidebar-my-gradido-card'
                  >
                    <QuickCodeIcon direction='in' />
                  </RouterLink>
                </div>
              </BCol>
              <BCol cols='10'>
                <Breadcrumb />
              </BCol>
            </BRow>

            {/* With the navbar and the heading gone there is nothing left to sit under,
                so the air goes here — on the row, where the menu and the content get it
                together and stay level. The phone gets none: there the map takes the edge. */}
            <BRow
              // no prop of BRow: an attribute on the row, as it was
              {...({ fluid: '' } as object)}
              class={['d-flex', bareTopSpace.value]}
            >
              {/* Sidebar left.
                  ⛔ The settings menu REPLACES the main one here, and only here. MobileSidebar
                  renders the very same `sidebar` component in its drawer -- swap it there as
                  well and somebody on a phone would open the hamburger inside the settings and
                  find the settings again, with no way back into the wallet. The drawer keeps
                  the main menu; on a phone the list at /settings is the settings menu. */}
              {/* ⚠️ Wider while the settings are open: their menu is a row list with a state
                  beside each entry, not the narrow word list of the main menu. */}
              <BCol cols={settingsChrome.value ? 3 : 2} class='d-none d-lg-block'>
                {settingsChrome.value ? (
                  <SettingsSidebar onLogout={logoutUser} />
                ) : (
                  <Sidebar
                    class='main-sidebar'
                    showLogo={bareChrome.value}
                    onAdmin={admin}
                    onLogout={logoutUser}
                  />
                )}
              </BCol>
              {/* ContentHeader && Content */}
              <BCol>
                <BRow class='px-lg-3'>
                  <BCol cols='12'>
                    <BRow class={['d-lg-flex', chromeHidden.value]} cols='12'>
                      {/* ContentHeader */}
                      <BCol>{contentHeader()}</BCol>
                    </BRow>
                  </BCol>
                  {/* Right Side Mobil.
                      ⛔ Its own condition, not the desk twin's. The phone carries two of the three
                      panels; the booking list it does not, because below 992px that list IS the
                      page and a second copy beside it says nothing. Until now this column asked
                      the same question as the desktop one and then rendered an empty block on the
                      overview -- air above the page, for a panel it was never going to show. */}
                  {mobilePanelSlot.value && showMobilePanel.value && showMobileColumn.value ? (
                    <BCol class={barePhone.value ? 'd-none' : 'd-block d-lg-none'}>
                      <RightSide
                        panel={mobilePanelSlot.value}
                        v-slots={{
                          contributions: () => <ContributionsTemplate />,
                          matching: () => <MatchingTemplate />,
                          // The strip, not the column: on a phone this is a row of favourite
                          // faces over the send form, and the full list has its own page behind
                          // the menu (BAU-11). No switch here -- below 992px there is no column
                          // to turn.
                          contacts: () => <ContactsStrip />,
                        }}
                      />
                    </BCol>
                  ) : null}
                  <BCol cols='12'>
                    {/* router-view */}
                    <div class={['main-content', contentGap.value, contentLift.value]}>
                      {/* EM-014: inside the 24 hours the address reminder stands here, at the top of
                          the page and not over it. Where the page begins, so it takes the page's own
                          distance above it -- under the balance cards and under the heading alike --
                          and, on the desk, the calculator's place in the heading's row with it
                          (`contentLift`): a block of its own above this one would be overlapped by
                          the lifted page. Outside the fade, so it does not flicker with each route.
                          ⚠️ The price: on a phone the panel a route puts above its page (the
                          favourites over the send form, the notes over the contributions and the
                          matching) stands above the strip. `chromeHidden` as for the header: where a
                          route takes the whole screen -- the map, the till tools on a phone -- there is
                          no strip either. */}
                      <EmailConfirmationStrip class={chromeHidden.value} />
                      {/* ⚠️ `transition-fade` is no component of the wallet and never was one: the
                          tag was resolved against nothing and stands in the page as an element of
                          that name, with its two attributes. Written out as that element here, so
                          the page keeps the markup it had. */}
                      {h('transition-fade', { duration: 200, mode: 'out-in' }, [
                        <RouterView
                          // What the page inside takes as props and emits: RouterView hands its
                          // attributes on.
                          {...({
                            ref: 'router-view',
                            balance: balance.value,
                            'gdt-balance': GdtBalance.value,
                            onUpdateTransactions: updateTransactions,
                          } as object)}
                        />,
                      ])}
                    </div>
                  </BCol>
                </BRow>
              </BCol>
              {/* RightSide Desktop.
                  ⛔ Only where the route asks for a panel. A column that renders nothing still
                  took a quarter of the screen: together with the menu that left the page six of
                  twelve columns, so the widest screen gave it the least room -- exactly backwards.
                  It showed worst on the business card, where the contact field stands beside the
                  card and had no width left to type in. (Bernd, 24.08.2026: "ausgerechnet beim
                  breiten Bildschirm kann ich das Kontakteingabe-Feld nicht ausfüllen".)

                  The booking list stands beside `/overview` and nowhere else, and that is not
                  merely tidiness: `/my-gradido-card`, `/my-thank-you-card` and `/scan` are pages
                  held out to another person, and the member's last bookings were in their field of
                  view. */}
              {activePanelSlot.value && showDesktopColumn.value ? (
                <BCol cols='3' class='d-none d-lg-block'>
                  <RightSide
                    panel={activePanelSlot.value}
                    v-slots={{
                      // Over the column and inside its container, so it lines up with the panel
                      // beneath it. Only where there are two positions: the contributions and
                      // matching columns have nothing to switch.
                      //
                      // ⛔ No wrapper and no `justify-content-end`. The switch is the column's
                      // heading now -- the panels beneath print none of their own any more -- so it
                      // spans the full width the way the heading did, instead of hiding in the top
                      // right corner as a pair of small buttons.
                      ...(isSwitchable.value
                        ? {
                            head: () => (
                              <PanelSwitch
                                // a string here: `rightSideFallback` always names a position
                                modelValue={panelChoice.value as string}
                                options={panelOptions.value}
                                onUpdate:modelValue={choosePanel}
                              />
                            ),
                          }
                        : {}),
                      // The member's newest bookings, off this layout's own query. The list the
                      // transactions page pages through is that page's own (Transactions.vue) and
                      // never reaches here -- which is what keeps page three, or a list narrowed
                      // to one contact, out of a column that says "last transactions".
                      transactions: () => (
                        <LastTransactions transactions={newestTransactions.value} />
                      ),
                      contributions: () => <ContributionsTemplate />,
                      support: () => <SupportTemplate />,
                      matching: () => <MatchingTemplate />,
                      contacts: () => <ContactsPanel />,
                    }}
                  />
                </BCol>
              ) : null}
            </BRow>
            <BRow class={mobileHidden.value}>
              {/* footer */}
              <BCol>{!route.meta.hideFooter ? <ContentFooter /> : null}</BCol>
            </BRow>
            <SessionLogoutTimeout onLogout={logoutUser} />
            {/* The four windows a member meets on their first logins. Which of them is on
                screen is decided in `useFirstLoginWindow`, not by their order here: two BModals
                stack, and the one underneath is then reachable only by answering the one on top.
                Their order in this template is free (they teleport) and must stay a detail. */}
            <AliasFirstChoice />
            <EmailConfirmationReminder />
            {/* KA-015: who came in by an event link is invited onto the map after the name. */}
            <EventMatchingHomeInvitation />
            {/* ES-002: what good have you already done? The balance comes off this layout's own
                booking query rather than a second one of its own, so the number in the window
                and the number in the header are the same answer. */}
            <FirstCreation
              balance={balance.value}
              balanceStamp={balanceStamp.value}
              onUpdate-transactions={updateTransactions}
            />
            {/* ONE for the whole wallet (AS-018). Every avatar that can be opened drives this
                instance through `useAvatarZoom`; a modal per row would build one per booking. */}
            <AvatarZoom />
          </div>
        )}
      </div>
    )
  },
})
