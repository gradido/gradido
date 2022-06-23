<template>
  <div>
    <navbar
      class="main-navbar"
      :balance="balance"
      :visible="visible"
      :pending="pending"
      :elopageUri="elopageUri"
      @set-visible="setVisible"
      @admin="admin"
      @logout="logout"
    />
    <div class="content-gradido">
      <div class="d-none d-sm-none d-md-none d-lg-flex shadow-lg gradido-width-300">
        <sidebar class="main-sidebar" :elopageUri="elopageUri" @admin="admin" @logout="logout" />
      </div>

      <div class="main-page w-100" @click="visible = false">
        <div class="main-content">
          <fade-transition :duration="200" origin="center top" mode="out-in">
            <router-view
              ref="router-view"
              :balance="balance"
              :gdt-balance="GdtBalance"
              :transactions="transactions"
              :transactionCount="transactionCount"
              :transactionLinkCount="transactionLinkCount"
              :pending="pending"
              @update-transactions="updateTransactions"
              @set-tunneled-email="setTunneledEmail"
            ></router-view>
          </fade-transition>
        </div>
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
        <session-logout-timeout @logout="logout"></session-logout-timeout>
      </div>
    </div>
  </div>
</template>
<script>
import Navbar from '@/components/Menu/Navbar.vue'
import Sidebar from '@/components/Menu/Sidebar.vue'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout.vue'
import { logout, transactionsQuery } from '@/graphql/queries'
import ContentFooter from '@/components/ContentFooter.vue'
import { FadeTransition } from 'vue2-transitions'
import CONFIG from '@/config'

export default {
  name: 'DashboardLayout',
  components: {
    Navbar,
    Sidebar,
    SessionLogoutTimeout,
    ContentFooter,
    FadeTransition,
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
    }
  },
  provide() {
    return {
      getTunneledEmail: () => this.tunneledEmail,
    }
  },
  methods: {
    async logout() {
      this.$apollo
        .query({
          query: logout,
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
  computed: {
    elopageUri() {
      const pId = this.$store.state.publisherId
        ? this.$store.state.publisherId
        : CONFIG.DEFAULT_PUBLISHER_ID
      return encodeURI(
        this.$store.state.hasElopage
          ? `https://elopage.com/s/gradido/sign_in?locale=${this.$i18n.locale}`
          : `https://elopage.com/s/gradido/basic-de/payment?locale=${this.$i18n.locale}&prid=111&pid=${pId}&firstName=${this.$store.state.firstName}&lastName=${this.$store.state.lastName}&email=${this.$store.state.email}`,
      )
    },
  },
}
</script>
<style>
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
  background-color: #f0f0f0;
}
</style>
