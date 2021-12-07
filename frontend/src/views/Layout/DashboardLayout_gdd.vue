<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="info">
      <div class="navbar-brand">
        <img :src="logo" class="navbar-brand-img" alt="..." />
      </div>
      <b-nav-text center>{{ balance }} GDD</b-nav-text>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/overview">{{ $t('overview') }}</b-nav-item>
          <b-nav-item to="/send">{{ $t('send') }}</b-nav-item>
          <b-nav-item to="/transactions">{{ $t('transactions') }}</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown right>
            <!-- Using 'button-content' slot -->
            <template #button-content>
              <em>
                {{ $store.state.email }}

                <span class="avatar">
                  <vue-qrcode
                    v-if="$store.state.email"
                    :value="$store.state.email"
                    type="image/png"
                  ></vue-qrcode>
                </span>
              </em>
            </template>
            <b-dropdown-item to="/profile">{{ $t('site.navbar.my-profil') }}</b-dropdown-item>
            <b-dropdown-item @click="getElopageLink" target="_blank">
              {{ $t('members_area') }}
            </b-dropdown-item>
            <b-dropdown-item target="_blank" @click="admin">{{ $t('admin_area') }}</b-dropdown-item>
            <b-dropdown-item href="/#" @click="logout">{{ $t('logout') }}</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <div class="container main-content" style="max-width: 1000px">
      <div @click="$sidebar.displaySidebar(false)">
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
</template>
<script>
import { logout, transactionsQuery } from '../../graphql/queries'
import ContentFooter from './ContentFooter.vue'
import { FadeTransition } from 'vue2-transitions'
import VueQrcode from 'vue-qrcode'
import CONFIG from '../../config'

export default {
  components: {
    ContentFooter,
    VueQrcode,
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
    }
  },
  methods: {
    async logout() {
      this.$apollo
        .query({
          query: logout,
        })
        .then(() => {
          this.$sidebar.displaySidebar(false)
          this.$store.dispatch('logout')
          this.$router.push('/login')
        })
        .catch(() => {
          this.$sidebar.displaySidebar(false)
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
  },
}
</script>
<style>
.navbar-brand-img {
  height: 2rem;
  padding-left: 10px;
}
</style>
