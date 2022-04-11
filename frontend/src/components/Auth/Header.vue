<template>
  <div class="auth-header">
    <b-navbar :toggleable="toggleable" class="p-0">
      <div class="g-logo-radius bg-white p-3">
        <b-img :src="logo" height="40" alt="..." />
      </div>
      <b-img class="header-img d-block d-lg-none" :src="sheet"></b-img>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto" right>
          <b-nav-item @click="$emit('set-iframe-url', 'https://gradido.net/de/', true)">
            {{ $t('auth.navbar.overGradido') }}
          </b-nav-item>

          <!-- <b-nav-item>{{ $t('auth.navbar.greatCooperation') }}</b-nav-item>

          <b-nav-item>{{ $t('auth.navbar.podcast') }}</b-nav-item>

          <b-nav-item>{{ $t('auth.navbar.press') }}</b-nav-item>

          <b-nav-item>{{ $t('auth.navbar.contact') }}</b-nav-item>
          -->
          <b-nav-item to="/register" @click="$emit('set-iframe-url', '', false)">
            {{ $t('signup') }}
          </b-nav-item>

          <b-nav-item to="/login" @click="$emit('set-iframe-url', '', false)">
            {{ $t('signin') }}
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
      windowWidth: window.innerWidth,
      toggleable: false,
    }
  },
  watch: {
    windowWidth() {
      this.toggleable = false
      // if (this.windowWidth < 1458) this.toggleable = true
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
    })
  },
  methods: {
    onResize() {
      this.windowWidth = window.innerWidth
    },
  },
}
</script>
<style lang="scss">
.navbar-collapse {
  margin-left: 20px;
}
.navbar-collapse li {
  padding-top: 10px;
  padding-bottom: 10px;
}

.auth-header {
  position: sticky;
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
  z-index: 1;
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
