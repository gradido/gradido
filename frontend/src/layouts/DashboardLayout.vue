<template>
  <div class="main-page">
    <div v-if="skeleton">
      <b-row class="text-center">
        <b-col>
          <b-skeleton-img no-aspect animation="wave" height="118px"></b-skeleton-img>
        </b-col>
        <b-col cols="6">
          <b-skeleton animation="wave" class="mt-4 pt-5"></b-skeleton>
        </b-col>
        <b-col>
          <div class="b-right m-4">
            <b-row>
              <b-col><b-skeleton type="avatar"></b-skeleton></b-col>
              <b-col>
                <b-skeleton></b-skeleton>
                <b-skeleton></b-skeleton>
              </b-col>
            </b-row>
          </div>
        </b-col>
      </b-row>
      <b-row class="text-center mt-5">
        <b-col>
          <b-skeleton animation="wave" width="85%"></b-skeleton>
          <b-skeleton animation="wave" width="55%"></b-skeleton>
          <b-skeleton animation="wave" width="70%"></b-skeleton>
        </b-col>
        <b-col cols="6">
          <b-skeleton animation="wave" width="85%"></b-skeleton>
          <b-skeleton animation="wave" width="55%"></b-skeleton>
          <b-skeleton animation="wave" width="70%"></b-skeleton>
          <b-skeleton animation="wave" width="85%"></b-skeleton>
          <b-skeleton animation="wave" width="55%"></b-skeleton>
          <b-skeleton animation="wave" width="70%"></b-skeleton>
        </b-col>
        <b-col>
          <b-skeleton animation="wave" width="85%"></b-skeleton>
          <b-skeleton animation="wave" width="55%"></b-skeleton>
          <b-skeleton animation="wave" width="70%"></b-skeleton>
        </b-col>
      </b-row>
    </div>
    <div v-else>
      <!--sm menu mobil hamburger button-->
      <div class="d-block d-lg-none d-md-none d-sm-block fixed-bottom h-15 width70 zindex1000">
        <b-button @click="toogleMobilMenu">
          <span v-if="hamburger" class="navbar-toggler-icon"></span>
          <span v-else><b-icon icon="x-square" aria-hidden="true"></b-icon></span>
        </b-button>
      </div>

      <b-row>
        <!-- navbar -->
        <b-col>
          <navbar-new class="main-navbar" :balance="balance"></navbar-new>
        </b-col>
      </b-row>
      <b-row fluid class="d-flex">
        <b-col cols="2" ref="sideMenuRow" class="d-none d-lg-block d-md-block zindex1000">
          <sidebar-new
            class="main-sidebar"
            @admin="admin"
            @logout="logout"
            @modeToggle="modeToggle"
          />
        </b-col>
        <b-col>
          <b-row>
            <b-col cols="12">
              <b-row class="d-lg-flex" cols="12">
                <b-col>
                  <content-header />
                </b-col>
              </b-row>
            </b-col>
            <b-col class="d-block d-lg-none">
              <right-side />
            </b-col>
            <b-col cols="12">
              <div class="main-content mt-3">
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
        </b-col>
        <b-col cols="2" class="d-none d-lg-block" align-self="stretch">
          <right-side />
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
import RightSide from '@/layouts/templates/RightSide.vue'
// import Navbar from '@/components/Menu/Navbar.vue'
import NavbarNew from '@/components/Menu/NavbarNew.vue'
// import Sidebar from '@/components/Menu/Sidebar.vue'
import SidebarNew from '@/components/Menu/SidebarNew.vue'
import SessionLogoutTimeout from '@/components/SessionLogoutTimeout.vue'
import { transactionsQuery } from '@/graphql/queries'
import { logout } from '@/graphql/mutations'
import ContentFooter from '@/components/ContentFooter.vue'
import { FadeTransition } from 'vue2-transitions'
import CONFIG from '@/config'

export default {
  name: 'DashboardLayout',
  components: {
    ContentHeader,
    RightSide,
    // Navbar,
    NavbarNew,
    // Sidebar,
    SidebarNew,
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
      hamburger: true,
      darkMode: false,
      skeleton: true,
    }
  },
  provide() {
    return {
      getTunneledEmail: () => this.tunneledEmail,
    }
  },
  created() {
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
    toogleMobilMenu() {
      // console.log(this.$refs.sideMenuRow.classList.contains('position-absolute'))

      this.$refs.sideMenuRow.classList.toggle('d-none')
      this.$refs.sideMenuRow.classList.toggle('position-absolute')
      // console.log(document.getElementById('component-sidebar'))
      document.getElementById('side-menu').classList.toggle('bg-lightgrey')
      this.hamburger ? (this.hamburger = false) : (this.hamburger = true)
    },
    dark() {
      document.getElementById('app').classList.add('dark-mode')
      document.querySelector('#app a').classList.add('dark-mode')
      this.darkMode = true
    },

    light() {
      document.getElementById('app').classList.remove('dark-mode')
      document.querySelector('#app a').classList.remove('dark-mode')
      this.darkMode = false
    },

    modeToggle() {
      if (this.darkMode || document.getElementById('app').classList.contains('dark-mode')) {
        this.light()
      } else {
        this.dark()
      }
    },
  },
  computed: {
    darkDark() {
      return this.darkMode && 'darkmode-toggled'
    },
  },
}
</script>
<style>
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
</style>
