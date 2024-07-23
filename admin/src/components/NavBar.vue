<template>
  <div class="component-nabvar">
    <BNavbar toggleable="lg" variant="dark" v-b-color-mode="'light'">
      <BNavbarBrand class="mb-2" to="/">
        <img src="/img/brand/gradido_logo_w.png" class="navbar-brand-img pl-2" alt="..." />
      </BNavbarBrand>

      <BNavbarToggle target="navbar-toggle-collapse" />

      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav>
          <BNavItem to="/user">{{ $t('navbar.user_search') }}</BNavItem>
          <BNavItem class="bg-color-creation" to="/creation-confirm">
            {{ $t('creation') }}
            <BBadge v-show="openCreations > 0" variant="danger">
              {{ openCreations.value }}
            </BBadge>
          </BNavItem>
          <BNavItem to="/contribution-links">
            {{ $t('navbar.automaticContributions') }}
          </BNavItem>
          <BNavItem to="/federation">
            {{ $t('navbar.instances') }}
          </BNavItem>
          <BNavItem to="/statistic">{{ $t('navbar.statistic') }}</BNavItem>
          <BNavItem @click="handleWallet">{{ $t('navbar.my-account') }}</BNavItem>
          <BNavItem @click="handleLogout">{{ $t('navbar.logout') }}</BNavItem>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </div>
</template>
<script setup>
import CONFIG from '../config'
import { useStore } from 'vuex'
import { computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { logout } from '../graphql/logout'
import {
  BNavbar,
  BCollapse,
  BNavbarNav,
  BNavItem,
  BNavbarBrand,
  BBadge,
  BNavbarToggle,
  vBColorMode,
} from 'bootstrap-vue-next'

const store = useStore()

const openCreations = computed(() => store.state.openCreations)

const { mutate: executeLogout } = useMutation(logout)

const handleLogout = async () => {
  window.location.assign(CONFIG.WALLET_LOGIN_URL)
  // window.location = CONFIG.WALLET_LOGIN_URL
  store.dispatch('logout')
  await executeLogout()
}

const handleWallet = () => {
  window.location = CONFIG.WALLET_AUTH_URL.replace('{token}', store.state.token)
  store.dispatch('logout') // logout without redirect
}
</script>
<style lang="scss" scoped>
.navbar-brand-img {
  height: 2rem;
  padding-left: 10px;
}
</style>
