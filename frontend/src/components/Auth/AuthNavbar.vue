<template>
  <div class="auth-header position-sticky">
    <b-navbar :toggleable="false" class="pr-4">
      <b-navbar-brand class="d-none d-lg-block">
        <b-img
          class="position-absolute ml--3 mt-lg--2 mt-3 p-2 zindex1000"
          :src="logo"
          width="200"
          alt="Logo"
        />
        <b-img
          class="mt--3 ml--3"
          :src="background_header"
          width="230"
          alt="Background Image"
        ></b-img>
      </b-navbar-brand>
      <b-img class="sheet-img position-absolute d-block d-lg-none zindex1000" :src="sheet"></b-img>
      <b-collapse id="nav-collapse" is-nav class="ml-5">
        <b-navbar-nav class="ml-auto d-none d-lg-flex" right>
          <b-nav-item :to="register" class="authNavbar ml-lg-5">{{ $t('signup') }}</b-nav-item>
          <span class="d-none d-lg-block mt-1">{{ $t('math.pipe') }}</span>
          <b-nav-item :to="login" class="authNavbar">{{ $t('signin') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import { authLinks } from '@/mixins/authLinks'

export default {
  name: 'AuthNavbar',
  mixins: [authLinks],
  data() {
    return {
      background_header: '/img/template/gradido_background_header.png',
      logo: '/img/brand/gradido-logo.png',
      sheet: '/img/template/Blaetter.png',
    }
  },
}
</script>

<style lang="scss">
.authNavbar > .nav-link {
  color: #0e79bc !important;
}

.authNavbar > .router-link-exact-active {
  color: #383838 !important;
}

.auth-header {
  font-family: 'Open Sans', sans-serif !important;
  height: 150px;
}

.sheet-img {
  top: -11px;
  right: 7%;
  max-width: 64%;
}

@media screen and (max-width: 1024px) {
  .auth-header {
    height: 100px;
  }
}

@media screen and (max-width: 768px) {
  .auth-header {
    height: 70px;
  }
}
@media screen and (max-width: 450px) {
  .sheet-img {
    top: -15px;
    right: 0%;
    max-width: 61%;
  }
}
</style>
