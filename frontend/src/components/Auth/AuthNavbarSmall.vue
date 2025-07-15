<template>
  <div class="navbar-small">
    <BNavbar class="navi">
      <BNavbarNav>
        <NavItem :to="routeWithParamsAndQuery('Register')" class="auth-navbar">{{ $t('signup') }}</NavItem>
        <span class="mt-1">{{ $t('|') }}</span>
        <NavItem :to="routeWithParamsAndQuery('Login')" class="auth-navbar">{{ $t('signin') }}</NavItem>
      </BNavbarNav>
    </BNavbar>
  </div>
</template>

<script setup>
import { useAuthLinks } from '@/composables/useAuthLinks'
import NavItem from '../Menu/NavItem.vue'

const { routeWithParamsAndQuery } = useAuthLinks()
</script>
<style scoped>
.navi {
  margin-left: 0;
  padding-left: 0;
}
</style>
