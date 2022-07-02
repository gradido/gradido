<template>
  <div>
    <div class="position-absolute w-100 h-100 bg-blueviolet">
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

      <b-container
        class="d-none d-lg-none d-md-block d-sm-none position-absolute h-100 width70 zindex10 bg-default"
      >
        menu mobil
      </b-container>
      <div
        class="d-block d-lg-none d-md-none d-sm-block fixed-bottom h-15 width70 zindex10 bg-default"
      >
        <b-button
        
        >
          <span class="navbar-toggler-icon"></span>
        </b-button>
      </div>
      <b-container fluid class="bg-primary pl-0 pl-lg-0 pl-md-6">
        <b-row>
          <b-col lg="2" class="d-none d-lg-block position-absolute h-100 bg-default">
            <sidebar
              class="main-sidebar"
              :elopageUri="elopageUri"
              @admin="admin"
              @logout="logout"
            />
          </b-col>
          <b-col cols="12" lg="7" offset="0" offset-lg="2" order-1 class="bg-warning navbar">
            content header
          </b-col>
          <b-col cols="12" lg="3" offset="0" offset-lg="0" class="bg-info navbar" order-2>
            rechtebox
          </b-col>
          <b-col cols="12" lg="7" offset="0" offset-lg="2" order-1>
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
          </b-col>
        </b-row>
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
        <session-logout-timeout @logout="logout"></session-logout-timeout>
      </b-container>
    </div>
  </div>
</template>
<script>
import Navbar from '@/components/Menu/Navbar.vue'
import Sidebar from '@/components/Menu/Sidebar.vue'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout.vue'
import { transactionsQuery } from '@/graphql/queries'
import { logout } from '@/graphql/mutations'
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
  background-color: #f0f0f0 !important;
}
.bg-blueviolet {
  background-color: blueviolet !important;
}
.width70 {
  width: 70px;
}
</style>
