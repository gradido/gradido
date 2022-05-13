<template>
  <div class="navbar-small">
    <b-navbar>
      <b-collapse is-nav class="mt-lg-0 mt-md-5">
        <b-navbar-nav class="mx-auto mx-sm-auto mr-md-1">
          <b-nav-item class="ml-lg-5" to="/register">{{ $t('signup') }}</b-nav-item>
          <span class="mt-1">{{ $t('|') }}</span>
          <b-nav-item to="/login">{{ $t('signin') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>
<script>
export default {
  name: 'NavbarSmall',
}
</script>
