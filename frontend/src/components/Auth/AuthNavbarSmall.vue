<template>
  <div class="navbar-small">
    <b-navbar class="navi">
      <b-navbar-nav>
        <b-nav-item :to="register" class="auth-navbar">{{ $t('signup') }}</b-nav-item>
        <span class="mt-1">{{ $t('math.pipe') }}</span>
        <b-nav-item :to="login" class="auth-navbar">{{ $t('signin') }}</b-nav-item>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import { authLinks } from '@/mixins/authLinks'

export default {
  name: 'AuthNavbarSmall',
  mixins: [authLinks],
}
</script>
<style scoped>
.navi {
  margin-left: 0;
  padding-left: 0;
}
</style>
