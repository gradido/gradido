<template>
  <div class="auth-header position-sticky">
    <b-navbar :toggleable="false" class="pr-4">
      <b-img class="sheet-img position-absolute d-block d-lg-none zindex1000" :src="sheet"></b-img>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: 'AuthNavbar',
  data() {
    return {
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
