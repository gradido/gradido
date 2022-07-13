<template>
  <div class="auth-header position-sticky">
    <b-navbar toggleable="lg" class="pr-4">
      <b-navbar-brand>
        <b-img
          class="imgLogo position-absolute ml--3 mt-lg--2 mt-3 p-2 zindex1000"
          :src="logo"
          width="200"
          alt="..."
        />
        <b-img
          class="imgLogoBack mt--3 ml--3"
          src="/img/template/gradido_background_header.png"
          width="230"
          alt="start background image"
        ></b-img>
      </b-navbar-brand>
      <b-img class="sheet-img position-absolute d-block d-lg-none zindex1000" :src="sheet"></b-img>
      <b-navbar-toggle target="nav-collapse" class="zindex1000"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav class="ml-5">
        <b-navbar-nav class="ml-auto" right>
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}`" target="_blank">
            {{ $t('auth.navbar.aboutGradido') }}
          </b-nav-item>
          <b-nav-item to="/register" class="authNavbar ml-lg-5">{{ $t('signup') }}</b-nav-item>
          <span class="d-none d-lg-block mt-1">{{ $t('math.pipe') }}</span>
          <b-nav-item to="/login" class="authNavbar">{{ $t('signin') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: 'AuthNavbar',
  data() {
    return {
      logo: '/img/brand/green.png',
      sheet: '/img/template/Blaetter.png',
    }
  },
}
</script>

<style lang="scss">
.authNavbar > .nav-link {
  color: #0e79bc !important;
}

.navbar-toggler {
  font-size: 2.25rem;
}

.authNavbar > .router-link-exact-active {
  color: #383838 !important;
}

button.navbar-toggler > span.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(4, 112, 6, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

.auth-header {
  font-family: 'Open Sans', sans-serif !important;
}

.sheet-img {
  top: -11px;
  right: 7%;
  max-width: 64%;
}

@media screen and (max-width: 450px) {
  .sheet-img {
    top: -15px;
    right: 0%;
    max-width: 61%;
  }
}
</style>
