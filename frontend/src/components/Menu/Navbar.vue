<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="info">
      <div class="navbar-brand">
        <router-link to="/overview">
          <img :src="logo" class="navbar-brand-img" alt="..." />
        </router-link>
      </div>
      <b-nav-text center>{{ balance }} GDD</b-nav-text>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="d-none d-md-flex d-sm-flex">
          <b-nav-item to="/overview">{{ $t('overview') }}</b-nav-item>
          <b-nav-item to="/send">{{ $t('send') }}</b-nav-item>
          <b-nav-item to="/transactions">{{ $t('transactions') }}</b-nav-item>
          <hr />
          <b-nav-item to="/overview" class="mb-3" active>Overview</b-nav-item>
          <b-nav-item to="/send" class="mb-3">Link</b-nav-item>
          <b-nav-item to="/transactions" class="mb-3">Another Link</b-nav-item>
          <b-nav-item to="/profile" class="mb-3" disabled>Disabled</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown right>
            <!-- Using 'button-content' slot -->
            <template #button-content>
              <em>
                {{ $store.state.email }}
              </em>
            </template>
            <b-dropdown-item to="/profile">{{ $t('site.navbar.my-profil') }}</b-dropdown-item>
            <b-dropdown-item @click="this.$emit('get-elopage-link')" target="_blank">
              {{ $t('members_area') }}
            </b-dropdown-item>
            <b-dropdown-item @click="this.$emit('admin')" target="_blank">
              {{ $t('admin_area') }}
            </b-dropdown-item>
            <b-dropdown-item href="/#" @click="this.$emit('logout')">
              {{ $t('logout') }}
            </b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>
<script>
export default {
  name: 'navbar',
  data() {
    return {
      logo: 'img/brand/green.png',
    }
  },
}
</script>
