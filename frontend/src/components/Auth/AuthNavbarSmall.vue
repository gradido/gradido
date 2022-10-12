<template>
  <div class="navbar-small">
    <b-navbar class="navi">
      <b-navbar-nav>
        <b-nav-item :to="register" class="authNavbar">{{ $t('signup') }}</b-nav-item>
        <span class="mt-1">{{ $t('math.pipe') }}</span>
        <b-nav-item :to="login" class="authNavbar">{{ $t('signin') }}</b-nav-item>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: 'AuthNavbarSmall',
  computed: {
    login() {
      if (this.$route.params.code) return '/login/' + this.$route.params.code
      return '/login'
    },
    register() {
      if (this.$route.params.code) return '/register/' + this.$route.params.code
      return '/register'
    },
  },
}
</script>
<style scoped>
.navi {
  margin-left: 0px;
  padding-left: 0px;
}
</style>
