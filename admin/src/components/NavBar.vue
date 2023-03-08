<template>
  <div class="component-nabvar">
    <b-navbar toggleable="md" type="dark" variant="success">
      <b-navbar-brand class="mb-2" to="/">
        <img src="img/brand/gradido_logo_w.png" class="navbar-brand-img pl-2" alt="..." />
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/user">{{ $t('navbar.user_search') }}</b-nav-item>
          <b-nav-item class="bg-color-creation" to="/creation-confirm">
            {{ $t('creation') }}
            <b-badge v-show="$store.state.openCreations > 0" variant="danger">
              {{ $store.state.openCreations }}
            </b-badge>
          </b-nav-item>
          <b-nav-item to="/contribution-links">
            {{ $t('navbar.automaticContributions') }}
          </b-nav-item>
          <b-nav-item to="/statistic">{{ $t('navbar.statistic') }}</b-nav-item>
          <b-nav-item @click="wallet">{{ $t('navbar.my-account') }}</b-nav-item>
          <b-nav-item @click="logout">{{ $t('navbar.logout') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>
<script>
import CONFIG from '../config'
import { logout } from '../graphql/logout'

export default {
  name: 'navbar',
  methods: {
    async logout() {
      window.location.assign(CONFIG.WALLET_URL)
      // window.location = CONFIG.WALLET_URL
      this.$store.dispatch('logout')
      await this.$apollo.mutate({
        mutation: logout,
      })
    },
    wallet() {
      window.location = CONFIG.WALLET_AUTH_URL.replace('{token}', this.$store.state.token)
      this.$store.dispatch('logout') // logout without redirect
    },
  },
}
</script>
<style>
.navbar-brand-img {
  height: 2rem;
}
</style>
