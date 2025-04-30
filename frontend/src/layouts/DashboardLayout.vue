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
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
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
import { transactionsUserCountQuery } from '@/graphql/transactions.graphql'
import { logout } from '@/graphql/mutations'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'

const store = useStore()
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

onResult((value) => {
  if (value && value.data) {
    if (value.data.transactionList) {
      const tr = value.data.transactionList
      GdtBalance.value = tr.balance?.balanceGDT === null ? 0 : Number(tr.balance?.balanceGDT)
      transactions.value = tr.transactions || []
      balance.value = Number(tr.balance?.balance) || 0
      transactionCount.value = tr.balance?.count || 0
      transactionLinkCount.value = tr.balance?.linkCount || 0
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
