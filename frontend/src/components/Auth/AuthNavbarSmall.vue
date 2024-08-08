<template>
  <div class="navbar-small">
    <BNavbar class="navi">
      <BNavbarNav>
        <BNavItem :to="register()" class="auth-navbar">{{ $t('signup') }}</BNavItem>
        <span class="mt-1">{{ $t('math.pipe') }}</span>
        <BNavItem :to="login()" class="auth-navbar">{{ $t('signin') }}</BNavItem>
      </BNavbarNav>
    </BNavbar>
  </div>
</template>

<script setup>
import { useAuthLinks } from '@/composables/useAuthLinks'

const { login, register } = useAuthLinks()
</script>
<style scoped>
.navi {
  margin-left: 0;
  padding-left: 0;
}
</style>
