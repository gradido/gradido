<template>
  <div class="component-nabvar">
    <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="light-dark">
      <BNavbarBrand class="mb-2" to="/">
        <img
          src="../../public/img/brand/gradido_logo_w.png"
          class="navbar-brand-img pl-2"
          alt="..."
        />
      </BNavbarBrand>

      <BNavbarToggle v-b-toggle.nav-collapse target="navbar-toggle-collapse" />

      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav>
          <BNavItem :active="isActive('user')" to="/user">
            {{ $t('navbar.user_search') }}
          </BNavItem>
          <BNavItem
            :active="isActive('creation-confirm')"
            class="bg-color-creation"
            to="/creation-confirm"
          >
            {{ $t('creation') }}
            <BBadge v-show="openCreations > 0" variant="danger">
              {{ openCreations }}
            </BBadge>
          </BNavItem>
          <BNavItem to="/contribution-links" :active="isActive('contribution-links')">
            {{ $t('navbar.automaticContributions') }}
          </BNavItem>
          <BNavItem to="/federation" :active="isActive('federation')">
            {{ $t('navbar.instances') }}
          </BNavItem>
          <BNavItem to="/statistic" :active="isActive('statistic')">
            {{ $t('navbar.statistic') }}
          </BNavItem>
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
  vBToggle,
  vBColorMode,
} from 'bootstrap-vue-next'
import { useRoute } from 'vue-router'

const store = useStore()
const route = useRoute()

const openCreations = computed(() => store.state.openCreations)

const { mutate: executeLogout } = useMutation(logout)

const handleLogout = async () => {
  window.location.assign(CONFIG.WALLET_LOGIN_URL)
  // window.location = CONFIG.WALLET_LOGIN_URL
  await store.dispatch('logout')
  await executeLogout()
}

const handleWallet = () => {
  window.location = CONFIG.WALLET_AUTH_URL.replace('{token}', store.state.token)
  store.dispatch('logout') // logout without redirect
}

const isActive = (tabRoute) => {
  return tabRoute === route.name
}
</script>
<style lang="scss" scoped>
.navbar-brand-img {
  height: 2rem;
  padding-left: 10px;
}
</style>

<style lang="scss">
.bg-light-dark {
  background-color: #343a40;
}
</style>
