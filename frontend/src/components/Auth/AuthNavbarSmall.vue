<template>
  <div class="navbar-small">
    <b-navbar>
      <b-navbar-nav>
        <b-nav-item to="/register" class="authNavbar">{{ $t('signup') }}</b-nav-item>
        <span class="mt-1">{{ $t('math.pipe') }}</span>
        <b-nav-item to="/login" class="authNavbar">{{ $t('signin') }}</b-nav-item>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: 'AuthNavbarSmall',
}
</script>
