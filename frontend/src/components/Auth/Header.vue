<template>
  <div class="auth-header">
    <b-navbar toggleable="lg" class="p-0">
      <div class="g-logo-radius bg-white p-3">
        <b-img :src="logo" height="40" alt="..." />
      </div>
      <b-img class="header-img d-block d-lg-none" :src="sheet"></b-img>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto" right>
          <b-nav-item-dropdown text="über Gradido"></b-nav-item-dropdown>

          <b-nav-item-dropdown text="Great Cooperation"></b-nav-item-dropdown>

          <b-nav-item href="#!">Podcast</b-nav-item>

          <b-nav-item-dropdown text="Presse"></b-nav-item-dropdown>

          <b-nav-item href="#">Kontakt</b-nav-item>

          <b-nav-item href="#!" @click="$emit('setAuthItem', 'AUTH_LOGIN')">Anmelden</b-nav-item>

          <b-nav-item href="#!" @click="$emit('setAuthItem', 'AUTH_REGISTER')">
            Registrieren
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
.auth-header {
  position: sticky;
}

.header-img {
  position: fixed;
  top: -359px;
  right: 13%;
  width: 385px;
}

.g-logo-radius {
  -webkit-border-top-right-radius: 77px;
  -webkit-border-bottom-right-radius: 137px;
  -webkit-border-bottom-left-radius: 0px;
  -moz-border-radius-topright: 77px;
  -moz-border-radius-bottomright: 137px;
  -moz-border-radius-bottomleft: 0px;
  border-top-right-radius: 77px;
  border-bottom-right-radius: 137px;
  border-bottom-left-radius: 0px;
}
</style>
