<template>
  <div>
    <side-bar @logout="logout" :balance="balance" :pending="pending">
      <template slot="links">
        <sidebar-item
          :link="{
            name: $t('overview'),
            path: '/overview',
          }"
        ></sidebar-item>
        <sidebar-item
          :link="{
            name: $t('send'),
            path: '/send',
          }"
        ></sidebar-item>
        <sidebar-item
          :link="{
            name: $t('transactions'),
            path: '/transactions',
          }"
        ></sidebar-item>
        <sidebar-item
          :link="{
            name: $t('site.navbar.my-profil'),
            path: '/profile',
          }"
        ></sidebar-item>
      </template>
    </side-bar>
    <div class="main-content" style="max-width: 1000px">
      <div class="d-none d-md-block">
        <b-navbar>
          <b-navbar-nav class="ml-auto">
            <b-nav-item>
              <b-media no-body class="align-items-center">
                <span class="pb-2 text-lg font-weight-bold">
                  {{ $store.state.email }}
                </span>
                <b-media-body class="ml-2">
                  <span class="avatar">
                    <vue-qrcode
                      v-if="$store.state.email"
                      :value="$store.state.email"
                      type="image/png"
                    ></vue-qrcode>
                  </span>
                </b-media-body>
              </b-media>
            </b-nav-item>
          </b-navbar-nav>
        </b-navbar>
      </div>

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

export default {
  components: {
    ContentFooter,
    VueQrcode,
    FadeTransition,
  },
  data() {
    return {
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
  },
}
</script>
