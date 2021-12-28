<template>
  <div class="component-nabvar">
    <b-navbar toggleable="md" type="dark" variant="success" class="p-3">
      <b-navbar-brand to="/">
        <img src="img/brand/green.png" class="navbar-brand-img" alt="..." />
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/">{{ $t('navbar.overview') }}</b-nav-item>
          <b-nav-item to="/user">{{ $t('navbar.user_search') }}</b-nav-item>
          <b-nav-item to="/creation">{{ $t('navbar.multi_creation') }}</b-nav-item>
          <b-nav-item
            v-show="$store.state.openCreations > 0"
            class="bg-color-creation p-1"
            to="/creation-confirm"
          >
            {{ $store.state.openCreations }} {{ $t('navbar.open_creation') }}
          </b-nav-item>
          <b-nav-item @click="wallet">{{ $t('navbar.wallet') }}</b-nav-item>
          <b-nav-item @click="logout">{{ $t('navbar.logout') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>
<script>
import CONFIG from '../config'

export default {
  name: 'navbar',
  methods: {
    logout() {
      this.$store.dispatch('logout')
      this.$router.push('/logout')
    },
    wallet() {
      window.location = CONFIG.WALLET_AUTH_URL.replace('$1', this.$store.state.token)
      this.$store.dispatch('logout') // logout without redirect
    },
  },
}
</script>
<style>
.navbar-brand-img {
  height: 2rem;
  padding-left: 10px;
}
.bg-color-creation {
  background-color: #cf1010dc;
}
</style>
