<template>
  <div class="component-nabvar">
    <b-navbar toggleable="sm" type="dark" variant="success">
      <b-navbar-brand to="/">Adminbereich</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/user">Usersuche |</b-nav-item>
          <b-nav-item to="/creation">Mehrfachschöpfung</b-nav-item>
          <b-nav-item
            v-show="$store.state.openCreations > 0"
            class="h5 bg-danger"
            to="/creation-confirm"
          >
            | {{ $store.state.openCreations }} offene Schöpfungen
          </b-nav-item>
          <b-nav-item @click="wallet">Wallet</b-nav-item>
          <b-nav-item @click="logout">Logout</b-nav-item>
          <!-- <b-nav-item v-show="open < 1" to="/creation-confirm">| keine offene Schöpfungen</b-nav-item> -->
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
      // TODO
      // this.$emit('logout')
      /* this.$apollo
        .query({
          query: logout,
        })
        .then(() => {
          this.$store.dispatch('logout')
          this.$router.push('/logout')
        })
        .catch(() => {
          this.$store.dispatch('logout')
          if (this.$router.currentRoute.path !== '/logout') this.$router.push('/logout')
        })
      */
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
