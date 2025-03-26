<template>
  <div class="main-page">
    <div v-if="skeleton">
      <skeleton-overview />
    </div>
    <div v-else class="mx-lg-0">
      <!-- navbar -->
      <BRow>
        <BCol>
          <navbar class="main-navbar" :balance="balance"></navbar>
        </BCol>
      </BRow>
      <mobile-sidebar @admin="admin" @logout="logoutUser" />

      <!-- Breadcrumb -->
      <BRow class="breadcrumb">
        <BCol cols="10" offset-lg="2">
          <breadcrumb />
        </BCol>
      </BRow>

      <BRow fluid class="d-flex">
        <!-- Sidebar left -->
        <BCol cols="2" class="d-none d-lg-block">
          <sidebar class="main-sidebar" @admin="admin" @logout="logoutUser" />
        </BCol>
        <!-- ContentHeader && Content -->
        <BCol>
          <BRow class="px-lg-3">
            <BCol cols="12">
              <BRow class="d-lg-flex" cols="12">
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
                            <gdd-amount
                              :balance="balance"
                              :show-status="false"
                              :badge-show="false"
                            />
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
                            <router-link to="transactions">
                              <gdd-amount :balance="balance" :show-status="true" />
                            </router-link>
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
                            <router-link to="gdt">
                              <gdt-amount
                                :badge="true"
                                :show-status="true"
                                :gdt-balance="GdtBalance"
                              />
                            </router-link>
                          </div>
                        </BCol>
                      </BRow>
                    </template>
                    <template #community>
                      <nav-community />
                    </template>
                    <template #settings></template>
                  </content-header>
                </BCol>
              </BRow>
            </BCol>
            <!-- Right Side Mobil -->
            <BCol class="d-block d-lg-none">
              <right-side>
                <template #transactions>
                  <last-transactions
                    :transactions="transactions"
                    :transaction-count="transactionCount"
                    :transaction-link-count="transactionLinkCount"
                  />
                </template>
                <template #community>
                  <community-template />
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
            <template #community>
              <community-template />
            </template>
          </right-side>
        </BCol>
      </BRow>
      <BRow>
        <!-- footer -->
        <BCol>
          <content-footer v-if="!$route.meta.hideFooter" />
        </BCol>
      </BRow>
      <session-logout-timeout @logout="logoutUser" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useLazyQuery, useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import ContentHeader from '@/layouts/templates/ContentHeader'
import CommunityTemplate from '@/layouts/templates/CommunityTemplate'
import Breadcrumb from '@/components/Breadcrumb/breadcrumb'
import RightSide from '@/layouts/templates/RightSide'
import SkeletonOverview from '@/components/skeleton/Overview'
import Navbar from '@/components/Menu/Navbar'
import Sidebar from '@/components/Menu/Sidebar'
import MobileSidebar from '@/components/MobileSidebar/MobileSidebar'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout'
import ContentFooter from '@/components/ContentFooter'
import GddAmount from '@/components/Template/ContentHeader/GddAmount'
import GdtAmount from '@/components/Template/ContentHeader/GdtAmount'
import CommunityMember from '@/components/Template/ContentHeader/CommunityMember'
import NavCommunity from '@/components/Template/ContentHeader/NavCommunity'
import LastTransactions from '@/components/Template/RightSide/LastTransactions'
import { transactionsQuery, communityStatistics } from '@/graphql/queries'
import { logout } from '@/graphql/mutations'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'

const store = useStore()
const router = useRouter()
const { load: useCommunityStatsQuery } = useLazyQuery(communityStatistics)
const {
  load: useTransactionsQuery,
  refetch: useRefetchTransactionsQuery,
  result: transactionQueryResult,
} = useLazyQuery(transactionsQuery, {}, { fetchPolicy: 'network-only' })
const { mutate: useLogoutMutation } = useMutation(logout)
const { t } = useI18n()
const { toastError } = useAppToast()

const balance = ref(0)
const GdtBalance = ref(0)
const transactions = ref([])
const transactionCount = ref(0)
const transactionLinkCount = ref(0)
const pending = ref(true)
const visible = ref(false)
const hamburger = ref(true)
const darkMode = ref(false)
const skeleton = ref(false)
const totalUsers = ref(null)

onMounted(() => {
  console.log('onMounted')
  updateTransactions({ currentPage: 1, pageSize: 10 })
  getCommunityStatistics()
  console.log('before setTimeout')

  /*setTimeout(() => {
    console.log('after setTimeout')
    console.log('skeleton', skeleton)
    skeleton.value = false
  }, 1500)*/
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

const updateTransactions = async ({ currentPage, pageSize }) => {
  pending.value = true
  try {
    await loadOrFetchTransactionQuery({ currentPage, pageSize })
    if (!transactionQueryResult) return
    const { transactionList } = transactionQueryResult.value
    GdtBalance.value =
      transactionList.balance.balanceGDT === null ? 0 : Number(transactionList.balance.balanceGDT)
    transactions.value = transactionList.transactions
    balance.value = Number(transactionList.balance.balance)
    transactionCount.value = transactionList.balance.count
    transactionLinkCount.value = transactionList.balance.linkCount
    pending.value = false
    // skeleton.value = false
  } catch (error) {
    pending.value = true
    transactionCount.value = -1
    toastError(error.message)
  }
}

const loadOrFetchTransactionQuery = async (queryVariables = { currentPage: 1, pageSize: 25 }) => {
  return (
    (await useTransactionsQuery(transactionsQuery, queryVariables)) ||
    (await useRefetchTransactionsQuery(queryVariables))
  )
}

const getCommunityStatistics = async () => {
  try {
    const result = await useCommunityStatsQuery()
    totalUsers.value = result.communityStatistics.totalUsers
  } catch {
    toastError(t('communityStatistics has no result, use default data'))
  }
}

const admin = () => {
  window.location.assign(CONFIG.ADMIN_AUTH_URL + store.state.token)
  store.dispatch('logout') // logout without redirect
}

const setVisible = (bool) => {
  visible.value = bool
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
  text-align: -webkit-right;
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
</style>
