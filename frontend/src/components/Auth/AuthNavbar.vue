<template>
  <div class="auth-header position-sticky">
    <BNavbar :toggleable="false" :container="false" class="d-flex">
      <BNavbarBrand class="d-none d-lg-block">
        <BImg class="position-absolute p-2" :src="logo" width="200" alt="Logo" />
        <BImg :src="backgroundHeader" width="230" alt="Background Image"></BImg>
      </BNavbarBrand>
      <BImg class="sheet-img position-absolute d-block d-lg-none zindex1000" :src="sheet"></BImg>
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav class="ms-auto me-4 d-none d-lg-flex" right>
          <NavItem :to="routeWithParamsAndQuery('Register')" class="auth-navbar ms-lg-5">
            {{ $t('signup') }}
          </NavItem>
          <span class="d-none d-lg-block py-1">{{ $t('|') }}</span>
          <NavItem :to="routeWithParamsAndQuery('Login')" class="auth-navbar">
            {{ $t('signin') }}
          </NavItem>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </div>
</template>

<script setup>
import { useAuthLinks } from '@/composables/useAuthLinks'
import NavItem from '../Menu/NavItem.vue'

const { routeWithParamsAndQuery } = useAuthLinks()

const backgroundHeader = '/img/template/gradido_background_header.png'
const logo = '/img/brand/gradido-logo_200x59.png'
const sheet = '/img/template/Blaetter.png'
</script>

<style scoped lang="scss">
.auth-navbar {
  display: flex;
  align-content: center;
}

.auth-header {
  font-family: 'Open Sans', sans-serif !important;
  height: 150px;
  z-index: 1;
}

.auth-header > nav {
  padding: 0 !important;
}

.auth-header > nav > :deep(.navbar-brand) {
  padding: 0 !important;
}

:deep(#nav-collapse) {
  justify-content: flex-end;
}

.sheet-img {
  top: -11px;
  right: 7%;
  max-width: 64%;
}

@media screen and (width <= 1024px) {
  .auth-header {
    height: 100px;
  }
}

@media screen and (width <= 768px) {
  .auth-header {
    height: 70px;
  }
}

@media screen and (width <= 450px) {
  .sheet-img {
    top: -15px;
    right: 0%;
    max-width: 61%;
  }
}
</style>
