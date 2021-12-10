<template>
  <div>
    <navbar
      class="main-navbar"
      :balance="balance"
      :visible="visible"
      @set-visible="setVisible"
      @get-elopage-link="getElopageLink"
      @admin="admin"
      @logout="logout"
    />
    <div class="content-gradido">
      <div class="d-none d-sm-none d-md-none d-lg-flex shadow-lg" style="width: 300px">
        <sidebar
          class="main-sidebar"
          @getElopageLink="getElopageLink"
          @admin="admin"
          @logout="logout"
        />
      </div>

      <div class="main-page ml-2 mr-2" style="width: 100%" @click="visible = false">
        <div class="main-content">
          <fade-transition :duration="200" origin="center top" mode="out-in">
            <router-view
              ref="router-view"
              :balance="balance"
              :gdt-balance="GdtBalance"
              :transactions="transactions"
              :transactionCount="transactionCount"
              :pending="pending"
              @update-balance="updateBalance"
              @update-transactions="updateTransactions"
            ></router-view>
          </fade-transition>
        </div>
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
      </div>
    </div>
  </div>
</template>
<script>
import Navbar from '../../components/Menu/Navbar.vue'
import Sidebar from '../../components/Menu/Sidebar.vue'
import { logout, transactionsQuery } from '../../graphql/queries'
import ContentFooter from './ContentFooter.vue'
import { FadeTransition } from 'vue2-transitions'
import CONFIG from '../../config'

export default {
  components: {
    Navbar,
    Sidebar,
    ContentFooter,
    FadeTransition,
  },
  data() {
    return {
      logo: 'img/brand/green.png',
      balance: 0,
      GdtBalance: 0,
      transactions: [],
      bookedBalance: 0,
      transactionCount: 0,
      pending: true,
      visible: false,
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
          this.GdtBalance = Number(transactionList.gdtSum)
          this.transactions = transactionList.transactions
          this.balance = Number(transactionList.decay)
          this.bookedBalance = Number(transactionList.balance)
          this.transactionCount = transactionList.count
          this.pending = false
        })
        .catch((error) => {
          this.pending = true
          this.$toasted.error(error.message)
          // what to do when loading balance fails?
        })
    },
    updateBalance(ammount) {
      this.balance -= ammount
    },
    admin() {
      window.location.assign(CONFIG.ADMIN_AUTH_URL.replace('$1', this.$store.state.token))
      this.$store.dispatch('logout') // logout without redirect
    },
    getElopageLink() {
      const pId = this.$store.state.publisherId
        ? this.$store.state.publisherId
        : CONFIG.DEFAULT_PUBLISHER_ID
      return encodeURI(
        this.$store.state.hasElopage
          ? `https://elopage.com/s/gradido/sign_in?locale=${this.$i18n.locale}`
          : `https://elopage.com/s/gradido/basic-de/payment?locale=${this.$i18n.locale}&prid=111&pid=${pId}&firstName=${this.$store.state.firstName}&lastName=${this.$store.state.lastName}&email=${this.$store.state.email}`,
      )
    },
    setVisible(bool) {
      this.visible = bool
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
</style>
