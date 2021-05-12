<template>
  <div class="wrapper">
    <notifications></notifications>
    <side-bar @logout="logout" :balance="balance">
      <template slot="links">
        <b-nav-item to="/overview">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('send') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item to="/transactions">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('transactions') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item class="d-lg-none">
          <b-nav-text class="pt-3"><language-switch /></b-nav-text>
        </b-nav-item>
        <!--
        <b-nav-item href="#!" to="/profile">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.my-profil') }}</b-nav-text>
        </b-nav-item>       
        <b-nav-item href="#!" to="/profileedit">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.settings') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/activity">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.activity') }}</b-nav-text>
        </b-nav-item>
        -->
      </template>
    </side-bar>
    <div class="main-content">
      <dashboard-navbar :type="$route.meta.navbarType"></dashboard-navbar>
      <div @click="$sidebar.displaySidebar(false)">
        <fade-transition :duration="200" origin="center top" mode="out-in">
          <!-- your content here -->
          <router-view
            :balance="balance"
            :gdt-balance="GdtBalance"
            :transactions="transactions"
            :transactionCount="transactionCount"
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

import DashboardNavbar from './DashboardNavbar.vue'
import ContentFooter from './ContentFooter.vue'
// import DashboardContent from './Content.vue';
import { FadeTransition } from 'vue2-transitions'
import communityAPI from '../../apis/communityAPI'
import LanguageSwitch from '@/components/LanguageSwitch.vue'

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
    DashboardNavbar,
    ContentFooter,
    // DashboardContent,
    FadeTransition,
    LanguageSwitch,
  },
  data() {
    return {
      balance: 0,
      GdtBalance: 0,
      transactions: [],
      bookedBalance: 0,
      transactionCount: 0,
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
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
    async updateTransactions() {
      const result = await communityAPI.transactions(this.$store.state.sessionId)
      if (result.success) {
        this.GdtBalance = Number(result.result.data.gdtSum)
        this.transactions = result.result.data.transactions
        this.balance = Number(result.result.data.decay)
        this.bookedBalance = Number(result.result.data.balance)
        this.transactionCount = result.result.data.count
      } else {
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
  created() {
    this.updateTransactions()
  },
}
</script>
<style lang="scss"></style>
