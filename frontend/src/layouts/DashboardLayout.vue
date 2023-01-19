<template>
  <div class="main-page">
    <div v-if="skeleton">
      <skeleton-overview />
    </div>
    <div v-else class="mx-lg-0">
      <!-- navbar -->
      <b-row>
        <b-col>
          <navbar class="main-navbar" :balance="balance"></navbar>
        </b-col>
      </b-row>
      <mobile-sidebar @admin="admin" @logout="logout" />

      <!-- Breadcrumb -->
      <b-row class="breadcrumb">
        <b-col cols="10" offset-lg="2">
          <breadcrumb />
        </b-col>
      </b-row>

      <b-row fluid class="d-flex">
        <!-- Sidebar left -->
        <b-col cols="2" class="d-none d-lg-block">
          <sidebar class="main-sidebar" @admin="admin" @logout="logout" />
        </b-col>
        <!-- ContentHeader && Content -->
        <b-col>
          <b-row class="px-lg-3">
            <b-col cols="12">
              <b-row class="d-lg-flex" cols="12">
                <!-- ContentHeader -->
                <b-col>
                  <content-header
                    :balance="balance"
                    :GdtBalance="GdtBalance"
                    :totalUsers="totalUsers"
                  >
                    <template #overview>
                      <b-row>
                        <b-col cols="12" lg="5">
                          <div>
                            <gdd-amount :balance="balance" :showStatus="false" :badgeShow="false" />
                          </div>
                        </b-col>
                        <b-col cols="12" lg="7">
                          <div>
                            <community-member :totalUsers="totalUsers" />
                          </div>
                        </b-col>
                      </b-row>
                    </template>
                    <template #send>
                      <b-row>
                        <b-col cols="12" lg="6">
                          <div>
                            <gdd-amount
                              :balance="balance"
                              :badge="true"
                              :showStatus="true"
                              :badgeShow="false"
                            />
                          </div>
                        </b-col>
                        <b-col cols="12" lg="6">
                          <div>
                            <router-link to="gdt">
                              <gdt-amount :GdtBalance="GdtBalance" :badgeShow="false" />
                            </router-link>
                          </div>
                        </b-col>
                      </b-row>
                    </template>
                    <template #transactions>
                      <b-row>
                        <b-col cols="12" lg="6">
                          <div>
                            <router-link to="transactions">
                              <gdd-amount :balance="balance" :showStatus="true" />
                            </router-link>
                          </div>
                        </b-col>
                        <b-col cols="12" lg="6">
                          <div>
                            <router-link to="gdt">
                              <gdt-amount :GdtBalance="GdtBalance" />
                            </router-link>
                          </div>
                        </b-col>
                      </b-row>
                    </template>
                    <template #gdt>
                      <b-row>
                        <b-col cols="12" lg="6">
                          <div>
                            <router-link to="transactions">
                              <gdd-amount :balance="balance" :showStatus="false" />
                            </router-link>
                          </div>
                        </b-col>
                        <b-col cols="12" lg="6">
                          <div>
                            <router-link to="gdt">
                              <gdt-amount
                                :badge="true"
                                :showStatus="true"
                                :GdtBalance="GdtBalance"
                              />
                            </router-link>
                          </div>
                        </b-col>
                      </b-row>
                    </template>
                    <template #community>
                      <nav-community />
                    </template>
                    <template #settings></template>
                  </content-header>
                </b-col>
              </b-row>
            </b-col>
            <!-- Right Side Mobil -->
            <b-col class="d-block d-lg-none">
              <right-side
                :transactions="transactions"
                :transactionCount="transactionCount"
                :transactionLinkCount="transactionLinkCount"
              >
                <template #transactions>
                  <last-transactions
                    :transactions="transactions"
                    :transactionCount="transactionCount"
                    :transactionLinkCount="transactionLinkCount"
                    @set-tunneled-email="setTunneledEmail"
                  />
                </template>
                <template #community>
                  <contribution-info />
                </template>
                <template #empty />
              </right-side>
            </b-col>
            <b-col cols="12">
              <!-- router-view -->
              <div class="main-content mt-lg-3 mt-0">
                <fade-transition :duration="200" origin="center top" mode="out-in">
                  <router-view
                    ref="router-view"
                    :balance="balance"
                    :GdtBalance="GdtBalance"
                    :transactions="transactions"
                    :transactionCount="transactionCount"
                    :transactionLinkCount="transactionLinkCount"
                    :pending="pending"
                    @update-transactions="updateTransactions"
                    @set-tunneled-email="setTunneledEmail"
                  ></router-view>
                </fade-transition>
              </div>
            </b-col>
          </b-row>
        </b-col>
        <!-- RightSide Desktop -->
        <b-col cols="3" class="d-none d-lg-block">
          <right-side
            :transactions="transactions"
            :transactionCount="transactionCount"
            :transactionLinkCount="transactionLinkCount"
          >
            <template #transactions>
              <last-transactions
                :transactions="transactions"
                :transactionCount="transactionCount"
                :transactionLinkCount="transactionLinkCount"
                @set-tunneled-email="setTunneledEmail"
              />
            </template>
            <template #community>
              <contribution-info />
            </template>
            <template #empty />
          </right-side>
        </b-col>
      </b-row>
      <b-row>
        <!-- footer -->
        <b-col>
          <content-footer v-if="!$route.meta.hideFooter"></content-footer>
        </b-col>
      </b-row>
      <session-logout-timeout @logout="logout"></session-logout-timeout>
    </div>
  </div>
</template>
<script>
import ContentHeader from '@/layouts/templates/ContentHeader.vue'
import Breadcrumb from '@/components/Breadcrumb/breadcrumb.vue'
import RightSide from '@/layouts/templates/RightSide.vue'
import SkeletonOverview from '@/components/skeleton/Overview.vue'
import Navbar from '@/components/Menu/Navbar.vue'
import Sidebar from '@/components/Menu/Sidebar.vue'
import MobileSidebar from '@/components/MobileSidebar/MobileSidebar.vue'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout.vue'
import { transactionsQuery, communityStatistics } from '@/graphql/queries'
import { logout } from '@/graphql/mutations'
import ContentFooter from '@/components/ContentFooter.vue'
import { FadeTransition } from 'vue2-transitions'
import CONFIG from '@/config'
import GddAmount from '@/components/Template/ContentHeader/GddAmount.vue'
import GdtAmount from '@/components/Template/ContentHeader/GdtAmount.vue'
import CommunityMember from '@/components/Template/ContentHeader/CommunityMember.vue'
import NavCommunity from '@/components/Template/ContentHeader/NavCommunity.vue'
import LastTransactions from '@/components/Template/RightSide/LastTransactions.vue'
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'

export default {
  name: 'DashboardLayout',
  components: {
    SkeletonOverview,
    ContentHeader,
    RightSide,
    Navbar,
    Sidebar,
    MobileSidebar,
    SessionLogoutTimeout,
    ContentFooter,
    FadeTransition,
    Breadcrumb,
    GddAmount,
    GdtAmount,
    CommunityMember,
    NavCommunity,
    LastTransactions,
    ContributionInfo,
  },
  data() {
    return {
      balance: 0,
      GdtBalance: 0,
      transactions: [],
      transactionCount: 0,
      transactionLinkCount: 0,
      pending: true,
      visible: false,
      tunneledEmail: null,
      hamburger: true,
      darkMode: false,
      skeleton: true,
      totalUsers: null,
    }
  },
  provide() {
    return {
      getTunneledEmail: () => this.tunneledEmail,
    }
  },
  created() {
    this.updateTransactions(0)
    this.getCommunityStatistics()
    setTimeout(() => {
      this.skeleton = false
    }, 1500)
  },
  methods: {
    async logout() {
      this.$apollo
        .mutate({
          mutation: logout,
        })
        .then(() => {
          this.$store.dispatch('logout')
          this.$router.push('/login')
        })
        .catch(() => {
          this.$store.dispatch('logout')
          if (this.$router.currentRoute.path !== '/login') this.$router.push('/login')
        })
    },
    async updateTransactions(pagination) {
      this.pending = true
      this.$apollo
        .query({
          query: transactionsQuery,
          variables: {
            currentPage: pagination.currentPage,
            pageSize: pagination.pageSize,
          },
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          const {
            data: { transactionList },
          } = result
          this.GdtBalance =
            transactionList.balance.balanceGDT === null
              ? null
              : Number(transactionList.balance.balanceGDT)
          this.transactions = transactionList.transactions
          this.balance = Number(transactionList.balance.balance)
          this.transactionCount = transactionList.balance.count
          this.transactionLinkCount = transactionList.balance.linkCount
          this.pending = false
        })
        .catch((error) => {
          this.pending = true
          this.transactionCount = -1
          this.toastError(error.message)
          // what to do when loading balance fails?
        })
    },
    async getCommunityStatistics() {
      this.$apollo
        .query({
          query: communityStatistics,
        })
        .then((result) => {
          this.totalUsers = result.data.communityStatistics.totalUsers
        })
        .catch(() => {
          this.toastError('communityStatistics has no result, use default data')
        })
    },
    admin() {
      window.location.assign(CONFIG.ADMIN_AUTH_URL.replace('{token}', this.$store.state.token))
      this.$store.dispatch('logout') // logout without redirect
    },
    setVisible(bool) {
      this.visible = bool
    },
    setTunneledEmail(email) {
      this.tunneledEmail = email
    },
  },
}
</script>
<style>
.breadcrumb {
  background-color: transparent;
}
.main-page {
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url(/img/svg/Gradido_Blaetter_Mainpage.svg) !important;
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

@media screen and (max-width: 450px) {
  .breadcrumb {
    padding-top: 60px;
  }
}
</style>
