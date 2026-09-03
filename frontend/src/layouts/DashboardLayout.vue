<template>
  <div class="main-page">
    <div v-if="skeleton">
      <skeleton-overview />
    </div>
    <div v-else class="mx-lg-0">
      <!-- navbar -->
      <BRow :class="chromeHidden">
        <BCol>
          <navbar class="main-navbar" :balance="balance"></navbar>
        </BCol>
      </BRow>
      <mobile-sidebar @admin="admin" @logout="logoutUser" />

      <!-- Breadcrumb -->
      <BRow class="breadcrumb" :class="chromeHidden">
        <!-- ⛔ A real column where an `offset-lg="2"` used to be. The four till tools stood
             INSIDE the menu column below and pushed the whole menu down by their own height,
             so it no longer stood level with the account panel opposite. Here they take the
             space the offset was leaving empty anyway: level with the page heading, and the
             menu is back where it was. (Bernd, 21.08.2026)

             Below lg the column is gone and the breadcrumb starts at the left, exactly as
             the offset did -- the phone has its own copy of these tools in the navbar.

             Small and unmarked on purpose: tools for those who run a till, not headline
             features. Scan left of the calculator, because scanning is the more general act;
             two by two like the phone, and the rows mean something -- reading a code above,
             showing one below. -->
        <BCol cols="2" class="d-none d-lg-block">
          <div class="sidebar-quick-row">
            <router-link
              to="/scan"
              :aria-label="$t('navigation.scanner')"
              data-test="sidebar-scanner"
            >
              <i-mdi-qrcode-scan />
            </router-link>
            <router-link
              to="/calculator"
              :aria-label="$t('navigation.calculator')"
              data-test="sidebar-calculator"
            >
              <i-mdi-calculator />
            </router-link>
            <router-link
              to="/my-thank-you-card"
              :aria-label="$t('pageTitle.my-thank-you-card')"
              data-test="sidebar-my-thank-you-card"
            >
              <quick-code-icon direction="out" />
            </router-link>
            <router-link
              to="/my-gradido-card"
              :aria-label="$t('pageTitle.my-gradido-card')"
              data-test="sidebar-my-gradido-card"
            >
              <quick-code-icon direction="in" />
            </router-link>
          </div>
        </BCol>
        <BCol cols="10">
          <breadcrumb />
        </BCol>
      </BRow>

      <!-- With the navbar and the heading gone there is nothing left to sit under,
           so the air goes here — on the row, where the menu and the content get it
           together and stay level. The phone gets none: there the map takes the edge. -->
      <BRow fluid class="d-flex" :class="bareTopSpace">
        <!-- Sidebar left.
             ⛔ The settings menu REPLACES the main one here, and only here. MobileSidebar
             renders the very same `sidebar` component in its drawer -- swap it there as
             well and somebody on a phone would open the hamburger inside the settings and
             find the settings again, with no way back into the wallet. The drawer keeps
             the main menu; on a phone the list at /settings is the settings menu. -->
        <!-- ⚠️ Wider while the settings are open: their menu is a row list with a state
             beside each entry, not the narrow word list of the main menu. -->
        <BCol :cols="settingsChrome ? 3 : 2" class="d-none d-lg-block">
          <settings-sidebar v-if="settingsChrome" @logout="logoutUser" />
          <sidebar
            v-else
            class="main-sidebar"
            :show-logo="bareChrome"
            @admin="admin"
            @logout="logoutUser"
          />
        </BCol>
        <!-- ContentHeader && Content -->
        <BCol>
          <BRow class="px-lg-3">
            <BCol cols="12">
              <BRow class="d-lg-flex" cols="12" :class="chromeHidden">
                <!-- ContentHeader -->
                <BCol>
                  <content-header
                    :balance="balance"
                    :gdt-balance="GdtBalance"
                    :total-users="totalUsers"
                  >
                    <template #overview>
                      <BRow>
                        <BCol cols="12" lg="5">
                          <div>
                            <router-link to="/transactions">
                              <gdd-amount
                                :balance="balance"
                                :show-status="false"
                                :badge-show="false"
                              />
                            </router-link>
                          </div>
                        </BCol>
                        <BCol cols="12" lg="7">
                          <div>
                            <community-member :total-users="totalUsers" />
                          </div>
                        </BCol>
                      </BRow>
                    </template>
                    <template #send>
                      <BRow>
                        <BCol cols="12" lg="6">
                          <div>
                            <gdd-amount
                              :balance="balance"
                              :badge="true"
                              :show-status="true"
                              :badge-show="false"
                            />
                          </div>
                        </BCol>
                        <BCol cols="12" lg="6">
                          <div>
                            <router-link to="/gdt">
                              <gdt-amount :gdt-balance="GdtBalance" :badge-show="false" />
                            </router-link>
                          </div>
                        </BCol>
                      </BRow>
                    </template>
                    <template #transactions>
                      <BRow>
                        <BCol cols="12" lg="6">
                          <div>
                            <gdd-amount :balance="balance" :show-status="true" />
                          </div>
                        </BCol>
                        <BCol cols="12" lg="6">
                          <div>
                            <router-link to="/gdt">
                              <gdt-amount :gdt-balance="GdtBalance" />
                            </router-link>
                          </div>
                        </BCol>
                      </BRow>
                    </template>
                    <template #gdt>
                      <BRow>
                        <BCol cols="12" lg="6">
                          <div>
                            <router-link to="/transactions">
                              <gdd-amount :balance="balance" :show-status="false" />
                            </router-link>
                          </div>
                        </BCol>
                        <BCol cols="12" lg="6">
                          <div>
                            <gdt-amount
                              :badge="true"
                              :show-status="true"
                              :gdt-balance="GdtBalance"
                            />
                          </div>
                        </BCol>
                      </BRow>
                    </template>
                    <template #settings></template>
                  </content-header>
                </BCol>
              </BRow>
            </BCol>
            <!-- Right Side Mobil.
                 ⛔ Its own condition, not the desk twin's. The phone carries two of the three
                 panels; the booking list it does not, because below 992px that list IS the
                 page and a second copy beside it says nothing. Until now this column asked
                 the same question as the desktop one and then rendered an empty block on the
                 overview -- air above the page, for a panel it was never going to show. -->
            <BCol
              v-if="showMobilePanel && showMobileColumn"
              :class="bareChrome ? 'd-none' : 'd-block d-lg-none'"
            >
              <right-side :panel="mobilePanelSlot">
                <template #contributions>
                  <contributions-template />
                </template>
                <template #matching>
                  <matching-template />
                </template>
                <!-- The strip, not the column: on a phone this is a row of favourite faces
                     over the send form, and the full list has its own page behind the menu
                     (BAU-11). No switch here -- below 992px there is no column to turn. -->
                <template #contacts>
                  <contacts-strip />
                </template>
              </right-side>
            </BCol>
            <BCol cols="12">
              <!-- router-view -->
              <div class="main-content mt-lg-3 mt-0">
                <transition-fade :duration="200" mode="out-in">
                  <router-view
                    ref="router-view"
                    :balance="balance"
                    :gdt-balance="GdtBalance"
                    :transactions="transactions"
                    :list-page="listPage"
                    :transaction-count="transactionCount"
                    :transaction-link-count="transactionLinkCount"
                    :open-link-count="openLinkCount"
                    :pending="pending"
                    @update-transactions="updateTransactions"
                  ></router-view>
                </transition-fade>
              </div>
            </BCol>
          </BRow>
        </BCol>
        <!-- RightSide Desktop.
             ⛔ Only where the route asks for a panel. A column that renders nothing still
             took a quarter of the screen: together with the menu that left the page six of
             twelve columns, so the widest screen gave it the least room -- exactly backwards.
             It showed worst on the business card, where the contact field stands beside the
             card and had no width left to type in. (Bernd, 24.08.2026: "ausgerechnet beim
             breiten Bildschirm kann ich das Kontakteingabe-Feld nicht ausfüllen".)

             The booking list stands beside `/overview` and nowhere else, and that is not
             merely tidiness: `/my-gradido-card`, `/my-thank-you-card` and `/scan` are pages
             held out to another person, and the member's last bookings were in their field of
             view. -->
        <BCol v-if="activePanelSlot && showDesktopColumn" cols="3" class="d-none d-lg-block">
          <right-side :panel="activePanelSlot">
            <!-- Over the column and inside its container, so it lines up with the panel
                 beneath it. Only where there are two positions: the contributions and
                 matching columns have nothing to switch.

                 ⛔ No wrapper and no `justify-content-end`. The switch is the column's
                 heading now -- the panels beneath print none of their own any more -- so it
                 spans the full width the way the heading did, instead of hiding in the top
                 right corner as a pair of small buttons. -->
            <template v-if="isSwitchable" #head>
              <panel-switch
                :model-value="panelChoice"
                :options="panelOptions"
                @update:model-value="choosePanel"
              />
            </template>
            <template #transactions>
              <!-- ⛔ `newestTransactions`, NOT the list the transactions page pages through.
                   The column shows the member's newest bookings; feeding it the paged list
                   put page three beside the overview. -->
              <last-transactions
                :transactions="newestTransactions"
                :transaction-count="transactionCount"
                :transaction-link-count="transactionLinkCount"
              />
            </template>
            <template #contributions>
              <contributions-template />
            </template>
            <template #matching>
              <matching-template />
            </template>
            <template #contacts>
              <contacts-panel />
            </template>
          </right-side>
        </BCol>
      </BRow>
      <BRow :class="mobileHidden">
        <!-- footer -->
        <BCol>
          <content-footer v-if="!$route.meta.hideFooter" />
        </BCol>
      </BRow>
      <session-logout-timeout @logout="logoutUser" />
      <alias-first-choice />
      <email-confirmation-reminder />
      <!-- ONE for the whole wallet (AS-018). Every avatar that can be opened drives this
           instance through `useAvatarZoom`; a modal per row would build one per booking. -->
      <avatar-zoom />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApolloClient, useQuery, useMutation } from '@vue/apollo-composable'
import ContentHeader from '@/layouts/templates/ContentHeader'
import ContributionsTemplate from '@/layouts/templates/ContributionsTemplate'
import MatchingTemplate from '@/layouts/templates/MatchingTemplate'
import Breadcrumb from '@/components/Breadcrumb/breadcrumb'
import RightSide from '@/layouts/templates/RightSide'
import SkeletonOverview from '@/components/skeleton/Overview'
import Navbar from '@/components/Menu/Navbar'
import QuickCodeIcon from '@/components/Menu/QuickCodeIcon'
import Sidebar from '@/components/Menu/Sidebar'
import MobileSidebar from '@/components/MobileSidebar/MobileSidebar'
import SettingsSidebar from '@/components/Menu/SettingsSidebar.vue'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout'
import AliasFirstChoice from '@/components/AliasFirstChoice'
import AvatarZoom from '@/components/Avatar/AvatarZoom.vue'
import EmailConfirmationReminder from '@/components/EmailConfirmationReminder'
import ContentFooter from '@/components/ContentFooter'
import GddAmount from '@/components/Template/ContentHeader/GddAmount'
import GdtAmount from '@/components/Template/ContentHeader/GdtAmount'
import CommunityMember from '@/components/Template/ContentHeader/CommunityMember'
import LastTransactions from '@/components/Template/RightSide/LastTransactions'
import ContactsPanel from '@/components/Template/RightSide/ContactsPanel.vue'
import ContactsStrip from '@/components/Template/RightSide/ContactsStrip.vue'
import PanelSwitch from '@/components/Template/RightSide/PanelSwitch.vue'
import { transactionsUserCountQuery } from '@/graphql/transactions.graphql'
import { logout } from '@/graphql/mutations'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { ensureFavorites } from '@/composables/useFavorites'
import { refreshContactsPanel } from '@/composables/useContactsPanel'
import { useRightSidePref } from '@/composables/useRightSidePref'
import { useViewport } from '@/composables/useViewport'
import CONFIG from '@/config'
import { LAST_TRANSACTIONS_PAGE_SIZE, PAGE_SIZE } from '@/constants'
import { useAppToast } from '@/composables/useToast'

const store = useStore()
const route = useRoute()
const { t } = useI18n()
const { client: apolloClient } = useApolloClient()

// A route may bring its own head — the map does. Then the navbar, the page
// heading and the content header are just distance between you and what you came
// for, at every size. On a phone the map takes the whole screen, so the footer
// goes too; on desktop it stays, and the menu keeps the logo the navbar took with
// it. Every other route leaves these empty and is untouched.
const bareChrome = computed(() => Boolean(route.meta.bareChrome))
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
 */
const rightSidePanel = computed(() => route.meta.rightSide ?? null)

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
const POSITION_SLOT = { bookings: 'transactions', contacts: 'contacts' }
// ⛔ Translated here, with the keys written out. The switch is handed finished words: the
// i18n lint counts only literal keys, so a list of key STRINGS would have both of them
// reported as unused in ten files -- and the next tidy-up would remove them.
const panelOptions = computed(() => [
  // ⛔ The VALUE stays `bookings`: it is what `useRightSidePref` has already written to
  // every member's device, and renaming it would silently forget their choice. Only the
  // word changes -- and to a key that already exists in all ten languages, because it is
  // the heading `LastTransactions` used to print for itself.
  { value: 'bookings', label: t('transaction.lastTransactions') },
  { value: 'contacts', label: t('rightSide.contacts') },
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
const rightSideFallback = computed(() => route.meta.rightSideDefault ?? PANEL_POSITIONS[0])

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
  if (!rightSidePanel.value) return null
  if (!isSwitchable.value) return rightSidePanel.value
  return POSITION_SLOT[panelChoice.value] ?? POSITION_SLOT.bookings
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
  if (route.meta.rightSideMobile) return route.meta.rightSideMobile
  const slot = activePanelSlot.value
  return slot && MOBILE_CARRIES.includes(slot) ? slot : null
})
const showMobilePanel = computed(() => Boolean(mobilePanelSlot.value))
const chromeHidden = computed(() => (bareChrome.value ? 'd-none' : ''))
const mobileHidden = computed(() => (bareChrome.value ? 'd-none d-lg-block' : ''))
const bareTopSpace = computed(() => (bareChrome.value ? 'pt-lg-4' : ''))
const router = useRouter()

/**
 * What the ONE booking query asks for: the newest page, in the size the open route names.
 *
 * A page number only ever comes from a paginator click within one visit
 * (`updateTransactions` below); it can no longer survive a navigation, which is the fix the
 * route watch further down explains in full.
 *
 * ⛔ `route.meta.transactionsPageSize`, and NOT a table in here keyed by the first path
 * segment. That is the same lookup `rightSidePanel` above was rewritten away from three days
 * ago, for two reasons that apply word for word: sibling routes could not differ, and the
 * path had to be parsed to find the answer at all. A route that shows bookings now says so
 * where it is declared; routes without the line ask for nothing -- this answers `null` and
 * the watch leaves them alone.
 */
const listVariables = (pageSize) =>
  pageSize === undefined ? null : { currentPage: 1, pageSize, order: 'DESC' }

const {
  refetch: useRefetchTransactionsQuery,
  onError,
  onResult,
} = useQuery(
  transactionsUserCountQuery,
  // Read from the route this layout STARTS on, not a fixed size. The watch below fires on a
  // navigation, and a member who reloads on /transactions or opens a bookmark to it never
  // makes one -- for them this call is the only one there is. Every other route falls back to
  // the column's size, which is what the header needs and the cheaper of the two.
  listVariables(route.meta.transactionsPageSize) ?? listVariables(LAST_TRANSACTIONS_PAGE_SIZE),
  { fetchPolicy: 'network-only' },
)
const { mutate: useLogoutMutation } = useMutation(logout)
const { toastError } = useAppToast()

const balance = ref(0)
const GdtBalance = ref(0)
const transactions = ref([])

/**
 * The page of `transactions` currently loaded, and the rows the column beside the overview
 * draws from.
 *
 * Two refs rather than one, because the column and the list want different things from the
 * same query: the list wants the page that was asked for, the column wants the newest
 * bookings and nothing else. `newestTransactions` is therefore only written when the answer
 * that arrived belongs to page one -- so the paged list does not reach the column even for
 * the moment between a navigation and its refetch, which is what a member on a slow
 * connection would have seen.
 *
 * ⚠️ `listPage` is what was ASKED FOR, and an answer is attributed to whatever it says when
 * that answer arrives -- Apollo hands `onResult` no variables to check it against. That reads
 * like a race (turn a page, leave for the overview, the page-three answer lands under the
 * column), and it is not one: `ObservableQuery`'s own observer reports a result only
 * `if (equal(this.variables, variables))` -- the variables the request went out with against
 * the ones the query holds now (node_modules/@apollo/client/core/ObservableQuery.js, in
 * `reobserveAsConcast`). A refetch replaces those variables before it goes out, so the
 * superseded answer is dropped and never reaches this handler.
 *
 * ⛔ Which means the guard below rests on a foreign library's delivery rule. Measured, not
 * assumed -- but if a future Apollo stops dropping superseded answers, this is where it
 * shows: the column would take a paged answer as the newest bookings.
 */
const listPage = ref(1)
const newestTransactions = ref([])
const transactionCount = ref(0)
const transactionLinkCount = ref(0)
const openLinkCount = ref(0)
const pending = ref(true)
const skeleton = ref(true)
const totalUsers = ref(null)

// only error correction, normally skeleton should be visible less than 1500ms
onMounted(() => {
  // The member's hearts, once per session -- the rows that carry a heart read them from
  // the composable, so no booking query has to ask for them.
  ensureFavorites(apolloClient)
  setTimeout(() => {
    skeleton.value = false
  }, 1500)
})

const logoutUser = async () => {
  try {
    await useLogoutMutation()
    await store.dispatch('logout')
    await router.push('/login')
  } catch (err) {
    await store.dispatch('logout')
    if (router.currentRoute.value.path !== '/login') await router.push('/login')
  }
}

/**
 * A page turned on the transactions list -- or a page that changed something and wants the
 * numbers up here to catch up (`Send` after a transfer, the link summary after a link was
 * withdrawn).
 *
 * ⚠️ Defaults rather than bare destructuring, because both kinds of caller come through
 * here. `Send` calls it as `updateTransactions({})`; that used to reach Apollo as two
 * `undefined` variables, leaving the SERVER's defaults to decide which page a transfer left
 * the member on. The answer is the same one -- page one, `PAGE_SIZE` -- but it is now said
 * here, where the paginator's size is read from the same constant.
 */
const updateTransactions = (args = {}) => {
  const { currentPage = 1, pageSize = PAGE_SIZE } = args
  pending.value = true
  listPage.value = currentPage
  useRefetchTransactionsQuery({ currentPage, pageSize, order: 'DESC' })
  // ⚠️ The CALLER says whether a counterparty was involved, and only that refreshes the
  // contacts. Guessing it from the absence of a page number was close but not right: `Send`
  // calls this twice, once after a transfer and once after creating a LINK, and a link
  // names nobody -- so every link cost a contact-list round trip whose answer was identical.
  //
  // Measured at the call sites rather than at the emitters, because the two disagree here.
  // `GddTransactionList.askForPage` sends a page; `Send` sends `contactsChanged` on the
  // coins path only. `TransactionLinkSummary` emits with no argument at all and never
  // reaches this function: `GddTransactionList` is its only parent and intercepts it with
  // `@update-transactions="askForPage(currentPage)"`, which re-emits a page.
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
 * after a transfer, `Transactions` on paging. A payment made anywhere ELSE left the old
 * number standing on every screen the member visited afterwards -- and a thank you card
 * payment happens on its own page, at somebody else's till, and says nothing to this layout.
 *
 * ⚠️ Not a cache policy and not a page reload. The query already asks the server
 * (`network-only`); it simply never ran a second time. A reload would have hidden that by
 * throwing the whole application away, which is why it looked like an answer.
 *
 * ⛔ Refetched with the SECTION's own variables, and that is what puts a member back on page
 * one. It used to go out with no arguments so that Apollo would reuse whatever the query
 * already had, and the note here defended that as "somebody sitting on page three is not
 * sent back to page one" -- but this watch fires on a PATH change, and turning a page does
 * not change the path, so it never protected anybody sitting anywhere. What it did instead
 * was carry page three OUT of the list: the overview's column showed page three as the
 * member's newest bookings, and coming back to /transactions showed page three under a
 * paginator that had been rebuilt at page one, with the buttons back to page one disabled.
 * (Bernd, 30.08.2026.)
 */
watch(
  () => route.path,
  (path) => {
    // `path` is what changed; the answer is on the route record it changed to.
    const variables = listVariables(route.meta.transactionsPageSize)
    if (!variables) {
      return
    }
    pending.value = true
    listPage.value = 1
    useRefetchTransactionsQuery(variables)
  },
)

// The pictures shown beside the bookings. This is the only place the list arrives, and
// both places that draw a face are fed from here, so the fetching happens once for the
// whole page rather than once per row.
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
// rather than thrown away: a member who turns a page while a request is out paid for those
// bytes, and discarding them shows initials on a list whose portraits had already arrived.
const collectMemberAvatars = async (rows) => {
  await fetchMemberAvatars(
    apolloClient,
    rows.map((row) => row.linkedUser),
  )
}

onResult((value) => {
  if (value && value.data) {
    if (value.data.transactionList) {
      const tr = value.data.transactionList
      GdtBalance.value = tr.balance?.balanceGDT === null ? 0 : Number(tr.balance?.balanceGDT)
      transactions.value = tr.transactions || []
      // Only page one reaches the column beside the overview -- see `newestTransactions`.
      //
      // ⚠️ A copy of the array, not the array. Assigning it straight across left both refs
      // holding ONE array, so the column would silently follow any later in-place change to
      // the list -- a `.sort()` for display, an optimistic `.push()` -- without a fetch of
      // its own, which is the coupling this ref exists to end. The rows inside are shared;
      // only the array is not.
      if (listPage.value === 1) {
        newestTransactions.value = [...transactions.value]
      }
      collectMemberAvatars(transactions.value)
      balance.value = Number(tr.balance?.balance) || 0
      transactionCount.value = tr.balance?.count || 0
      transactionLinkCount.value = tr.balance?.linkCount || 0
      openLinkCount.value = tr.balance?.openLinkCount || 0
    }
    if (value.data.communityStatistics) {
      totalUsers.value = value.data.communityStatistics.totalUsers || 0
    }
  }
  pending.value = false
  skeleton.value = false
})

onError((error) => {
  transactionCount.value = -1
  // ⚠️ Cleared here too, not only on the way that succeeds. `pending` is handed to the page
  // inside the router-view, so a refetch that fails leaves that page waiting for something
  // that is never coming. It mattered less while only a deliberate action set it; since the
  // watch above sets it on every navigation to those two pages, one failed request would
  // strand whatever the member opened next.
  pending.value = false
  toastError(error.message)
})

const admin = () => {
  window.location.assign(CONFIG.ADMIN_AUTH_URL + store.state.token)
  store.dispatch('logout') // logout without redirect
}
</script>
<style>
.breadcrumb {
  background-color: transparent;
  padding: 0.75rem 1rem;
}

.main-page {
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url('/img/svg/Gradido_Blaetter_Mainpage.svg') !important;
}

.b-right {
  text-align: right;
}

.content-gradido {
  display: inline-flex;
  width: 100%;
  height: 91%;
  position: absolute;
}

.navbar-brand-img {
  height: 2rem;
  padding-left: 10px;
}

.bg-lightgrey {
  background-color: #f0f0f0 !important;
}

.bg-blueviolet {
  background-color: blueviolet !important;
}

.width70 {
  width: 70px;
}

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(4, 112, 6, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

/*
  ⛔ THIS NUMBER BELONGS TO THE NAVBAR'S HEIGHT. Below 450px the navbar is `position: fixed`
  and translucent (Menu/Navbar.vue), so whatever it covers is still readable -- which is why
  a mismatch here does not look broken, it looks smudged.

  ⚠️ And the clearance is TWO numbers on the SAME element: this padding plus the `margin-top`
  in Breadcrumb/breadcrumb.vue. Together they have to clear the navbar; neither alone says
  what it depends on. That is how the four till tools slipped past on 21.08.2026 -- their
  second row grew the brand block from about 88px to about 128px, the note at the time
  checked it against the block OPPOSITE (about 130px, so the navbar did not get taller than
  itself) and nobody held it against the room underneath. 48 + 55 = 103 was suddenly less
  than 128, and the heading sat under the last 25px. (Bernd found it on the phone, 23.08.)

  ⚠️ 48 + 69 = 117, and the last number is MEASURED ON THE DEVICE, not calculated. The sum
  first went to 131, from "about 128px" in the navbar's own note plus a little. Bernd looked
  at it on the phone: half of the added room was enough. So the ~128 was the overestimate,
  and 117 is what the navbar actually needs -- keep it that way round if this ever moves
  again, because the note over there is an estimate and the phone is not.

  Grow the navbar and this has to grow with it -- Navbar.spec.js fails when a fifth tool
  adds a third row.
*/
@media screen and (width <= 450px) {
  .breadcrumb {
    padding-top: 69px !important;
  }
}

/* Two columns of 44px, as on the phone. The margin lines the block up with the menu
   entries in the column below it -- it used to sit on the scanner alone, which was the
   same thing said in a place that could only ever hold one tool. */
.main-page .sidebar-quick-row {
  display: grid;
  grid-template-columns: repeat(2, 44px);
  margin-left: 8px;
}

/* Small to the eye, 44px to the pointer -- same rule as the gear inside the calculator.

   ⚠️ Written through the row: the style block of this layout is GLOBAL, so a bare class
   name would style the navbar's twins as well -- the desktop margin would shift the phone
   symbols. That is what the two names per tool used to be for; a descendant of
   `.sidebar-quick-row` cannot leave this layout, and it does not multiply with the tools.

   `flex-start` and `--icon-muted` for the same reasons as on the phone: the glyphs line up
   on their left edge, and the tone is the one the menu icons themselves carry --
   rgb(114 119 143) in both modes, not the near-black/near-white of the menu TEXT. */
.main-page .sidebar-quick-row > a {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 44px;
  font-size: 22px;
  color: var(--icon-muted);
}

.main-page .sidebar-quick-row > a:hover {
  color: var(--icon-muted);
  opacity: 0.7;
}
</style>
