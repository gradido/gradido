<template>
  <div class="main-page bg-default">
    <div class="position-absolute w-100 h-100 bg-default">
      <!--<navbar
        class="main-navbar"
        :balance="balance"
        :visible="visible"
        :pending="pending"
        :elopageUri="elopageUri"
        @set-visible="setVisible"
        @admin="admin"
        @logout="logout"
      />-->
      <navbar-new class="main-navbar" :balance="balance"></navbar-new>

      <!-- menu mobil -->
      <div class="d-block d-lg-none d-md-none d-sm-block fixed-bottom h-15 width70 zindex1000">
        <b-button @click="toogleMobilMenu">
          <span v-if="hamburger" class="navbar-toggler-icon"></span>
          <span v-else><b-icon icon="x-square" aria-hidden="true"></b-icon></span>
        </b-button>
      </div>
      <b-container fluid class="pl-0 pl-lg-0 pl-md-2">
        <b-row>
          <b-col
            cols="1"
            lg="2"
            md="1"
            ref="sideMenu"
            class="d-none d-lg-block d-md-block position-absolute h-100 zindex10"
          >
            <!-- <sidebar
              class="main-sidebar"
              :elopageUri="elopageUri"
              @admin="admin"
              @logout="logout"
            /> -->
            <sidebar-new
              class="main-sidebar"
              @admin="admin"
              @logout="logout"
              @modeToggle="modeToggle"
            />
          </b-col>
          <b-col
            cols="12"
            lg="7"
            md="11"
            offset="0"
            offset-lg="2"
            offset-md="1"
            order-1
            class="bg-warning navbar"
          >
            <!-- content header -->
          </b-col>
          <b-col
            cols="12"
            lg="3"
            md="11"
            offset="0"
            offset-lg="0"
            offset-md="1"
            class="bg-info navbar"
            order-2
          >
            <!--rechtebox -->
          </b-col>
          <b-col cols="12" lg="7" md="11" offset="0" offset-lg="2" offset-md="1" order-1>
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
    toogleMobilMenu() {
      this.$refs.sideMenu.classList.toggle('d-none')
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
