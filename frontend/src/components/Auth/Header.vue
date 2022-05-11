<template>
  <div class="auth-header">
    <b-navbar toggleable="lg" class="p-0 pr-4">
      <b-img
        class="imgLogoBack"
        src="img/template/gradido_background_header.png"
        alt="start background image"
      ></b-img>
      <div class="p-3">
        <b-img class="imgLogo" :src="logo" alt="..." />
      </div>
      <b-img class="header-img d-block d-lg-none" :src="sheet"></b-img>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto" right>
          <b-nav-item href="https://gradido.net/de/" target="_blank">
            {{ $t('auth.navbar.overGradido') }}
          </b-nav-item>
          <b-nav-item class="ml-5">
            <b-link to="/register">{{ $t('signup') }} {{ $t('|') }}</b-link>
            <b-link to="/login">{{ $t('signin') }}</b-link>
          </b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>
<script>
export default {
  name: 'AuthHeader',
  data() {
    return {
      logo: 'img/brand/green.png',
      sheet: 'img/template/Blaetter.png',
    }
  },
}
</script>
<style lang="scss">
.imgLogoBack,
.imgLogo {
  position: absolute;
}
.imgLogo {
  z-index: 1000;
  width: 200px;
  max-width: 280px;
  top: 19px;
  left: 0px;
}

.imgLogoBack {
  width: 230px;
  max-width: 300px;
  height: auto;
  top: 0px;
}
.auth-header {
  font-family: 'Open Sans', sans-serif !important;
  position: sticky;
}
.navbar-collapse {
  margin-left: 20px;
}
.navbar-collapse li {
  padding-top: 10px;
  padding-bottom: 10px;
}

.header-img {
  position: absolute;
  top: -11px;
  right: 7%;
  max-width: 64%;
}

@media screen and (max-width: 450px) {
  .header-img {
    position: absolute;
    top: -15px;
    right: 0%;
    max-width: 61%;
  }
}

.navbar-toggler {
  z-index: 1;
}
</style>
