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
        <BCol cols="10" offset-lg="2">
          <breadcrumb />
        </BCol>
      </BRow>

      <!-- With the navbar and the heading gone there is nothing left to sit under,
           so the air goes here — on the row, where the menu and the content get it
           together and stay level. The phone gets none: there the map takes the edge. -->
      <BRow fluid class="d-flex" :class="bareTopSpace">
        <!-- Sidebar left -->
        <BCol cols="2" class="d-none d-lg-block">
          <!-- The calculator sits above the menu, level with the page heading -- small and
               unmarked on purpose: a tool for those who run a till, not a headline feature.
               Whoever needs it knows where it lives. (Bernd, 20.08.2026) -->
          <router-link
            to="/calculator"
            class="sidebar-calculator-quick"
            :aria-label="$t('navigation.calculator')"
            data-test="sidebar-calculator"
          >
            <i-mdi-calculator />
          </router-link>
          <sidebar
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
                            <router-link to="transactions">
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
                            <router-link to="gdt">
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
                            <router-link to="gdt">
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
                            <router-link to="transactions">
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
            <!-- Right Side Mobil -->
            <BCol :class="bareChrome ? 'd-none' : 'd-block d-lg-none'">
              <right-side>
                <!--
                  Empty on purpose, and it always was in effect: this column shows below
                  992px, while LastTransactions hides itself below 992px (d-none d-lg-block
                  on its own root). The two conditions never overlap, so the list mounted
                  here could not appear at any width -- it only rendered, and since the
                  faces arrived that meant building up to eight base64 pictures per pass
                  for a subtree nobody can see.

                  On a phone the booking list IS the page, so a second copy of it beside
                  the page has nothing to add. The desktop column below is the one that
                  shows.
                -->
                <template #transactions />
                <template #contributions>
                  <contributions-template />
                </template>
                <template #matching>
                  <matching-template />
                </template>
                <template #empty />
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
        <!-- RightSide Desktop -->
        <BCol cols="3" class="d-none d-lg-block">
          <right-side>
            <template #transactions>
              <last-transactions
                :transactions="transactions"
                :transaction-count="transactionCount"
                :transaction-link-count="transactionLinkCount"
              />
            </template>
            <template #empty />
            <template #contributions>
              <contributions-template />
            </template>
            <template #matching>
              <matching-template />
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
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useApolloClient, useQuery, useMutation } from '@vue/apollo-composable'
import ContentHeader from '@/layouts/templates/ContentHeader'
import ContributionsTemplate from '@/layouts/templates/ContributionsTemplate'
import MatchingTemplate from '@/layouts/templates/MatchingTemplate'
import Breadcrumb from '@/components/Breadcrumb/breadcrumb'
import RightSide from '@/layouts/templates/RightSide'
import SkeletonOverview from '@/components/skeleton/Overview'
import Navbar from '@/components/Menu/Navbar'
import Sidebar from '@/components/Menu/Sidebar'
import MobileSidebar from '@/components/MobileSidebar/MobileSidebar'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout'
import AliasFirstChoice from '@/components/AliasFirstChoice'
import ContentFooter from '@/components/ContentFooter'
import GddAmount from '@/components/Template/ContentHeader/GddAmount'
import GdtAmount from '@/components/Template/ContentHeader/GdtAmount'
import CommunityMember from '@/components/Template/ContentHeader/CommunityMember'
import LastTransactions from '@/components/Template/RightSide/LastTransactions'
import { transactionsUserCountQuery } from '@/graphql/transactions.graphql'
import { logout } from '@/graphql/mutations'
import { memberAvatars } from '@/graphql/queries'
import {
  claimMissingMemberAvatars,
  forgetWithdrawnMemberAvatars,
  memberAvatarStoreEpoch,
  rememberMemberAvatars,
} from '@/composables/useMemberAvatars'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'

const store = useStore()
const route = useRoute()
const { client: apolloClient } = useApolloClient()

// A route may bring its own head — the map does. Then the navbar, the page
// heading and the content header are just distance between you and what you came
// for, at every size. On a phone the map takes the whole screen, so the footer
// goes too; on desktop it stays, and the menu keeps the logo the navbar took with
// it. Every other route leaves these empty and is untouched.
const bareChrome = computed(() => Boolean(route.meta.bareChrome))
const chromeHidden = computed(() => (bareChrome.value ? 'd-none' : ''))
const mobileHidden = computed(() => (bareChrome.value ? 'd-none d-lg-block' : ''))
const bareTopSpace = computed(() => (bareChrome.value ? 'pt-lg-4' : ''))
const router = useRouter()
const {
  refetch: useRefetchTransactionsQuery,
  onError,
  onResult,
} = useQuery(
  transactionsUserCountQuery,
  { currentPage: 1, pageSize: 10, order: 'DESC' },
  { fetchPolicy: 'network-only' },
)
const { mutate: useLogoutMutation } = useMutation(logout)
const { toastError } = useAppToast()

const balance = ref(0)
const GdtBalance = ref(0)
const transactions = ref([])
const transactionCount = ref(0)
const transactionLinkCount = ref(0)
const openLinkCount = ref(0)
const pending = ref(true)
const skeleton = ref(true)
const totalUsers = ref(null)

// only error correction, normally skeleton should be visible less than 1500ms
onMounted(() => {
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

const updateTransactions = ({ currentPage, pageSize }) => {
  pending.value = true
  useRefetchTransactionsQuery({ currentPage, pageSize })
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
 * ⚠️ Refetched with NO arguments: Apollo then reuses the variables the query already has,
 * so somebody sitting on page three of their transactions is not sent back to page one.
 */
const PAGES_SHOWING_A_BALANCE = ['/overview', '/transactions']

watch(
  () => route.path,
  (path) => {
    if (!PAGES_SHOWING_A_BALANCE.includes(path)) {
      return
    }
    pending.value = true
    useRefetchTransactionsQuery()
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
  const members = rows
    .map((row) => row.linkedUser)
    .filter((member) => member?.gradidoID)
    .map(({ gradidoID, communityUuid, avatarUpdatedAt }) => ({
      gradidoID,
      communityUuid: communityUuid ?? null,
      avatarUpdatedAt: avatarUpdatedAt ?? null,
    }))
  if (!members.length) return

  forgetWithdrawnMemberAvatars(members)
  const { refs, done } = claimMissingMemberAvatars(members)
  if (!refs.length) return

  // Read before the request, compared after it. The one thing a late answer must never
  // survive is a logout in between -- see memberAvatarStoreEpoch.
  const epoch = memberAvatarStoreEpoch()
  try {
    const { data } = await apolloClient.query({
      query: memberAvatars,
      variables: { refs },
      // ⚠️ Not from the cache, ever. The request names members, not versions -- a member
      // who replaces their picture is asked for under exactly the same variables as
      // before, so a cached answer would hand back the picture they just replaced and the
      // new one would never arrive. The freshness decision is made against the date on the
      // list, before we get here; by this point the answer has to come from the server.
      //
      // `no-cache`, not `network-only`: both skip the cache on the way IN, but
      // network-only still writes the answer to it. MemberAvatar carries no id and there
      // are no type policies, so nothing normalises it -- every distinct ref list becomes
      // its own ROOT_QUERY entry holding a full copy of the base64, and nothing evicts it
      // before logout. Measured at 2.1 MB of dead payload over eight pages, on top of the
      // copy this module already keeps.
      fetchPolicy: 'no-cache',
    })
    if (epoch !== memberAvatarStoreEpoch()) return
    rememberMemberAvatars(data?.memberAvatars ?? [])
  } catch {
    // Initials this time round, and the next list asks again.
  } finally {
    // Whatever happened, these members are no longer being waited for. Without this a
    // failed request would leave them marked in flight and they would never be asked
    // about again on this page.
    done()
  }
}

onResult((value) => {
  if (value && value.data) {
    if (value.data.transactionList) {
      const tr = value.data.transactionList
      GdtBalance.value = tr.balance?.balanceGDT === null ? 0 : Number(tr.balance?.balanceGDT)
      transactions.value = tr.transactions || []
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

@media screen and (width <= 450px) {
  .breadcrumb {
    padding-top: 55px !important;
  }
}

/* Small to the eye, 44px to the pointer -- same rule as the gear inside the calculator.
   ⚠️ Named for THIS spot: the style block of this layout is global, so a shared class name
   would style the navbar's twin as well -- the desktop margin would shift the phone symbol. */
.sidebar-calculator-quick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-left: 8px;
  font-size: 22px;
  color: inherit;
  opacity: 0.65;
}

.sidebar-calculator-quick:hover {
  color: inherit;
  opacity: 1;
}
</style>
