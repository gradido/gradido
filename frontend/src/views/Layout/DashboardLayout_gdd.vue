<template>
  <div>
    <side-bar @logout="logout" :balance="balance" :pending="pending">
      <template slot="links">
        <p></p>
        <sidebar-item
          :link="{
            name: $t('send'),
            path: '/overview',
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
    <div class="main-content" style="max-width:1000px">
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
          <!-- your content here -->
          <router-view
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
import PerfectScrollbar from 'perfect-scrollbar'
import 'perfect-scrollbar/css/perfect-scrollbar.css'
import loginAPI from '../../apis/loginAPI'

import ContentFooter from './ContentFooter.vue'
// import DashboardContent from './Content.vue';
import { FadeTransition } from 'vue2-transitions'
import communityAPI from '../../apis/communityAPI'
import VueQrcode from 'vue-qrcode'

function hasElement(className) {
  return document.getElementsByClassName(className).length > 0
}

function initScrollbar(className) {
  if (hasElement(className)) {
    // eslint-disable-next-line no-new
    new PerfectScrollbar(`.${className}`)
  } else {
    // try to init it later in case this component is loaded async
    setTimeout(() => {
      initScrollbar(className)
    }, 100)
  }
}

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
    initScrollbar() {
      const isWindows = navigator.platform.startsWith('Win')
      if (isWindows) {
        initScrollbar('sidenav')
      }
    },
    async logout() {
      await loginAPI.logout(this.$store.state.sessionId)
      // do we have to check success?
      this.$sidebar.displaySidebar(false)
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
    async updateTransactions(pagination) {
      this.pending = true
      const result = await communityAPI.transactions(
        this.$store.state.sessionId,
        pagination.firstPage,
        pagination.items,
      )
      if (result.success) {
        this.GdtBalance = Number(result.result.data.gdtSum)
        this.transactions = result.result.data.transactions
        this.balance = Number(result.result.data.decay)
        this.bookedBalance = Number(result.result.data.balance)
        this.transactionCount = result.result.data.count
        this.pending = false
      } else {
        this.pending = true
        // what to do when loading balance fails?
      }
    },
    updateBalance(ammount) {
      this.balance -= ammount
    },
  },
  mounted() {
    this.initScrollbar()
  },
}
</script>
<style lang="scss">
.xxx {
  position: relative;
  right: 0px;
}
</style>
