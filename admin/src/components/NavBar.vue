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
          <!-- <b-nav-item v-show="open < 1" to="/creation-confirm">| keine offene Schöpfungen</b-nav-item> -->
        </b-navbar-nav>
      </b-collapse>
      <b-navbar-brand href="http://localhost:3000/vue/login">Profilbereich</b-navbar-brand>
    </b-navbar>
  </div>
</template>
<script>
export default {
  name: 'navbar',
}
</script>
