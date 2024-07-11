<template>
  <div class="component-nabvar">
    <BNavbar toggleable="lg" type="dark" class="bg-dark">
      <BNavbarBrand class="mb-2" to="/">
        <img src="img/brand/gradido_logo_w.png" class="navbar-brand-img pl-2" alt="..." />
      </BNavbarBrand>

      <BNavbarToggle target="nav-collapse"></BNavbarToggle>

      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav>
          <BNavItem to="/user">{{ $t('navbar.user_search') }}</BNavItem>
          <BNavItem class="bg-color-creation" to="/creation-confirm">
            {{ $t('creation') }}
            <BBadge v-show="$store.state.openCreations > 0" variant="danger">
              {{ $store.state.openCreations }}
            </BBadge>
          </BNavItem>
          <BNavItem to="/contribution-links">
            {{ $t('navbar.automaticContributions') }}
          </BNavItem>
          <BNavItem to="/federation">
            {{ $t('navbar.instances') }}
          </BNavItem>
          <BNavItem to="/statistic">{{ $t('navbar.statistic') }}</BNavItem>
          <BNavItem @click="wallet">{{ $t('navbar.my-account') }}</BNavItem>
          <BNavItem @click="logout">{{ $t('navbar.logout') }}</BNavItem>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </div>
</template>
<script>
import CONFIG from '../config'
import { logout } from '../graphql/logout'
import { BNavbar, BCollapse, BNavbarNav, BNavItem, BNavbarBrand, BBadge } from 'bootstrap-vue-next'
export default {
  name: 'navbar',
  components: { BNavbar, BCollapse, BNavbarNav, BNavItem, BNavbarBrand, BBadge },
  methods: {
    async logout() {
      window.location.assign(CONFIG.WALLET_LOGIN_URL)
      // window.location = CONFIG.WALLET_LOGIN_URL
      this.$store.dispatch('logout')
      await this.$apollo.mutate({
        mutation: logout,
      })
    },
    wallet() {
      window.location = CONFIG.WALLET_AUTH_URL.replace('{token}', this.$store.state.token)
      this.$store.dispatch('logout') // logout without redirect
    },
  },
}
</script>
<style>
.navbar-brand-img {
  height: 2rem;
}
</style>
