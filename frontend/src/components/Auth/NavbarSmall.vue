<template>
  <div class="navbar-small text-center">
    <b-navbar>
       <b-collapse is-nav class="mt-5 mt-lg-0">
        <b-navbar-nav class="ml-md-auto">
          <b-nav-item class="ml-lg-5" to="/register">{{ $t('signup') }}</b-nav-item>
          <span class="mt-3">{{ $t('|') }}</span>
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
