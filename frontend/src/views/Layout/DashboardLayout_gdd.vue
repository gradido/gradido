<template>
  <div class="wrapper">
    <notifications></notifications>
    <side-bar @logout="logout" :balance="balance">
      <template slot="links">
        <b-nav-item href="#!" to="/overview">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('send') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/transactions">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('transactions') }}</b-nav-text>
        </b-nav-item>
        <b-nav-item href="#!" to="/profile">
          <b-nav-text class="p-0 text-lg text-muted">{{ $t('site.navbar.my-profil') }}</b-nav-text>
        </b-nav-item>
        <!--
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
            @update-balance="updateBalance"
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

function hasElement(className) {
  return document.getElementsByClassName(className).length > 0
}

function initScrollbar(className) {
  if (hasElement(className)) {
    new PerfectScrollbar(`.${className}`)
  } else {
    // try to init it later in case this component is loaded async
    setTimeout(() => {
      initScrollbar(className)
    }, 100)
  }
}

import DashboardNavbar from './DashboardNavbar.vue'
import ContentFooter from './ContentFooter.vue'
// import DashboardContent from './Content.vue';
import { FadeTransition } from 'vue2-transitions'
import communityAPI from '../../apis/communityAPI'

export default {
  components: {
    DashboardNavbar,
    ContentFooter,
    // DashboardContent,
    FadeTransition,
  },
  data() {
    return {
      balance: 0,
      GdtBalance: 0,
    }
  },
  methods: {
    initScrollbar() {
      let isWindows = navigator.platform.startsWith('Win')
      if (isWindows) {
        initScrollbar('sidenav')
      }
    },
    async logout() {
      const result = await loginAPI.logout(this.$store.state.session_id)
      // do we have to check success?
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
    async loadBalance() {
      const result = await communityAPI.balance(this.$store.state.session_id)
      if (result.success) {
        this.balance = result.result.data.balance // / 10000
      } else {
        // what to do when loading balance fails?
      }
    },
    async loadGDTBalance() {
      const result = await communityAPI.transactions(this.$store.state.session_id)
      if (result.success) {
        this.GdtBalance = result.result.data.gdtSum // / 10000
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
    this.loadBalance()
    this.loadGDTBalance()
  },
}
</script>
<style lang="scss"></style>
